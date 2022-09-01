// TODO: the dictionary is quite limited ("arts" or "tarts" do not exist).
// Might want to give this API a try, or find a better downloadable source.
// https://www.wordsapi.com/

// Alternatively, derive "dictionary" from Squrdle game state by:
// 1. Running the internal JS of the closure script IIFE
//    - https://squaredle.app/closure-v2-8-16.js - using the current squaredle version: <div id="version">v2.8.16</div>
// 2. Grabbing the gPuzzleManager.puzzle.words and gPuzzleManager.puzzle.optionalWords

type Letter =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z"
  | ""
interface Point {
  x: number
  y: number
  letter: Letter
}
type Points = Point[]

// Equality util for comparing the equality of an arbitrary number of points.
function pointsAreEqual(...points: Points): boolean {
  const areEqual = points.reduce((bool, point: Point, i: number) => {
    // Compare current point with next point in the points list.
    const nextPoint = points[i + 1]
    if (nextPoint) {
      return bool && point.x === nextPoint.x && point.y === nextPoint.y
    }
    return bool
  }, true)

  return areEqual
}

// TODO: replace with generics.
function mapPoints(points: Points, by: "letter"): Letter[]
function mapPoints(points: Points, by: "x" | "y"): number[]
function mapPoints(points: Points, by: keyof Point): any[] {
  return points.map((point: Point) => point[by])
}

function getWord(points: Points): string {
  return mapPoints(points, "letter").join("")
}

// function mapPoints<Type, Key extends keyof Type>(points: Type[], by: Key): <Type[Key]>[] {
//   return points.map((point: Type)=> point[by])
// }

// Get all adjacent points to the provided point.
function getAdjacentPoints(point: Point, points: Points): Points {
  const adjacentPoints: Points = []

  // Assuming points grid of rows and columns, so need to grab surrounding 8 points.
  for (let w = point.x - 1; w < point.x + 2; w++) {
    for (let h = point.y - 1; h < point.y + 2; h++) {
      const adjacentPoint = points.find((p: Point) => p.x === w && p.y === h)
      // The adjacentPoint may not exist due to x, y, or both being out of bounds of the points grid.
      // Also exlude the point matching the provided point.
      if (adjacentPoint && !pointsAreEqual(adjacentPoint, point)) {
        adjacentPoints.push(adjacentPoint)
      }
    }
  }

  return adjacentPoints
}

export function getPossibleWords(
  points: Points,
  dictionary: string[]
): Points[] {
  points = points.filter((point) => point.letter)

  function getPossibleWordsFromPoint(
    point: Point,
    possibleWordPoints: Points = [], // The ordered list of points making up a word.
    possibleWordsPoints: Points[] = [] // A list of possibleWordPoints.
  ): Points[] {
    // Either begin with the provided point as the initial entry point or
    // collect adjacent points to provided point as next entry points.
    let entryPoints = !possibleWordPoints.length
      ? [point]
      : getAdjacentPoints(point, points)
    // Filter out those points that already exist in possibleWordPoints as a letter in
    // a given position can only be used once.
    entryPoints = entryPoints.filter((adjacentPoint: Point) => {
      return !possibleWordPoints.find((wordPoint: Point) =>
        pointsAreEqual(wordPoint, adjacentPoint)
      )
    })
    // console.log("entryPoints", entryPoints)

    const recordExactMatch = (possibleWordPoints: Points) => {
      const match = dictionary.find(
        (word) => word === getWord(possibleWordPoints)
      )
      if (
        match &&
        // Ensure this words has not already been added to possibleWordsPoints.
        !possibleWordsPoints.find(
          (word) => getWord(word) === getWord(possibleWordPoints)
        )
      ) {
        // At the end of the points branch, the final possibleWordPoints can be added to
        // possibleWordsPoints, recording a new possible word formed by an ordered list of points.
        possibleWordsPoints.push(possibleWordPoints)
      }
    }

    // Enter all entry points, appending them to the current possibleWordPoints.
    if (entryPoints.length) {
      entryPoints.forEach((entryPoint: Point) => {
        const nextPossibleWord = [...possibleWordPoints, entryPoint]
        const match = dictionary.find(
          (word) => word.indexOf(getWord(nextPossibleWord)) !== -1
        )
        if (match) {
          recordExactMatch(nextPossibleWord)
          getPossibleWordsFromPoint(
            entryPoint,
            nextPossibleWord,
            possibleWordsPoints
          )
        }
      })
    } else {
      recordExactMatch(possibleWordPoints)
    }

    return possibleWordsPoints
  }

  // Reduce the provided points into a list of possible words.
  const possibleWordsPoints: Points[] = points.reduce(
    (acc: Points[], point: Point) => getPossibleWordsFromPoint(point, [], acc),
    []
  )

  return possibleWordsPoints.sort(
    (possibleWordPoint1, possibleWordPoint2) =>
      dictionary.indexOf(getWord(possibleWordPoint1)) -
      dictionary.indexOf(getWord(possibleWordPoint2))
  )
}

