import { Router } from "@oak/oak/router";
import { Status } from "https://jsr.io/@oak/oak/17.1.4/deps.ts";
import { createShortUrl, getUrlRecord } from "../service/UrlService.ts";
import { UrlModel } from "../model/UrlModel.ts";
import { URL_LENGTH } from "../config.ts";

export const urlShorten = new Router();
  
urlShorten.get("/:shortUrl", async (ctx) => {
    try {
        const urlRecord = await getUrlRecord(ctx, ctx.params.shortUrl);
        const shortUrl = urlRecord.shortUrl;
        
        ctx.response.status = Status.Found;
        ctx.response.redirect(shortUrl);
    } catch (error) {
        console.error(error);
        ctx.state.db.connection.release();
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
    const givenUrl = new URL(json.url);

    let shortUrl: UrlModel;

    try {
        shortUrl = await createShortUrl(ctx, givenUrl, URL_LENGTH);
    } catch (error) {
        console.error(error);
        ctx.state.db.connection.release();
        return ctx.throw(Status.InternalServerError, "Internal server error");
    }

    ctx.response.status = Status.Created;
    ctx.response.body = {
        "success": true,
        ...shortUrl
    };
    ctx.response.type = "json";
    return;
});
