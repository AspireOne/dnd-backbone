var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { openai } from "../lib/openai";
import { sessions } from "../lib/sessions";
import { wait, withTimeout } from "../utils";
import { db } from "../db/db";
import { inventoryItems, stats as statsTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
const CHECK_COUNT_LIMIT = 1000;
const STATUS_CHECK_TIMEOUT = 5000;
const resolvedRunStatuses = [
    "requires_action",
    "cancelled",
    "failed",
    "completed",
    "expired",
];
export const waitUntilStatusResolved = (threadId, runId, resolvedStatuses = resolvedRunStatuses) => __awaiter(void 0, void 0, void 0, function* () {
    let run = yield openai.beta.threads.runs.retrieve(threadId, runId);
    let i = 0;
    for (; i < CHECK_COUNT_LIMIT; i++) {
        console.log(`Run status: ${run.status}`);
        if (resolvedStatuses.some((s) => s === run.status))
            break;
        const { output, timedOut } = yield withTimeout(() => openai.beta.threads.runs.retrieve(threadId, runId), STATUS_CHECK_TIMEOUT);
        if (timedOut)
            console.warn("Status check took too long to resolve.");
        else
            run = output;
        yield wait(250);
    }
    return run;
});
export const runRequiredFunctions = (actions, session) => {
    const outputs = [];
    for (const action of actions) {
        const args = Object.values(JSON.parse(action.function.arguments));
        const output = getFunctions(session)[action.function.name](...args);
        outputs.push({
            output: JSON.stringify(output || "{}"),
            tool_call_id: action.id,
        });
        console.log(`Ran function ${action.function.name}(${action.function.arguments}) (id: ${action.id}) / output: ${JSON.stringify(output)}`);
    }
    return outputs;
};
export const resolveRequiredFunctionsRecursively = (actions, session, threadId, runId) => __awaiter(void 0, void 0, void 0, function* () {
    const outputs = runRequiredFunctions(actions, session);
    yield openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: outputs,
    });
    const run = yield waitUntilStatusResolved(threadId, runId);
    if (run.status === "requires_action")
        return yield resolveRequiredFunctionsRecursively(run.required_action.submit_tool_outputs.tool_calls, session, threadId, runId);
});
export const getFunctions = (session) => {
    return {
        getInventory: () => sessions[session].gameState.inventoryItems,
        getStats: () => sessions[session].gameState.stats,
        modifyStats: (stats) => {
            Object.assign(sessions[session].gameState.stats, stats);
            db.update(statsTable)
                .set(stats)
                .where(eq(statsTable.sessionId, sessions[session].id))
                .returning()
                .then((res) => console.log(res));
        },
        addItem: (name, quantity, img) => {
            sessions[session].gameState.inventoryItems.push({
                name: name,
                quantity: quantity,
                img: img,
            });
            db.insert(inventoryItems)
                .values({
                name,
                quantity,
                icon: img,
                sessionId: sessions[session].id,
            })
                .returning()
                .then((res) => console.log(res));
        },
        removeItem: (name, quantity) => {
            const item = sessions[session].gameState.inventoryItems.find((item) => item.name === name);
            if (item) {
                item.quantity -= quantity;
                if (item.quantity <= 0) {
                    sessions[session].gameState.inventoryItems = sessions[session].gameState.inventoryItems.filter((item) => item.name !== name);
                    db.delete(inventoryItems).where(and(eq(inventoryItems.name, name), eq(inventoryItems.sessionId, sessions[session].id)));
                }
                else {
                    db.update(inventoryItems)
                        .set({
                        quantity: item.quantity,
                    })
                        .where(and(eq(inventoryItems.name, name), eq(inventoryItems.sessionId, sessions[session].id)))
                        .returning()
                        .then((res) => console.log(res));
                }
            }
        },
    };
};
export const getLatestMessage = (threadId) => __awaiter(void 0, void 0, void 0, function* () {
    const allMessages = yield openai.beta.threads.messages.list(threadId);
    const content = allMessages.data[0].content[0];
    if (content.type === "image_file")
        throw new Error("Why the fuck did the assistant return an image.");
    return content;
});
//# sourceMappingURL=assistantHelpers.js.map