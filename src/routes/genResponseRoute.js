var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { z } from "zod";
import { sessions } from "../lib/sessions";
import { openai } from "../lib/openai";
import { ASSISTANT_ID } from "../lib/constants";
import { getLatestMessage, waitUntilStatusResolved, resolveRequiredFunctionsRecursively, } from "../helpers/assistantHelpers";
export const genResponseInputSchema = z.object({
    session: z
        .string()
        .min(1)
        .refine((s) => s in sessions, {
        message: "Session does not exist. Did you create a chat first?",
    }),
    message: z.string().min(1),
});
export const genResponse = ({ session, message, }) => __awaiter(void 0, void 0, void 0, function* () {
    const threadMessage = yield openai.beta.threads.messages.create(sessions[session].threadId, {
        role: "user",
        content: message,
    });
    console.log("Created chat message: ", threadMessage);
    let run = yield openai.beta.threads.runs.create(sessions[session].threadId, {
        assistant_id: ASSISTANT_ID,
    });
    run = yield waitUntilStatusResolved(sessions[session].threadId, run.id);
    if (run.status === "requires_action") {
        yield resolveRequiredFunctionsRecursively(run.required_action.submit_tool_outputs.tool_calls, session, sessions[session].threadId, run.id);
    }
    const latestMessage = yield getLatestMessage(sessions[session].threadId);
    return {
        message: latestMessage.text.value,
        state: sessions[session].gameState,
    };
});
//# sourceMappingURL=genResponseRoute.js.map