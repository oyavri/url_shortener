import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { Context } from "@oak/oak/context";
import "jsr:@std/dotenv/load";

const POOL_CONNECTIONS = 20;
const dbPool = new Pool(
  {
    database: Deno.env.get("POSTGRES_DATABASE") || "database",
    hostname: Deno.env.get("POSTGRES_HOSTNAME") || "hostname",
    password: Deno.env.get("POSTGRES_PASSWORD") || "password",
    port: Deno.env.get("POSTGRES_PORT") || 5432,
    user: Deno.env.get("POSTGRES_USER") || "user",
  },
  Number(Deno.env.get("POSTGRES_POOL_SIZE")) || POOL_CONNECTIONS,
  true
);

export async function getDatabaseConnection(ctx: Context): Promise<Context> {
    using client = await dbPool.connect();
    ctx.state.db = {
        connection: client
    };

    return ctx;
}
