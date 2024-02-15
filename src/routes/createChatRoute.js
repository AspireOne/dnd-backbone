var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { sessions } from "../lib/sessions";
import { sessions as dbSessions, stats } from "../db/schema";
import { openai } from "../lib/openai";
import { getLatestMessage, resolveRequiredFunctionsRecursively, waitUntilStatusResolved, } from "../helpers/assistantHelpers";
import { ASSISTANT_ID } from "../lib/constants";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
export const createChat = () => __awaiter(void 0, void 0, void 0, function* () {
    let sessionId = "";
    let transactionSuccess = false;
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    yield db.transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("FFFFFFFFFFFFFFFFFFFasdasdasdasdFFFF");
        const _newSession = yield tx
            .insert(dbSessions)
            .values({
            threadId: thread.id,
        })
            .returning();
        const newSession = _newSession[0];
        sessionId = newSession.id + "";
        const _newStats = yield tx
            .insert(stats)
            .values({
            sessionId: newSession.id,
            health: 100,
            speed: 100,
            mana: 50,
            strength: 50,
        })
            .returning();
        const newStats = _newStats[0];
        yield tx
            .update(dbSessions)
            .set({ statsId: newStats.id })
            .where(eq(dbSessions.id, newSession.id));
        console.log("New session created:", newSession);
        console.log("New stats created:", newStats);
        sessions[newSession.id] = {
            id: newSession.id,
            threadId: thread.id,
            gameState: {
                stats: newStats,
                inventoryItems: [],
            },
        };
        transactionSuccess = true;
    }));
    if (!transactionSuccess) {
        throw new Error("Failed to add new session data to database.");
    }
    const thread = yield openai.beta.threads.create();
    console.log("New thread created with ID:", thread.id);
    let run = yield openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID,
    });
    run = yield waitUntilStatusResolved(thread.id, run.id);
    if (run.status === "requires_action") {
        yield resolveRequiredFunctionsRecursively(run.required_action.submit_tool_outputs.tool_calls, sessionId, thread.id, run.id);
    }
    const latestMessage = yield getLatestMessage(thread.id);
    return { session: sessionId, message: latestMessage.text.value };
});
function genSessionUuid() {
    const date = new Date();
    const formattedDate = date.toISOString().replace(/[:.]/g, "-");
    const randomChars = Math.random().toString(36).substring(2, 6);
    return `${formattedDate}/${randomChars}`;
}
//# sourceMappingURL=createChatRoute.js.map