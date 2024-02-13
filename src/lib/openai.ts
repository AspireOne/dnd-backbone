import OpenAI from "openai";

/** Global OpenAi instance */
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
