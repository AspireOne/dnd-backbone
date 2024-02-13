import cors from "@fastify/cors";
import { FastifyInstance } from "fastify";

/** This function initializes and starts the server. */
export const runServer = (fastify: FastifyInstance) => {
  fastify.register(cors, {
    origin: true,
  });

  // Run the server!
  fastify.listen({ port: 3000 }, (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`Server is now listening on ${address}`);
  });
};
