import { Router } from "@oak/oak/router";
import { PoolClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { Status } from "https://jsr.io/@oak/oak/17.1.4/deps.ts";
import { UserModel } from "../model/UserModel.ts";
import { loginUser, registerUser } from "../service/AuthenticationService.ts";
import { UserAlreadyExistsError } from "../model/UserAlreadyExistsError.ts";
import { UserNotFoundError } from "../model/UserNotFoundError.ts";

export const authRouter = new Router();

authRouter.post("/register", async (ctx) => {
  if (!ctx.request.hasBody) {
    ctx.response.status = Status.BadRequest;
    ctx.response.type = "application/json";
    ctx.response.body = {
        "error": "No payload found"
    };
  }

  const body = ctx.request.body;
  
  if (body.type() !== "json") {
    ctx.response.status = Status.BadRequest;
    ctx.response.type = "application/json";
    ctx.response.body = {
        "error": "Unsupported format, only JSON is supported"
    };
  }

  const json = await body.json();

  if (!json.username ||!json.password || !json.email) {
    ctx.response.status = Status.BadRequest;
    ctx.response.type = "application/json";
    ctx.response.body = {
      "error": "All fields are required"
    };
  }

  const userCandidate: UserModel = {
    username: json.username,
    password: json.password,
    email: json.email,
  };

  const dbConnection: PoolClient = ctx.state.db.connection;

  try {
    const registeredUser = await registerUser(dbConnection, userCandidate);

    ctx.response.status = Status.Created;
    ctx.response.type = "application/json";
    ctx.response.body = {
        "message": "User created successfully!",
    }

    return;
  } catch (error) {
    // user already exists!
    if (error instanceof UserAlreadyExistsError) {
      ctx.response.status = Status.Conflict;
      ctx.response.type = "application/json";
      ctx.response.body = {
        "error": "User is already registered"
      };
      return;
    }

    throw error;
  }
});

authRouter.post("/login", async (ctx) => {
  if (!ctx.request.hasBody) {
    ctx.response.status = Status.BadRequest;
    ctx.response.type = "application/json";
    ctx.response.body = {
        "error": "No payload found"
    };
  }

  const body = ctx.request.body;
  
  if (body.type() !== "json") {
    ctx.response.status = Status.BadRequest;
    ctx.response.type = "application/json";
    ctx.response.body = {
        "error": "Unsupported format, only JSON is supported"
    };
  }
  const json = await body.json();

  if (!json.username || !json.password) {
    ctx.response.status = Status.BadRequest;
    ctx.response.type = "application/json";
    ctx.response.body = {
      "error": "Username and password required"
    };
  }

  const dbConnection: PoolClient = ctx.state.db.connection;
  try {
    const user = loginUser(dbConnection, json.username, json.password);
    ctx.response.status = Status.OK;
    ctx.response.type = "application/json";
    ctx.response.body = {
      "message": "User logged in successfully",
    }

    return;
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      ctx.response.status = Status.NotFound;
      ctx.response.type = "application/json";
      ctx.response.body = {
        "error": "User not found"
      };

    }
    console.error(error);
  }
});
