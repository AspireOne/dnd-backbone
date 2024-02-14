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

const fastify = Fastify({ logger: true });
runServer(fastify);

// Health check route.
fastify.get("/", (request, reply) => {
  reply.send({
    hi: "welcome to my fucking DRUM AND BASS BACKEND <alert>suck my nuts</alert>",
  });
});

fastify.post("/chat/messages", async (req, res) => {
  const input = genResponseInputSchema.safeParse(req.body);
  if (!input.success) return res.code(400).send(input.error);

  const response = await genResponse(input.data);
  return {
    message: response.message,
    state: response.state,
  };
});

fastify.post("/chat/create", async (request, res) => {
  const response = await createChat();
  return {
    session: response.session,
    message: response.message,
  };
});

fastify.get("/chat/gameState", async (req, res) => {
  const input = getGameStateInputSchema.safeParse(req.body);
  if (!input.success) return res.code(400).send(input.error);

  const state = await getGameStateRoute(input.data);
  return { state: state };
});

fastify.get("/chat/messages", async (req, res) => {
  const input = getMessagesInputSchema.safeParse(req.body);
  if (!input.success) return res.code(400).send(input.error);

  const messages = await retrieveMessages(input.data);
  return { messages: messages };
});
