import Fastify from "fastify";
import "dotenv/config";
import { runServer } from "./helpers/runServer";
import {
  genResponse,
  GenResponseInput,
  genResponseInputSchema,
} from "./routes/genResponseRoute";
import { createChat } from "./routes/createChatRoute";
import {
  getGameStateRoute,
  GetGameStateInput,
  getGameStateInputSchema,
} from "./routes/getGameStateRoute";
import {
  retrieveMessages,
  GetMessagesInput,
  getMessagesInputSchema,
} from "./routes/getMessagesRoute";

/** This file is the entry point for the project. */

const fastify = Fastify({
  logger: true,
});
runServer(fastify);

// Health check route.
fastify.get("/", (request, reply) => {
  reply.send({
    hi: "welcome to my fucking DRUM AND BASS BACKEND <alert>suck my nuts</alert>",
  });
});

fastify.post<{ Body: GenResponseInput }>(
  "/chat/add",
  { schema: { body: genResponseInputSchema } },
  async (req, res) => {
    const response = await genResponse(req.body);
    return res.code(200).send({
      message: response.message,
      state: response.state,
    });
  },
);

fastify.post("/chat/create", async (request, res) => {
  const response = await createChat();
  return res.code(200).send({
    session: response.session,
    message: response.message,
  });
});

fastify.get<{ Querystring: GetGameStateInput }>(
  "/chat/gameState",
  { schema: { querystring: getGameStateInputSchema } },
  async (req, res) => {
    const state = await getGameStateRoute(req.query);
    return res.code(200).send({ state: state });
  },
);

fastify.get<{ Querystring: GetMessagesInput }>(
  "/chat/messages",
  { schema: { querystring: getMessagesInputSchema } },
  async (request, res) => {
    const messages = await retrieveMessages(request.query);
    return res.code(200).send({ messages: messages });
  },
);
