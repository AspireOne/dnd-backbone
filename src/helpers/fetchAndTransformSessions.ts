import { db } from "../db/db";
import { inventoryItems, sessions as sessionsTable, stats } from "../db/schema";
import { eq } from "drizzle-orm";
import { sessions } from "../lib/sessions";

export const fetchAndFillSessions = async () => {
  const dbSessions = await db
    .select()
    .from(sessionsTable)
    .leftJoin(stats, eq(sessionsTable.id, stats.sessionId));
  //const dbStats = await db.select().from(stats);
  const dbInventoryItems = await db.select().from(inventoryItems);

  // Transform the data into the format we need.
  // biome-ignore lint/complexity/noForEach: <explanation>
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

    // Find the stats for this session
    //const sessionStats = dbStats.find((stat) => stat.sessionId === session.id);
    if (stats) {
      sessions[session.id]!.gameState.stats = {
        health: stats.health,
        mana: stats.mana,
        speed: stats.speed,
        strength: stats.strength,
      };
    }

    // Filter the inventory items for this session
    const sessionItems = dbInventoryItems.filter(
      (item) => item.sessionId === session.id,
    );
    sessions[session.id]!.gameState.inventoryItems = sessionItems.map((item) => ({
      name: item.name!,
      quantity: item.quantity!,
      img: item.icon!,
    }));

    console.log(JSON.stringify(sessions[session.id]));
  });
};

/*
async function fetchSessionsWithDetails() {
  const query = sql`
        SELECT
            row_to_json(s.*) AS session,
            row_to_json(st.*) AS stats,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', ii.id,
                    'name', ii.name,
                    'quantity', ii.quantity,
                    'icon', ii.icon
                )
            ) FILTER (WHERE ii.id IS NOT NULL) AS inventory_items
        FROM
            ${sessions} s
        LEFT JOIN ${stats} st ON
            s.id = st.session_id
        LEFT JOIN ${inventoryItems} ii ON
            s.id = ii.session_id
        GROUP BY
            s.id, st.id;
    `;

  return await db.execute(query);
}

async function transformSessionsData(): Promise<Record<string, SessionData>> {
  const rawData = await fetchSessionsWithDetails();
  const sessions: Record<string, SessionData> = {};

  // biome-ignore lint/complexity/noForEach: <explanation>
  rawData.forEach((row) => {
    const session = row.session;
    const stats = row.stats;
    // @ts-ignore
    const inventoryItems = row.inventory_items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      img: item.icon, // Assuming 'icon' in the raw data corresponds to 'img' in GameState
    }));

    // Assuming 'thread_id' and other properties are directly accessible from the session/stats JSON
    // @ts-ignore
    sessions[session.id] = {
      // @ts-ignore
      threadId: session.thread_id,
      // @ts-ignore
      gameState: {
        inventoryItems,
        // @ts-ignore
        stats: {
          // @ts-ignore
          health: stats.health,
          // @ts-ignore
          mana: stats.mana,
          // @ts-ignore
          speed: stats.speed,
          // @ts-ignore
          strength: stats.strength,
        },
      },
    };
  });

  return sessions;
}
*/
