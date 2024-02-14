"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestMessage = exports.getFunctions = exports.resolveRequiredFunctionsRecursively = exports.runRequiredFunctions = exports.waitUntilStatusResolved = void 0;
const openai_1 = require("../lib/openai");
const sessions_1 = require("../lib/sessions");
const utils_1 = require("../utils");
const CHECK_COUNT_LIMIT = 1000;
const STATUS_CHECK_TIMEOUT = 5000;
// biome-ignore format: off.
const resolvedRunStatuses = [
    "requires_action",
    "cancelled",
    "failed",
    "completed",
    "expired",
];
/** Periodically retrieves the run until it's either completed, or requires action. */
const waitUntilStatusResolved = (threadId, runId, resolvedStatuses = resolvedRunStatuses) => __awaiter(void 0, void 0, void 0, function* () {
    let run = yield openai_1.openai.beta.threads.runs.retrieve(threadId, runId);
    let i = 0;
    for (; i < CHECK_COUNT_LIMIT; i++) {
        console.log(`Run status: ${run.status}`);
        if (resolvedStatuses.some((s) => s === run.status))
            break;
        const { output, timedOut } = yield (0, utils_1.withTimeout)(() => openai_1.openai.beta.threads.runs.retrieve(threadId, runId), STATUS_CHECK_TIMEOUT);
        if (timedOut)
            console.warn("Status check took too long to resolve.");
        else
            run = output;
        yield (0, utils_1.wait)(250);
    }
    return run;
});
exports.waitUntilStatusResolved = waitUntilStatusResolved;
/** Calls all the functions the assistant requires and returns their outputs. */
const runRequiredFunctions = (actions, session) => {
    const outputs = [];
    for (const action of actions) {
        const args = Object.values(JSON.parse(action.function.arguments));
        const output = (0, exports.getFunctions)(session)[action.function.name](...args);
        outputs.push({
            output: JSON.stringify(output || "{}"),
            tool_call_id: action.id,
        });
        console.log(`Ran function ${action.function.name}(${action.function.arguments}) (id: ${action.id}) / output: ${output}`);
    }
    return outputs;
};
exports.runRequiredFunctions = runRequiredFunctions;
/** Recursively fulfills all required actions, even the subsequent ones. */
const resolveRequiredFunctionsRecursively = (actions, session, threadId, runId) => __awaiter(void 0, void 0, void 0, function* () {
    const outputs = (0, exports.runRequiredFunctions)(actions, session);
    yield openai_1.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: outputs,
    });
    const run = yield (0, exports.waitUntilStatusResolved)(threadId, runId);
    if (run.status === "requires_action")
        return yield (0, exports.resolveRequiredFunctionsRecursively)(run.required_action.submit_tool_outputs.tool_calls, session, threadId, runId);
});
exports.resolveRequiredFunctionsRecursively = resolveRequiredFunctionsRecursively;
/** Functions available to OpenAI assistant */
const getFunctions = (session) => {
    return {
        getInventory: () => sessions_1.sessions[session].gameState.inventoryItems,
        getStats: () => sessions_1.sessions[session].gameState.stats,
        modifyStats: (stats) => {
            Object.assign(sessions_1.sessions[session].gameState.stats, stats);
        },
        addItem: (name, quantity, img) => {
            sessions_1.sessions[session].gameState.inventoryItems.push({
                name: name,
                quantity: quantity,
                img: img,
            });
        },
        removeItem: (name, quantity) => {
            const item = sessions_1.sessions[session].gameState.inventoryItems.find((item) => item.name === name);
            if (item)
                item.quantity -= quantity;
        },
    };
};
exports.getFunctions = getFunctions;
/** Gets the latest sent message from the thread. Never returns an image (cause not supported rn). */
const getLatestMessage = (threadId) => __awaiter(void 0, void 0, void 0, function* () {
    // Retrieve the messages and return the assistant's response.
    const allMessages = yield openai_1.openai.beta.threads.messages.list(threadId);
    const content = allMessages.data[0].content[0];
    if (content.type === "image_file")
        throw new Error("Why the fuck did the assistant return an image.");
    return content;
});
exports.getLatestMessage = getLatestMessage;
