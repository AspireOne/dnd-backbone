import OpenAI from "openai";
import { z } from "zod";
import { RunSubmitToolOutputsParams } from "openai/src/resources/beta/threads/runs/runs";
import { Threads } from "openai/resources/beta";
import RequiredActionFunctionToolCall = Threads.RequiredActionFunctionToolCall;
import { sessions } from "../lib/sessions";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const genResponseInputSchema = z.object({
  session: z.string().min(1),
  message: z.string().min(1),
});

export type GenResponseInput = z.infer<typeof genResponseInputSchema>;
export type GenResponseOutput = {
  content: string;
  state: GameState;
};

const RESOLVED_CHECKS_LIMIT = 1000;
const assistantId = "asst_wn2d7hmA76z0KRULrePf0MC5";

export const genResponse = async ({
  session,
  message,
}: GenResponseInput): Promise<GenResponseOutput> => {
  // If no chat exists yet, create a new one.
  if (!sessions[session]) {
    const thread = await openai.beta.threads.create();
    console.log("New thread created with ID: ", thread.id, "\n");
    sessions[session] = {
      threadId: thread.id,
      gameState: { stats: [], inventoryItems: [] },
    };
  }

  // Add a Message to the Thread. TODO: Add API for assistant's first message.
  const threadMessage = await openai.beta.threads.messages.create(
    sessions[session].threadId,
    {
      role: "user",
      content: message,
    },
  );
  console.log("Created message: ", threadMessage);

  // Create a Run.
  const run = await openai.beta.threads.runs.create(sessions[session].threadId, {
    assistant_id: assistantId,
  });
  console.log("Created run: ", run);

  // Wait until it's fully resolved (& take care of required actions).
  while (true) {
    await retrieveUntilStatusResolved(sessions[session].threadId, run.id);
    if (run.status === "completed") break;
    if (run.status === "requires_action") {
      const outputs = runRequiredActions(
        run.required_action!.submit_tool_outputs.tool_calls,
        session,
      );

      await openai.beta.threads.runs.submitToolOutputs(
        sessions[session].threadId,
        run.id,
        { tool_outputs: outputs },
      );
      // Wait again after submitting outputs.
      await retrieveUntilStatusResolved(sessions[session].threadId, run.id);
    }
  }

  // Retrieve the messages and return the assistant's response.
  const allMessages = await openai.beta.threads.messages.list(
    sessions[session].threadId,
  );
  const content = allMessages.data[0].content[0];
  
  if (content.type === "image_file")
    throw new Error("Why the fuck did OpenAi return an image.");

  return {
    content: content.text.value,
    state: sessions[session].gameState,
  };
};

/** Functions available to OpenAI assistant */
const getFunctions = (session: string) => {
  return {
    getInventory: () => sessions[session].gameState.inventoryItems,
    getStats: () => sessions[session].gameState.stats,
    modifyStats: (stats: { type: StatTypes; quantity: number }[]) => {
      for (const stat of stats) {
        const foundStat = sessions[session].gameState.stats.find(
          (s) => s.type === stat.type,
        );

        if (foundStat) foundStat.quantity += stat.quantity;
        else sessions[session].gameState.stats.push(stat);
      }
    },
    addItem: (name: string, quantity: number, img: string) => {
      sessions[session].gameState.inventoryItems.push({
        name: name,
        quantity: quantity,
        img: img,
      });
    },
    removeItem: (name: string, quantity: number) => {
      const item = sessions[session].gameState.inventoryItems.find(
        (item) => item.name === name,
      );

      if (item) item.quantity -= quantity;
    },
  };
};

/** Calls all the actions the assistant requires and returns their outputs. */
function runRequiredActions(
  actions: RequiredActionFunctionToolCall[],
  session: string,
): RunSubmitToolOutputsParams.ToolOutput[] {
  const outputs: RunSubmitToolOutputsParams.ToolOutput[] = [];

  for (const action of actions) {
    const result = (getFunctions(session) as any)[action.function.name](
      ...action.function.arguments,
    );

    outputs.push({
      output: result,
      tool_call_id: action.id,
    });
  }

  return outputs;
}

/** Periodically retrieves the run until it's either completed, or requires action. */
const retrieveUntilStatusResolved = async (threadId: string, runId: string) => {
  for (let i = 0; i < RESOLVED_CHECKS_LIMIT; i++) {
    const { status } = await openai.beta.threads.runs.retrieve(threadId, runId);

    console.log(`Run status: ${status}`);
    if (status === "completed" || status === "requires_action") break;
  }
};
