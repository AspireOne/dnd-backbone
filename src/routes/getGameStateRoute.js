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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGameStateRoute = exports.getGameStateInputSchema = void 0;
const zod_1 = require("zod");
const sessions_1 = require("../lib/sessions");
const schemaValidations_1 = require("../helpers/schemaValidations");
exports.getGameStateInputSchema = zod_1.z.object({
    session: schemaValidations_1.sessionSchema,
});
const getGameStateRoute = ({ session, }) => __awaiter(void 0, void 0, void 0, function* () {
    return sessions_1.sessions[session].gameState;
});
exports.getGameStateRoute = getGameStateRoute;
