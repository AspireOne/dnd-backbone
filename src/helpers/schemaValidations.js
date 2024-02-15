import { z } from "zod";
import { sessions } from "../lib/sessions";
export const sessionSchema = z
    .string()
    .min(1)
    .refine((s) => s in sessions, {
    message: "Session does not exist. Did you create a chat first?",
});
//# sourceMappingURL=schemaValidations.js.map