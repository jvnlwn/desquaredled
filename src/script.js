"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const act_1 = __importDefault(require("./act"));
console.log("act", act_1.default);
const [username, puzzleKey] = process.argv.slice(2);
console.log("username", username);
(0, act_1.default)({ username, puzzleKey });
