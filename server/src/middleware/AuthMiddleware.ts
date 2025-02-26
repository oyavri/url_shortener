import { Status } from "https://jsr.io/@oak/oak/17.1.4/deps.ts";
import * as jose from "https://deno.land/x/jose@v6.0.8/index.ts"; 
import { Next } from "@oak/oak/middleware";
import { Context } from "@oak/oak/context";

// Introduce JWT SECRET
const JWT_SECRET = new TextEncoder().encode(Deno.env.get("JWT_SECRET"));
if (JWT_SECRET == undefined) {
  throw new Error("JWT secret is not found");
}

export async function authMiddleware(ctx: Context, next: Next) {
  const token = await ctx.cookies.get("token");
  if (token == undefined) {
    throw new Error("Token is not found");
  }

  try {
    const decoded = await jose.jwtVerify(token, JWT_SECRET);
    ctx.state.user = decoded;
    await next();
  } catch (error) {
    console.error(error);
    ctx.response.status = Status.Unauthorized;
    ctx.response.body = {
      "message": "Invalid token"
    };
    ctx.response.type = "application/json";
  }
}
