// TODO: BEAST this 10x10 puzzle: https://squaredle.app/?puzzle=10x10
// api.getPuzzleByKey("10x10")

// TODO: setup achievements json in localstorage:

// {
//   "perfect": {
//       "value": 0
//   },
//   "share": {
//       "value": 0
//   },
//   "speedy": {
//       "value": 0
//   },
//   "speedy5": {
//       "value": 0
//   },
//   "kofi": {
//       "value": 0
//   },
//   "finishFriday": {
//       "value": 0
//   },
//   "finishSunday": {
//       "value": 0
//   },
//   "longWordFirst": {
//       "value": 0
//   },
//   "longBonusWord": {
//       "value": 0
//   },
//   "finish5": {
//       "value": 0
//   },
//   "finish20": {
//       "value": 0
//   },
//   "finish50": {
//       "value": 0
//   },
//   "finishWeek": {
//       "value": 0
//   },
//   "languageLearner": {
//       "value": 0
//   },
//   "languageExplorer": {
//       "value": 0
//   },
//   "noRotate": {
//       "value": 1
//   },
//   "feedback": {
//       "value": 0
//   },
//   "rotator": {
//       "value": 0
//   },
//   "timeTraveler": {
//       "value": 0
//   },
//   "dejaVu": {
//       "value": 0
//   }
// }

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
import getUnclosuredScript from "./getUnclosuredScript"
import { getPossibleWords } from "./main"
import { rejects } from "assert"
import fs from "fs"

