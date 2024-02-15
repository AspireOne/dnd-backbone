var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { db } from "../db/db";
import { inventoryItems, sessions as sessionsTable, stats } from "../db/schema";
import { eq } from "drizzle-orm";
import { sessions } from "../lib/sessions";
export const fetchAndFillSessions = () => __awaiter(void 0, void 0, void 0, function* () {
    const dbSessions = yield db
        .select()
        .from(sessionsTable)
        .leftJoin(stats, eq(sessionsTable.id, stats.sessionId));
    const dbInventoryItems = yield db.select().from(inventoryItems);
    dbSessions.forEach((_session) => {
        const { sessions: session, stats } = _session;
        sessions[session.id] = {
            id: session.id,
            threadId: session.threadId,
            gameState: {
                inventoryItems: [],
                stats: { health: 0, mana: 0, speed: 0, strength: 0 },
            },
        };
        if (stats) {
            sessions[session.id].gameState.stats = {
                health: stats.health,
                mana: stats.mana,
                speed: stats.speed,
                strength: stats.strength,
            };
        }
        const sessionItems = dbInventoryItems.filter((item) => item.sessionId === session.id);
        sessions[session.id].gameState.inventoryItems = sessionItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            img: item.icon,
        }));
        console.log(JSON.stringify(sessions[session.id]));
    });
});
//# sourceMappingURL=fetchAndTransformSessions.js.map