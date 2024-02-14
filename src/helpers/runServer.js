"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runServer = void 0;
const cors_1 = __importDefault(require("@fastify/cors"));
/** This function initializes and starts the server. */
const runServer = (fastify) => {
    fastify.register(cors_1.default, {
        origin: true,
    });
    fastify.listen({ port: 3000 }, (err, address) => {
        if (err) {
            fastify.log.error(err);
            process.exit(1);
        }
        console.log(`Server is now listening on ${address}`);
    });
};
exports.runServer = runServer;