export default async ({ username, puzzleKey } = {}) => {
  // const url = "https://squaredle.app/?puzzle=10x10"
  let url = "https://squaredle.app"

  if (puzzleKey) {
    url += `?puzzle=${puzzleKey}`
  }

  console.log("username", username)

  let userData = null
  if (username) {
    try {
      userData = JSON.parse(
        fs.readFileSync(path.join(__dirname, `profiles/${username}.json`))
      )
      console.log("user config: ", userData)
    } catch (error) {
      console.log(`Unable to find profile for username: "${username}"`)
    }
  }

  let wordsFound = 0

  const waitFor = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  const getClosureScript = async (page, endpoint) => {
    const js = await page.evaluate(
      (endpoint) =>
        new Promise((resolve, reject) => {
          window.fetch(endpoint, { method: "GET" }).then((resp) => {
            resp.text().then((js) => {
              try {
                resolve(js)
              } catch (error) {
                reject(error)
              }
            })
          })
        }),
      endpoint
    )

    let unclosuredJS = ""

    if (js && typeof js === "string") {
      unclosuredJS = getUnclosuredScript(js, puzzleKey)
    }

    return unclosuredJS
  }

  const getPuzzleConfig = async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--shm-size=3gb"]
    })
    const page = await browser.newPage()

    // Debug
    page.on("console", (msg: ConsoleMessage) => console.log(msg.text()))

    const getClosureScriptConfig = () =>
      new Promise((resolve) => {
        let intercepting = true
        page.setRequestInterception(true)
        page.on("request", (request) => {
          const re =
            /https:\/\/squaredle\.app\/closure-(?<version>v[0-9-]+)\.js/
          const url = request.url()
          const match = url.match(re)

          if (match && match.groups && intercepting) {
            // TODO: try to stop intercepting requests.
            intercepting = false
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
    const [closureScriptConfig] = await Promise.all([
      getClosureScriptConfig(),
      page.goto(url)
    ])

    // page.setRequestInterception(true)

    let filename = closureScriptConfig.version
    if (puzzleKey) filename = `${closureScriptConfig.version}-${puzzleKey}`

    const filepath = path.join(__dirname, `closure-scripts/${filename}.js`)

    if (!fs.existsSync(filepath)) {
      const unclosuredJS = await getClosureScript(page, closureScriptConfig.url)
      fs.writeFileSync(filepath, unclosuredJS)
    }

    // const filepath = path.join(__dirname, "squardleCode.js")
    await page.addScriptTag({ path: require.resolve(filepath) })

    const getSolution = async () => {
      return new Promise((resolve) => {
        let solution = null
        const interval = setInterval(async () => {
          solution = await page.evaluate(() => window._solution)
          if (solution) {
            clearInterval(interval)
            resolve(solution)
          }
        }, 100)
      })
    }

    const solution = await getSolution()

    const dictionary = [
      ...solution.optionalWords.sort(),
      ...solution.words.sort()
    ]

    const letters = solution.board.reduce(
      (acc, row) => [...acc, ...row.split("")],
      []
    )

    await browser.close()

    return { dictionary, letters }
  }

  const act = async () => {
    console.log("obtaining puzzle config...")
    const { dictionary, letters } = await getPuzzleConfig()

    const rowCount = Math.sqrt(letters.length)
    const points = letters.map((letter, i) => ({
      x: (i % rowCount) + 1,
      y: Math.ceil((i + 1) / rowCount),
      letter
    }))
    console.log("letters:", letters)
    console.log("points:", points)
    console.log("dictionary:", dictionary)
    console.log("deriving letter sequences...")
    let possibleWords = getPossibleWords(points, dictionary)
    console.log("letter sequences:", possibleWords)

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--shm-size=3gb"]
    })
    const page = await browser.newPage()

    // Debug
    page.on("console", (msg: ConsoleMessage) => console.log(msg.text()))

    await page.evaluateOnNewDocument((userData) => {
      localStorage.clear()
      localStorage.setItem("squaredle-didTutorial", "skipped")
      localStorage.setItem("squaredle-isPermaClosed-levelUpAdept", "true")
      localStorage.setItem("squaredle-isPermaClosed-levelUpExpert", "true")
      localStorage.setItem("squaredle-isPermaClosed-levelUpHints", "true")
      localStorage.setItem("squaredle-isPermaClosed-levelUpComplete", "true")
      localStorage.setItem("squaredle-initializedAchievements2", "true")
      localStorage.setItem("squaredle-showedFeatureMessage6", "true")

      if (userData) {
        // localStorage.setItem("squaredle-isPremium", "true")
        localStorage.setItem("squaredle-userId", userData.userId)
        localStorage.setItem("squaredle-uuid", userData.uuid)
      }

      // localStorage.setItem("squaredle-isPremium", "true")
      // localStorage.setItem("squaredle-userId", "228946")
      // localStorage.setItem(
      //   "squaredle-uuid",
      //   "026a6278-ac9e-43f1-9099-a10877a1cfc2"
      // )
    }, userData)

    await page.goto(url)

    const styleTagHandle = await page.addStyleTag({
      content: `.popup, #overlay {
          display: none !important;
        }
        #game {
          filter: none !important;
        }
        * {
          animation: none !important;
        }
        `
    })

    // const letters = await page.evaluate(() => {
    //   const letterNodes = [
    //     ...document.querySelectorAll("#board .letterContainer")
    //   ]
    //   const texts = letterNodes.map(
    //     (node) => node.textContent?.toLowerCase()?.trim() || ""
    //   )
    //   const letters = texts.filter((text) => {
    //     const possibleLetters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", ""] // prettier-ignore
    //     return possibleLetters.includes(text)
    //   })
    //   return letters
    // })

    const letterNodes = await page.$$("#board .letterContainer")

    page.exposeFunction("dragOverWord", async (possibleWord) => {
      // const letterNodes = await page.$$("#board .letterContainer")

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
        // await page.mouse.down()
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

    for (let i = 0; i < possibleWords.length; i++) {
      // await page.evaluate(() => {
      //   const q = document.querySelectorAll(".letterContainer")[13]
      //   q.classList.add("unnecessaryOnFirstLoad", "unnecessary", "used")
      // }, [])
      const possibleWord = possibleWords[i]
      await page.evaluate((possibleWord) => {
        return window.dragOverWord(possibleWord)
      }, possibleWord)
    }

    await page.evaluate((style) => style.remove(), styleTagHandle)

    await waitFor(1200000)
    await browser.close()
  }

  await act()

  return { words: dictionary.length, wordsFound }
}

// getPuzzleSolution()
