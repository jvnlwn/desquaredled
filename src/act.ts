// TODO: BEAST this 10x10 puzzle: https://squaredle.app/?puzzle=10x10

interface Solution {
  words: string[]
  optionalWords: string[]
}

declare global {
  interface Window {
    _solution: Solution
  }
}

import puppeteer, { JSHandle } from "puppeteer"
import type { ConsoleMessage } from "puppeteer"
import path from "path"
import fetch from "puppeteer-fetch"
import writeDictionary from "./writeDictionary"
import { getPossibleWords } from "./main"
import { rejects } from "assert"

const url = "https://squaredle.app/"

const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

const handleClosureScript = async () => {
  const browser = await puppeteer.launch({
    headless: false
  })
  const page = await browser.newPage()

  const getVersion = () =>
    new Promise((resolve) => {
      page.setRequestInterception(true)
      page.on("request", (request) => {
        const re = /https:\/\/squaredle\.app\/closure-(?<version>v[0-9-]+)\.js/
        const url = request.url()
        const match = url.match(re)

        if (match && match.groups) {
          const { version } = match.groups
          // Prevent the closure script request from fulfilling
          request.abort()
          resolve({ version, url })
          return
        }
        request.continue()
      })
    })

  // Must setup the request interception before going to the url.
  const [closureScriptInfo] = await Promise.all([getVersion(), page.goto(url)])

  // await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });

  await waitFor(3000)
  await browser.close()
}

const act = async () => {
  const browser = await puppeteer.launch({
    headless: false
  })
  const page = await browser.newPage()

  // Debug
  page.on("console", (msg: ConsoleMessage) => console.log(msg.text()))

  await page.evaluateOnNewDocument(() => {
    localStorage.clear()
    localStorage.setItem("squaredle-didTutorial", "skipped")
  })

  await page.goto(url)

  const js = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const versionNode = document.getElementById("version")
        const version = versionNode ? versionNode.innerText : ""
        const endpoint = `https://squaredle.app/closure-${version.replace(
          /\./g,
          "-"
        )}.js`

        window.fetch(endpoint, { method: "GET" }).then((resp) => {
          resp.text().then((js) => {
            try {
              resolve(js)
            } catch (error) {
              reject(error)
            }
          })
        })

        console.log("version", version)
      })
  )

  if (js && typeof js === "string") {
    writeDictionary(js)
  }

  const filepath = path.join(__dirname, "unclosured.js")
  // const filepath = path.join(__dirname, "squardleCode.js")
  await page.addScriptTag({ path: require.resolve(filepath) })
  const styleTagHandle = await page.addStyleTag({
    content: `.popup, #overlay {
        display: none !important;
      }
      #game {
        filter: none !important;
      }`
  })

  const solution = await page.evaluate(() => {
    while (!window._solution) {}
    return window._solution
  })

  const letters = await page.evaluate(() => {
    const letterNodes = [
      ...document.querySelectorAll("#board .letterContainer")
    ]
    const texts = letterNodes.map(
      (node) => node.textContent?.toLowerCase()?.trim() || ""
    )
    const letters = texts.filter((text) => {
      const possibleLetters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", ""] // prettier-ignore
      return possibleLetters.includes(text)
    })
    return letters
  })

  console.log("letters", letters)

  const rowCount = Math.sqrt(letters.length)
  const points = letters.map((letter, i) => ({
    x: (i % rowCount) + 1,
    y: Math.ceil((i + 1) / rowCount),
    letter
  }))
  console.log("points", points)
  const dictionary = [
    ...solution.optionalWords.sort(),
    ...solution.words.sort()
  ]
  console.log("dictionary", dictionary)
  const possibleWords = getPossibleWords(points, dictionary)

  let wordsFound = 0
  page.exposeFunction("dragOverWord", async (possibleWord) => {
    const letterNodes = await page.$$("#board .letterContainer")

    const moveMouse = async (node) => {
      const boundingBox = await node.boundingBox()
      // Move to the center of the letter node.
      await page.mouse.move(
        boundingBox.x + boundingBox.width / 2,
        boundingBox.y + boundingBox.height / 2
      )
    }

    for (let i = 0; i < possibleWord.length; i++) {
      const point = possibleWord[i]
      // Establish the index of the letter in the flat letters list based on the grid x and y values of the point.
      const index =
        (point.y - 1) * Math.sqrt(letterNodes.length) + (point.x - 1)
      const node = letterNodes[index]
      // For any letter, move to it.
      await moveMouse(node)
      // For the first letter, push mouse down.
      if (i === 0) await page.mouse.down()
      // For the last letter, lift mouse up.
      if (i === possibleWord.length - 1) await page.mouse.up()
    }

    // Wait to advance to the next word until the current word has been recorded.
    // This seems to ensure we don't miss a word, maybe due to being to fast.
    let currentWordsFound = wordsFound
    while (wordsFound === currentWordsFound) {
      const curWordCountEl = await page.$("#curWordCount")
      const curObscureWordCountEl = await page.$("#curObscureWordCount")
      const curWordCount = await curWordCountEl?.evaluate(
        (el) => el.textContent
      )
      const curObscureWordCount = await curObscureWordCountEl?.evaluate(
        (el) => el.textContent
      )

      wordsFound =
        parseInt(curWordCount || 0) + parseInt(curObscureWordCount || 0)
    }
  })

  // Wait for board to be  ready.
  await page.$$("#board .letterContainer")

  for (let i = 0; i < possibleWords.slice(0, 10).length; i++) {
    const possibleWord = possibleWords[i]
    await page.evaluate((possibleWord) => {
      return window.dragOverWord(possibleWord)
    }, possibleWord)
  }

  await page.evaluate((style) => style.remove(), styleTagHandle)

  await waitFor(120000)
  await browser.close()
}

act()
// handleClosureScript()
