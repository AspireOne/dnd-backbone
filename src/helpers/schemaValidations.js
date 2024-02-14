"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionSchema = void 0;
const zod_1 = require("zod");
const sessions_1 = require("../lib/sessions");
exports.sessionSchema = zod_1.z
    .string()
    .min(1)
    .refine((s) => s in sessions_1.sessions, {
    message: "Session does not exist. Did you create a chat first?",
});
