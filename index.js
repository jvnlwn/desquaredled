"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// NOTE: you can have VSC automatically watch your tsc files and recompile using the command:
// CMD + SHIFT + B "tsc: watch"
const act = require("./src/act").default;
exports.handler = (event = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield act(event.username, event.puzzleKey);
    return result;
});
