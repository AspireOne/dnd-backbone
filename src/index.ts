import Fastify from "fastify";
import "dotenv/config";
import { initServer } from "../lib/initServer";
import OpenAI from "openai";

const fastify = Fastify({
  logger: true,
});
initServer(fastify);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your OpenAI API key
});

type ThreadByChatId = {
  [userId: string]: string;
};
const threadByChatId: ThreadByChatId = {};

// Declare a route
fastify.get("/", (request, reply) => {
  reply.send({ hi: "welcome to my fucking DRUM AND BASS BACKEND" });
});

fastify.post("/chat", async (req, res) => {
  const assistantId = "asst_wn2d7hmA76z0KRULrePf0MC5";
  const body = req.body as {
    chatId: string;
    message: string;
  };
  const { chatId, message } = body;

  // Create a new thread if it's the user's first message
  if (!threadByChatId[chatId]) {
    const thread = await openai.beta.threads.create();
    console.log("New thread created with ID: ", thread.id, "\n");
    threadByChatId[chatId] = thread.id;
  }

  // Add a Message to the Thread
  const threadMessage = await openai.beta.threads.messages.create(
    threadByChatId[chatId], // Use the stored thread ID for this user
    {
      role: "user",
      content: message,
    },
  );
  console.log("Out: ", threadMessage);

  const run = await openai.beta.threads.runs.create(
    threadByChatId[chatId], // Use the stored thread ID for this user
    {
      assistant_id: assistantId,
    },
  );
  console.log("Run: ", run, "\n");

  // Periodically retrieve the Run to check on its status
  const retrieveRun = async () => {
    let keepRetrievingRun: OpenAI.Beta.Threads.Runs.Run;

    while (run.status !== "completed") {
      keepRetrievingRun = await openai.beta.threads.runs.retrieve(
        threadByChatId[chatId], // Use the stored thread ID for this user
        run.id,
      );

      console.log(`Run status: ${keepRetrievingRun.status}`);

      if (keepRetrievingRun.status === "completed") {
        console.log("\n");
        break;
      }
    }
  };

  await retrieveRun();

  const allMessages = await openai.beta.threads.messages.list(
    threadByChatId[chatId],
  );

  const content = allMessages.data[0].content[0];

  console.log("content:", content);
  console.log(JSON.stringify(allMessages));

  res.code(200).send({
    response: content,
  });

  console.log("User: ", threadMessage.content[0]);
  console.log("Assistant: ", allMessages.data[0].content[0]);
});
