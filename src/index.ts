import Fastify from "fastify";
import "dotenv/config";
import { runServer } from "./lib/runServer";
import { genResponse, genResponseInputSchema } from "./routes/genResponseRoute";

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

fastify.post("/chat", async (req, res) => {
  const parsed = genResponseInputSchema.safeParse(req.body);
  if (!parsed.success) return res.code(400).send(parsed.error);
  
  const response = await genResponse(parsed.data);
  return res.code(200).send(response);
});
