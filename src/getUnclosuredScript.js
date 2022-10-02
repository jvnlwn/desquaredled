"use strict";
// https://squaredle.app/api/static/version-release.json
// Returns: {version: "v2.8.16"}
Object.defineProperty(exports, "__esModule", { value: true });
// const _defineProperty = Object.defineProperty;
// Object.defineProperty = function __defineProperty () {};
// ${code};
// Object.defineProperty = _defineProperty;
const getUnclosuredScript = (squardleCode, puzzleKey) => {
    const re = /(\s*|\n*)\((\s*|\n*)function(\s*|\n*)\((\s*|\n*)\)(\s*|\n*)\{(?<code>(\n|.)+)\}(\s*|\n*)\)(\s*|\n*)\((\s*|\n*)\)/;
    const match = squardleCode.match(re);
    if (match && match.groups) {
        const { code } = match.groups;
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
    `;
        return modifiedCode;
    }
    else {
        throw Error("Failed to parse closure script.");
    }
};
exports.default = getUnclosuredScript;
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
