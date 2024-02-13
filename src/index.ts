import Fastify from "fastify";
import "dotenv/config";
import { runServer } from "./helpers/runServer";
import { genResponse, genResponseInputSchema } from "./routes/genResponseRoute";
import { createChat } from "./routes/createChatRoute";

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

fastify.post("/chat/add", async (req, res) => {
  // Validate input.
  const input = genResponseInputSchema.safeParse(req.body);
  if (!input.success) return res.code(400).send(input.error);

  // Gen & return.
  const response = await genResponse(input.data);
  return res.code(200).send(response);
});

fastify.post("/chat/create", async (rea, res) => {
  const session = await createChat();
  return res.code(200).send({ session: session });
});
