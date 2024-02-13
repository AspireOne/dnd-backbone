import Fastify from 'fastify'
import cors from '@fastify/cors'
import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config();

const fastify = Fastify({
  logger: true
})
fastify.register(cors, {
  origin: true,
})

const openai = new OpenAI({
  apiKey: "sk-420710113069", // Replace with your OpenAI API key
});

// Declare a route
fastify.get('/', (request, reply) => {
  reply.send({ hello: 'world' })
})

// Run the server!
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`Server is now listening on ${address}`);
})