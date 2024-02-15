import cors from "@fastify/cors";
export const runServer = (fastify) => {
    fastify.register(cors, {
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
//# sourceMappingURL=runServer.js.map