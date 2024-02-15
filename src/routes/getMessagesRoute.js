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
import { sessionSchema } from "../helpers/schemaValidations";
import { openai } from "../lib/openai";
export const getMessagesInputSchema = z.object({
    session: sessionSchema,
    limit: z.number().int().min(1).max(100),
    after: z.string().min(1).optional(),
});
export const retrieveMessages = ({ session, after, limit, }) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield openai.beta.threads.messages.list(sessions[session].threadId, {
        limit,
        after,
        order: "desc",
    });
    return messages.data.map((m) => {
        if (m.content[0].type === "image_file")
            throw new Error("Image files are not supported rn.");
        return m.content[0].text.value;
    });
});
//# sourceMappingURL=getMessagesRoute.js.map