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
exports.createChat = void 0;
const sessions_1 = require("../lib/sessions");
const openai_1 = require("../lib/openai");
const assistantHelpers_1 = require("../helpers/assistantHelpers");
const constants_1 = require("../lib/constants");
/** Creates a new chat with Assistant's initial message and returns the new session */
const createChat = () => __awaiter(void 0, void 0, void 0, function* () {
    const session = genSessionUuid();
    const thread = yield openai_1.openai.beta.threads.create();
    console.log("New thread created with ID:", thread.id);
    sessions_1.sessions[session] = {
        threadId: thread.id,
        gameState: {
            stats: {
                health: 100,
                speed: 100,
                strength: 50,
                mana: 50,
            },
            inventoryItems: [],
        },
    };
    // Create the run.
    let run = yield openai_1.openai.beta.threads.runs.create(thread.id, {
        assistant_id: constants_1.ASSISTANT_ID,
    });
    // Dry-run to get first message that sets up the scene etc.
    run = yield (0, assistantHelpers_1.waitUntilStatusResolved)(thread.id, run.id);
    if (run.status === "requires_action") {
        yield (0, assistantHelpers_1.resolveRequiredFunctionsRecursively)(run.required_action.submit_tool_outputs.tool_calls, session, thread.id, run.id);
    }
    const latestMessage = yield (0, assistantHelpers_1.getLatestMessage)(thread.id);
    return { session, message: latestMessage.text.value };
});
exports.createChat = createChat;
function genSessionUuid() {
    const date = new Date();
    const formattedDate = date.toISOString().replace(/[:.]/g, "-");
    // Generate four random alphanumeric characters
    const randomChars = Math.random().toString(36).substring(2, 6);
    return `${formattedDate}/${randomChars}`;
}
