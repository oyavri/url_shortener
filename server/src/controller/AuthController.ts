import { Router } from "@oak/oak/router";
import { PoolClient, PostgresError } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { Status } from "https://jsr.io/@oak/oak/17.1.4/deps.ts";
import { UserModel } from "../model/UserModel.ts";
import { registerUser } from "../service/AuthenticationService.ts";

export const authRouter = new Router();

authRouter.post("/register", async (ctx) => {
  if (!ctx.request.hasBody) {
    ctx.throw(Status.BadRequest, "Bad Request");
  }

  const body = ctx.request.body;
  if (body.type() !== "json") {
    ctx.throw(Status.BadRequest, "Unsupported format, only JSON is supported");
  }

  const json = await body.json();
  const userCandidate: UserModel = {
    username: json.username,
    password: json.password,
    email: json.email,
  };

  const dbConnection: PoolClient = ctx.state.db.connection;

  try {
    registerUser(dbConnection, userCandidate);
    
  } catch (error) {
    // user already exists!
    if (error instanceof PostgresError && error.fields.code == "23505") {
      console.error("Multiple registration on same username");
      console.error(error);
    }
    throw error;
  }
});
// authRouter.post("/login", async (ctx) => {});
