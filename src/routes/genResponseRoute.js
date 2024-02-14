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
exports.genResponse = exports.genResponseInputSchema = void 0;
const zod_1 = require("zod");
const sessions_1 = require("../lib/sessions");
const openai_1 = require("../lib/openai");
const constants_1 = require("../lib/constants");
const assistantHelpers_1 = require("../helpers/assistantHelpers");
exports.genResponseInputSchema = zod_1.z.object({
    session: zod_1.z
        .string()
        .min(1)
        .refine((s) => s in sessions_1.sessions, {
        message: "Session does not exist. Did you create a chat first?",
    }),
    message: zod_1.z.string().min(1),
});
const genResponse = ({ session, message, }) => __awaiter(void 0, void 0, void 0, function* () {
    // Create the message.
    const threadMessage = yield openai_1.openai.beta.threads.messages.create(sessions_1.sessions[session].threadId, {
        role: "user",
        content: message,
    });
    console.log("Created chat message: ", threadMessage);
    // Create the run.
    let run = yield openai_1.openai.beta.threads.runs.create(sessions_1.sessions[session].threadId, {
        assistant_id: constants_1.ASSISTANT_ID,
    });
    // Run & wait until it's fully resolved (& take care of required actions).
    run = yield (0, assistantHelpers_1.waitUntilStatusResolved)(sessions_1.sessions[session].threadId, run.id);
    if (run.status === "requires_action") {
        yield (0, assistantHelpers_1.resolveRequiredFunctionsRecursively)(run.required_action.submit_tool_outputs.tool_calls, session, sessions_1.sessions[session].threadId, run.id);
    }
    const latestMessage = yield (0, assistantHelpers_1.getLatestMessage)(sessions_1.sessions[session].threadId);
    return {
        message: latestMessage.text.value,
        state: sessions_1.sessions[session].gameState,
    };
});
exports.genResponse = genResponse;
