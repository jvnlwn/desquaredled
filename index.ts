// NOTE: you can have VSC automatically watch your tsc files and recompile using the command:
// CMD + SHIFT + B "tsc: watch"
const act = require("./src/act").default

exports.handler = async (event = {}) => {
  const result = await act(event.username, event.puzzleKey)
  return result
}
