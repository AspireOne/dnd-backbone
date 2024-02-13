import Fastify from "fastify";
import "dotenv/config";
import { initServer } from "./lib/initServer";
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
const assistantId = "asst_wn2d7hmA76z0KRULrePf0MC5";

// Declare a route
fastify.get("/", (request, reply) => {
  reply.send({ hi: "welcome to my fucking DRUM AND BASS BACKEND" });
});

type ChatInputReqBody = {
  chatId: string;
  message: string;
}

fastify.post("/chat", async (req, res) => {
  const { chatId, message } = req.body as ChatInputReqBody;

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

  const run = await openai.beta.threads.runs.create(threadByChatId[chatId], {
    assistant_id: assistantId,
  });
  console.log("Run: ", run, "\n");

  // Periodically retrieve the Run to check on its status
  const retrieveUntilCompleted = async () => {
    while (run.status !== "completed") {
      const keepRetrieving = await openai.beta.threads.runs.retrieve(
        threadByChatId[chatId], // Use the stored thread ID for this user
        run.id,
      );

      console.log(`Run status: ${keepRetrieving.status}`);
      if (keepRetrieving.status === "completed") break;
    }
  };

  await retrieveUntilCompleted();

  const allMessages = await openai.beta.threads.messages.list(
    threadByChatId[chatId],
  );

  const content = allMessages.data[0].content[0];
  res.code(200).send({ response: content });
});
