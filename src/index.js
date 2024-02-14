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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
require("dotenv/config");
const runServer_1 = require("./helpers/runServer");
const genResponseRoute_1 = require("./routes/genResponseRoute");
const createChatRoute_1 = require("./routes/createChatRoute");
const getGameStateRoute_1 = require("./routes/getGameStateRoute");
const getMessagesRoute_1 = require("./routes/getMessagesRoute");
/** This file is the entry point for the project. */
const fastify = (0, fastify_1.default)({ logger: true });
(0, runServer_1.runServer)(fastify);
// Health check route.
fastify.get("/", (request, reply) => {
    reply.send({
        hi: "welcome to my fucking DRUM AND BASS BACKEND <alert>suck my nuts</alert>",
    });
});
fastify.post("/chat/messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = genResponseRoute_1.genResponseInputSchema.safeParse(req.body);
    if (!input.success)
        return res.code(400).send(input.error);
    const response = yield (0, genResponseRoute_1.genResponse)(input.data);
    return {
        message: response.message,
        state: response.state,
    };
}));
fastify.post("/chat/create", (request, res) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, createChatRoute_1.createChat)();
    return {
        session: response.session,
        message: response.message,
    };
}));
fastify.get("/chat/gameState", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = getGameStateRoute_1.getGameStateInputSchema.safeParse(req.body);
    if (!input.success)
        return res.code(400).send(input.error);
    const state = yield (0, getGameStateRoute_1.getGameStateRoute)(input.data);
    return { state: state };
}));
fastify.get("/chat/messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = getMessagesRoute_1.getMessagesInputSchema.safeParse(req.body);
    if (!input.success)
        return res.code(400).send(input.error);
    const messages = yield (0, getMessagesRoute_1.retrieveMessages)(input.data);
    return { messages: messages };
}));
