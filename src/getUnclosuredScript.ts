// https://squaredle.app/api/static/version-release.json
// Returns: {version: "v2.8.16"}

// Uncaught SyntaxError: Invalid regular expression: /([-()[]{}+?*.$^|,:#<!\])/: Nothing to repeat
// VM115:63 Uncaught SyntaxError: Invalid regular expression: /([-()[]{}+?*.$^|,:#<!\])/: Nothing to repeat

// fetch("https://squaredle.app/api/index.php", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9",
//     "content-type": "text/plain;charset=UTF-8",
//     "sec-ch-ua": "\"Chromium\";v=\"104\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"104\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"macOS\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-origin"
//   },
//   "referrer": "https://squaredle.app/",
//   "referrerPolicy": "strict-origin-when-cross-origin",
//   "body": "{\"op\":\"syncSolution\",\"args\":{\"puzzleId\":277,\"words\":[\"stick\",\"sick\",\"snot\",\"stop\",\"post\",\"pots\",\"sock\",\"cops\",\"nock\",\"nonstick\",\"tick\",\"tops\",\"tons\",\"tock\",\"ions\",\"icon\",\"icons\",\"kits\",\"cost\",\"cots\",\"cons\",\"stoic\",\"stock\",\"spot\",\"posit\"],\"optionalWords\":[],\"nonWordCount\":0,\"ms\":124272,\"shared\":false,\"revealsUsed\":0,\"version\":\"v2.8.22\",\"isBetaPuzzle\":false,\"changeId\":0,\"uuid\":\"559b9ea0-22f3-42aa-901b-835c2a07b8c9\"}}",
//   "method": "POST",
//   "mode": "cors",
//   "credentials": "include"
// });

import fs from "fs"
import path from "path"

// const _defineProperty = Object.defineProperty;
// Object.defineProperty = function __defineProperty () {};
// ${code};
// Object.defineProperty = _defineProperty;

const getUnclosuredScript = (
  squardleCode: string,
  puzzleKey: string
): string => {
  const re =
    /(\s*|\n*)\((\s*|\n*)function(\s*|\n*)\((\s*|\n*)\)(\s*|\n*)\{(?<code>(\n|.)+)\}(\s*|\n*)\)(\s*|\n*)\((\s*|\n*)\)/
  const match = squardleCode.match(re)

  if (match && match.groups) {
    const { code } = match.groups
    const modifiedCode = `
      ${code};
      
      function _getPuzzleManager() {
        return new Promise(resolve => {
          const puzzleKey = ${puzzleKey ? `"${puzzleKey}"` : null}
          if (puzzleKey) {
            api.getPuzzleByKey(puzzleKey).then(result => {
              pm = new PuzzleManager()
              pm.setSpecialPuzzle(puzzleKey, result.puzzle)
              resolve(pm)
            })
          } else {
            resolve(gPuzzleManager)
          }
        })
      }
    
      _getPuzzleManager().then((pm)=> {
        window._solution = {
          words: pm.puzzle.words,
          optionalWords: pm.puzzle.optionalWords,
          board: pm.puzzle.board
        }
      })
    `

    return modifiedCode
  } else {
    throw Error("Failed to parse closure script.")
  }
}

export default getUnclosuredScript

// testCode = `function test () {
//   var a = "b\nc"
// }`

// // testCode is now 'function test () {\n  var a = "b\nc"\n}'

// // Fails: "Uncaught SyntaxError: Invalid or unexpected token"
// eval(testCode)

// // The newline in "b\nc" is evaluated and creates an invalid JS expression:
// // "b
// // c"
// // Strings created with double or single quotes cannot span newlines

// // Works: but is naive and can fail when matching a newline character
// in a regulular expression, for example
// eval(testCode.replace(/\n/g, ""))