function createPoints(w: number = 1, h: number = 1): Points {
  const points = []
  const letters: Letter[] = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"] // prettier-ignore
  for (let wi = 1; wi < w + 1; wi++) {
    for (let hi = 1; hi < h + 1; hi++) {
      const r = Math.floor(Math.random() * (letters.length - 1))
      const point: Point = {
        x: wi,
        y: hi,
        letter: letters[r]
      }
      points.push(point)
    }
  }
  return points
}

// const points: Points = [
//   { x: 1, y: 1, letter: "a" },
//   { x: 2, y: 1, letter: "r" },
//   { x: 1, y: 2, letter: "t" },
//   { x: 2, y: 2, letter: "s" }
// ]

const points = [
  { x: 1, y: 1, letter: "z" },
  { x: 2, y: 1, letter: "t" },
  { x: 3, y: 1, letter: "n" },
  { x: 4, y: 1, letter: "o" },
  { x: 1, y: 2, letter: "i" },
  { x: 2, y: 2, letter: "p" },
  { x: 3, y: 2, letter: "f" },
  { x: 4, y: 2, letter: "r" },
  { x: 1, y: 3, letter: "n" },
  { x: 2, y: 3, letter: "e" },
  { x: 3, y: 3, letter: "t" },
  { x: 4, y: 3, letter: "s" },
  { x: 1, y: 4, letter: "r" },
  { x: 2, y: 4, letter: "g" },
  { x: 3, y: 4, letter: "h" },
  { x: 4, y: 4, letter: "e" }
]

const dictionary = [
  "fern",
  "font",
  "fort",
  "forte",
  "fortes",
  "forth",
  "forts",
  "front",
  "frontier",
  "fronting",
  "gets",
  "heft",
  "hefting",
  "hefts",
  "inept",
  "nets",
  "north",
  "northern",
  "often",
  "pets",
  "pier",
  "pine",
  "ping",
  "refs",
  "rein",
  "retro",
  "stein",
  "step",
  "stern",
  "tern",
  "theft",
  "then",
  "tier",
  "tine",
  "ting",
  "tinge",
  "zing",
  "zinger",
  "efts",
  "engr",
  "epit",
  "ester",
  "esther",
  "estro",
  "eten",
  "ethe",
  "ether",
  "eths",
  "fehs",
  "feni",
  "fete",
  "fetes",
  "fets",
  "forset",
  "gein",
  "geit",
  "genip",
  "genit",
  "gernitz",
  "ghest",
  "grein",
  "greit",
  "gren",
  "grep",
  "gret",
  "hefte",
  "hept",
  "hern",
  "hest",
  "hestern",
  "hete",
  "hetes",
  "hets",
  "nefs",
  "nepit",
  "nete",
  "netes",
  "nief",
  "niefs",
  "nipter",
  "northen",
  "norther",
  "norths",
  "ofter",
  "orfe",
  "orfs",
  "orts",
  "pegh",
  "peghs",
  "pehs",
  "pein",
  "peng",
  "peni",
  "pern",
  "petro",
  "piefort",
  "pieforts",
  "pien",
  "piet",
  "piets",
  "piner",
  "pinge",
  "pinger",
  "refont",
  "refr",
  "refront",
  "refronting",
  "reft",
  "rehs",
  "reit",
  "repin",
  "rept",
  "rete",
  "retes",
  "rethe",
  "rets",
  "ront",
  "shen",
  "shet",
  "shtg",
  "steg",
  "stegh",
  "sten",
  "steng",
  "stept",
  "ster",
  "stge",
  "tefs",
  "tein",
  "teng",
  "thegn",
  "thein",
  "tinger",
  "tipe",
  "tipt",
  "troft",
  "tron",
  "zine"
]

// missing "hefts" && "forset"

// console.log("running...")
// // const points = createPoints(4, 4)
// const words = getPossibleWords(points, dictionary)

// console.log("words", words)

// console.log(words.map((word) => getWord(word)))
