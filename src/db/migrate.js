var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import "dotenv/config";
import { db, dbClient } from "./db";
import { migrate } from "drizzle-orm/postgres-js/migrator";
function execute() {
    return __awaiter(this, void 0, void 0, function* () {
        yield migrate(db, {
            migrationsFolder: "src/db/migrations",
        });
        yield dbClient.end();
    });
}
execute();
//# sourceMappingURL=migrate.js.map