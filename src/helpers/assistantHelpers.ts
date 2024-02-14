import { openai } from "../lib/openai";
import { Threads } from "openai/resources/beta";
import RequiredActionFunctionToolCall = Threads.RequiredActionFunctionToolCall;
import { RunSubmitToolOutputsParams } from "openai/src/resources/beta/threads/runs/runs";
import { sessions } from "../lib/sessions";
import { ASSISTANT_ID } from "../lib/constants";
import { StatTypes } from "../types/types";

const RESOLVED_CHECKS_LIMIT = 1000;

/** Periodically retrieves the run until it's either completed, or requires action. */
export const retrieveUntilStatusResolved = async (
  threadId: string,
  runId: string,
) => {
  let status = "";
  let requiredAction: Threads.Runs.Run.RequiredAction | null = null;
  let i = 0;
  for (; i < RESOLVED_CHECKS_LIMIT; i++) {
    const { status: _status, required_action } =
      await openai.beta.threads.runs.retrieve(threadId, runId);
    status = _status;
    requiredAction = required_action;

    console.log(`Run status: ${status}`);
    if (status === "completed" || status === "requires_action") break;
  }

  if (i >= RESOLVED_CHECKS_LIMIT) console.warn("Run took too long to resolve.");

  return {
    status,
    requiredAction,
  };
};

/** Calls all the actions the assistant requires and returns their outputs. */
export const runRequiredActions = (
  actions: RequiredActionFunctionToolCall[],
  session: string,
): RunSubmitToolOutputsParams.ToolOutput[] => {
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
};

/** Functions available to OpenAI assistant */
export const getFunctions = (session: string) => {
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

/** Waits fora run to resolve, fulfills any required action calls, and waits for it to resolve again. */
export const waitAndResolve = async (
  threadId: string,
  session: string,
  runId: string,
) => {
  const { status, requiredAction } = await retrieveUntilStatusResolved(
    threadId,
    runId,
  );
  if (status === "failed") throw new Error("Run failed, tf?");
  // biome-ignore format: off.
  if (status === "cancelled") throw new Error("Run cancelled, co si to to API dovoluje?");
  // biome-ignore format: off.
  if (status === "expired") throw new Error("Run expired, I don't think this should happen.");
  if (status === "completed") return;
  if (status === "requires_action") {
    const outputs = runRequiredActions(
      requiredAction!.submit_tool_outputs.tool_calls,
      session,
    );

    await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
      tool_outputs: outputs,
    });
    // Wait again after submitting outputs.
    await retrieveUntilStatusResolved(threadId, runId);
    return;
  }
};

/** Gets the latest sent message from the thread. Never returns an image (cause not supported rn). */
export const getLatestMessage = async (
  threadId: string,
): Promise<Threads.Messages.MessageContentText> => {
  // Retrieve the messages and return the assistant's response.
  const allMessages = await openai.beta.threads.messages.list(threadId);
  const content = allMessages.data[0].content[0];

  if (content.type === "image_file")
    throw new Error("Why the fuck did the assistant return an image.");

  return content;
};
