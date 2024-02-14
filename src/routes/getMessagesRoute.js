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
exports.retrieveMessages = exports.getMessagesInputSchema = void 0;
const zod_1 = require("zod");
const sessions_1 = require("../lib/sessions");
const schemaValidations_1 = require("../helpers/schemaValidations");
const openai_1 = require("../lib/openai");
exports.getMessagesInputSchema = zod_1.z.object({
    session: schemaValidations_1.sessionSchema,
    limit: zod_1.z.number().int().min(1).max(100),
    // Acts as a cursor.
    after: zod_1.z.string().min(1).optional(),
});
const retrieveMessages = ({ session, after, limit, }) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield openai_1.openai.beta.threads.messages.list(sessions_1.sessions[session].threadId, {
        limit,
        after,
        // asc vs desc
        order: "desc", // From newest.
    });
    return messages.data.map((m) => {
        if (m.content[0].type === "image_file")
            throw new Error("Image files are not supported rn.");
        return m.content[0].text.value;
    });
});
exports.retrieveMessages = retrieveMessages;
