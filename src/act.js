"use strict";
// TODO: BEAST this 10x10 puzzle: https://squaredle.app/?puzzle=10x10
// api.getPuzzleByKey("10x10")
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const path_1 = __importDefault(require("path"));
const getUnclosuredScript_1 = __importDefault(require("./getUnclosuredScript"));
const main_1 = require("./main");
const fs_1 = __importDefault(require("fs"));
exports.default = ({ username, puzzleKey } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    // const url = "https://squaredle.app/?puzzle=10x10"
    let url = "https://squaredle.app";
    if (puzzleKey) {
        url += `?puzzle=${puzzleKey}`;
    }
    console.log("username", username);
    let userData = null;
    if (username) {
        try {
            userData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, `profiles/${username}.json`)));
            console.log("user config: ", userData);
        }
        catch (error) {
            console.log(`Unable to find profile for username: "${username}"`);
        }
    }
    let wordsFound = 0;
    const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const getClosureScript = (page, endpoint) => __awaiter(void 0, void 0, void 0, function* () {
        const js = yield page.evaluate((endpoint) => new Promise((resolve, reject) => {
            window.fetch(endpoint, { method: "GET" }).then((resp) => {
                resp.text().then((js) => {
                    try {
                        resolve(js);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
        }), endpoint);
        let unclosuredJS = "";
        if (js && typeof js === "string") {
            unclosuredJS = (0, getUnclosuredScript_1.default)(js, puzzleKey);
        }
        return unclosuredJS;
    });
    const getPuzzleConfig = () => __awaiter(void 0, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch({
            headless: true,
            args: ["--shm-size=3gb"]
        });
        const page = yield browser.newPage();
        // Debug
        page.on("console", (msg) => console.log(msg.text()));
        const getClosureScriptConfig = () => new Promise((resolve) => {
            let intercepting = true;
            page.setRequestInterception(true);
            page.on("request", (request) => {
                const re = /https:\/\/squaredle\.app\/closure-(?<version>v[0-9-]+)\.js/;
                const url = request.url();
                const match = url.match(re);
                if (match && match.groups && intercepting) {
                    // TODO: try to stop intercepting requests.
                    intercepting = false;
                    const { version } = match.groups;
                    // Prevent the closure script request from fulfilling
                    request.abort();
                    resolve({ version, url });
                    return;
                }
                request.continue();
            });
        });
        // Must setup the request interception before going to the url.
        const [closureScriptConfig] = yield Promise.all([
            getClosureScriptConfig(),
            page.goto(url)
        ]);
        // page.setRequestInterception(true)
        let filename = closureScriptConfig.version;
        if (puzzleKey)
            filename = `${closureScriptConfig.version}-${puzzleKey}`;
        const filepath = path_1.default.join(__dirname, `closure-scripts/${filename}.js`);
        if (!fs_1.default.existsSync(filepath)) {
            const unclosuredJS = yield getClosureScript(page, closureScriptConfig.url);
            fs_1.default.writeFileSync(filepath, unclosuredJS);
        }
        // const filepath = path.join(__dirname, "squardleCode.js")
        yield page.addScriptTag({ path: require.resolve(filepath) });
        const getSolution = () => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve) => {
                let solution = null;
                const interval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
                    solution = yield page.evaluate(() => window._solution);
                    if (solution) {
                        clearInterval(interval);
                        resolve(solution);
                    }
                }), 100);
            });
        });
        const solution = yield getSolution();
        const dictionary = [
            ...solution.optionalWords.sort(),
            ...solution.words.sort()
        ];
        const letters = solution.board.reduce((acc, row) => [...acc, ...row.split("")], []);
        yield browser.close();
        return { dictionary, letters };
    });
    const act = () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("obtaining puzzle config...");
        const { dictionary, letters } = yield getPuzzleConfig();
        const rowCount = Math.sqrt(letters.length);
        const points = letters.map((letter, i) => ({
            x: (i % rowCount) + 1,
            y: Math.ceil((i + 1) / rowCount),
            letter
        }));
        console.log("letters:", letters);
        console.log("points:", points);
        console.log("dictionary:", dictionary);
        console.log("deriving letter sequences...");
        let possibleWords = (0, main_1.getPossibleWords)(points, dictionary);
        console.log("letter sequences:", possibleWords);
        const browser = yield puppeteer_1.default.launch({
            headless: true,
            args: ["--shm-size=3gb"]
        });
        const page = yield browser.newPage();
        // Debug
        page.on("console", (msg) => console.log(msg.text()));
        yield page.evaluateOnNewDocument((userData) => {
            localStorage.clear();
            localStorage.setItem("squaredle-didTutorial", "skipped");
            localStorage.setItem("squaredle-isPermaClosed-levelUpAdept", "true");
            localStorage.setItem("squaredle-isPermaClosed-levelUpExpert", "true");
            localStorage.setItem("squaredle-isPermaClosed-levelUpHints", "true");
            localStorage.setItem("squaredle-isPermaClosed-levelUpComplete", "true");
            localStorage.setItem("squaredle-initializedAchievements2", "true");
            localStorage.setItem("squaredle-showedFeatureMessage6", "true");
            if (userData) {
                // localStorage.setItem("squaredle-isPremium", "true")
                localStorage.setItem("squaredle-userId", userData.userId);
                localStorage.setItem("squaredle-uuid", userData.uuid);
            }
            // localStorage.setItem("squaredle-isPremium", "true")
            // localStorage.setItem("squaredle-userId", "228946")
            // localStorage.setItem(
            //   "squaredle-uuid",
            //   "026a6278-ac9e-43f1-9099-a10877a1cfc2"
            // )
        }, userData);
        yield page.goto(url);
        const styleTagHandle = yield page.addStyleTag({
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
        });
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
        const letterNodes = yield page.$$("#board .letterContainer");
        page.exposeFunction("dragOverWord", (possibleWord) => __awaiter(void 0, void 0, void 0, function* () {
            // const letterNodes = await page.$$("#board .letterContainer")
            const moveMouse = (node) => __awaiter(void 0, void 0, void 0, function* () {
                const boundingBox = yield node.boundingBox();
                // Move to the center of the letter node.
                yield page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
            });
            for (let i = 0; i < possibleWord.length; i++) {
                const point = possibleWord[i];
                // Establish the index of the letter in the flat letters list based on the grid x and y values of the point.
                const index = (point.y - 1) * Math.sqrt(letterNodes.length) + (point.x - 1);
                const node = letterNodes[index];
                // For any letter, move to it.
                yield moveMouse(node);
                // await page.mouse.down()
                // For the first letter, push mouse down.
                if (i === 0)
                    yield page.mouse.down();
                // For the last letter, lift mouse up.
                if (i === possibleWord.length - 1)
                    yield page.mouse.up();
            }
            // Wait to advance to the next word until the current word has been recorded.
            // This seems to ensure we don't miss a word, maybe due to being to fast.
            let currentWordsFound = wordsFound;
            while (wordsFound === currentWordsFound) {
                const curWordCountEl = yield page.$("#curWordCount");
                const curObscureWordCountEl = yield page.$("#curObscureWordCount");
                const curWordCount = yield (curWordCountEl === null || curWordCountEl === void 0 ? void 0 : curWordCountEl.evaluate((el) => el.textContent));
                const curObscureWordCount = yield (curObscureWordCountEl === null || curObscureWordCountEl === void 0 ? void 0 : curObscureWordCountEl.evaluate((el) => el.textContent));
                wordsFound =
                    parseInt(curWordCount || 0) + parseInt(curObscureWordCount || 0);
            }
        }));
        // Wait for board to be  ready.
        yield page.$$("#board .letterContainer");
        for (let i = 0; i < possibleWords.length; i++) {
            // await page.evaluate(() => {
            //   const q = document.querySelectorAll(".letterContainer")[13]
            //   q.classList.add("unnecessaryOnFirstLoad", "unnecessary", "used")
            // }, [])
            const possibleWord = possibleWords[i];
            yield page.evaluate((possibleWord) => {
                return window.dragOverWord(possibleWord);
            }, possibleWord);
        }
        yield page.evaluate((style) => style.remove(), styleTagHandle);
        yield waitFor(1200000);
        yield browser.close();
    });
    yield act();
    return { words: dictionary.length, wordsFound };
});
// getPuzzleSolution()
