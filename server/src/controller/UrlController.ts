import { Router } from "@oak/oak/router";
import { Status } from "https://jsr.io/@oak/oak/17.1.4/deps.ts";
import { createShortUrl, getUrlRecord } from "../service/UrlService.ts";
import { UrlModel } from "../model/UrlModel.ts";
import { GENERATED_URL_LENGTH } from "../config.ts";
import { PoolClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { CollisionError } from "../model/CollisionError.ts";

export const urlShorten = new Router();
  
urlShorten.get("/:shortUrl", async (ctx) => {
  const dbConnection: PoolClient = ctx.state.db.connection;

  try {
    const urlRecord = await getUrlRecord(dbConnection, ctx.params.shortUrl);
    
    if (urlRecord === undefined) {
      ctx.response.status = Status.NotFound;
      ctx.response.body = {
        "error": "There is no such short URL."
      }

      return;
    }

    ctx.response.status = Status.Found;
    ctx.response.redirect(urlRecord.longUrl);
  } catch (error) {
    console.error(error);
    dbConnection.release();
    return ctx.throw(Status.InternalServerError, "Internal server error");
  }
});

urlShorten.post("/", async (ctx) => {
  if (!ctx.request.hasBody) {
    ctx.throw(Status.BadRequest, "Bad Request");
  }

  const body = ctx.request.body;
  
  if (body.type() !== "json") {
    ctx.throw(Status.BadRequest, "Unsupported format, only JSON is supported");
  }

  const json = await body.json();
  if (!json.url) {
    ctx.throw(Status.BadRequest, "URL field must be provided");
  }
  
  if (json.url === undefined) {
    ctx.throw(Status.BadRequest, "An URL must be specified to create short URL");
  }

  const givenUrl = new URL(json.url);

  let shortUrl: UrlModel;
  const dbConnection: PoolClient = ctx.state.db.connection;

  try {
    shortUrl = await createShortUrl(dbConnection, givenUrl, GENERATED_URL_LENGTH);
  } catch (error) {
    if (error instanceof CollisionError) {
      console.error(error.message);
    }
    dbConnection.release();
    return ctx.throw(Status.InternalServerError, "Internal server error");
  }

  ctx.response.status = Status.Created;
  ctx.response.body = {
    ...shortUrl
  };
  ctx.response.type = "application/json";
  return;
});
