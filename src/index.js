var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Fastify from "fastify";
import "dotenv/config";
import { runServer } from "./helpers/runServer";
import { genResponse, genResponseInputSchema } from "./routes/genResponseRoute";
import { createChat } from "./routes/createChatRoute";
import { getGameStateRoute, getGameStateInputSchema, } from "./routes/getGameStateRoute";
import { retrieveMessages, getMessagesInputSchema, } from "./routes/getMessagesRoute";
import { fetchAndFillSessions } from "./helpers/fetchAndTransformSessions";
fetchAndFillSessions();
const fastify = Fastify({ logger: true });
runServer(fastify);
fastify.get("/", (request, reply) => {
    reply.send({
        hi: "welcome to my fucking DRUM AND BASS BACKEND <alert>suck my nuts</alert>",
    });
});
fastify.post("/chat/messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = genResponseInputSchema.safeParse(req.body);
    if (!input.success)
        return res.code(400).send(input.error);
    const response = yield genResponse(input.data);
    return {
        message: response.message,
        state: response.state,
    };
}));
fastify.post("/chat/create", (request, res) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield createChat();
    return {
        session: response.session,
        message: response.message,
    };
}));
fastify.get("/chat/gameState", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = getGameStateInputSchema.safeParse(req.body);
    if (!input.success)
        return res.code(400).send(input.error);
    const state = yield getGameStateRoute(input.data);
    return { state: state };
}));
fastify.get("/chat/messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = getMessagesInputSchema.safeParse(req.body);
    if (!input.success)
        return res.code(400).send(input.error);
    const messages = yield retrieveMessages(input.data);
    return { messages: messages };
}));
//# sourceMappingURL=index.js.map