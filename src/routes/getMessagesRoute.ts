import { z } from "zod";
import { sessions } from "../lib/sessions";
import { sessionSchema } from "../helpers/schemaValidations";
import { openai } from "../lib/openai";

export const getMessagesInputSchema = z.object({
  session: sessionSchema,
  limit: z.number().int().min(1).max(100),
  // Acts as a cursor.
  after: z.string().min(1).optional(),
});

export type GetMessagesInput = z.infer<typeof getMessagesInputSchema>;

export const retrieveMessages = async ({ session, after, limit }: GetMessagesInput) => {
  const messages = await openai.beta.threads.messages.list(
    sessions[session].threadId,
    {
      limit,
      after,
      // asc vs desc
      order: "desc", // From newest.
    },
  );
  return messages.data.map((m) => m.content);
};
