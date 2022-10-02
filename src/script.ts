import act from "./act"

console.log("act", act)

const [username, puzzleKey] = process.argv.slice(2)

console.log("username", username)

act({ username, puzzleKey })
