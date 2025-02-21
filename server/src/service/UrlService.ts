import { Context } from "@oak/oak/context";
import { PoolClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { nanoid } from "npm:nanoid";
import { UrlModel } from "../model/UrlModel.ts";

export async function createShortUrl(ctx: Context, url: URL, length: number): Promise<UrlModel> {
    // To do: add customized alphabet
    // const nanoid = customAlphabet(alphabet, length)
    let sequence = "";
    try {
        sequence = nanoid(length);
    } catch (error) {
        console.error(error);
        throw error;
    }

    try {
        const connection: PoolClient = ctx.state.db.connection;
        const result = await connection.queryObject<UrlModel>(
            "INSERT INTO url (base_url, redirect_url) VALUES($base_url, $redirect_url) RETURNING *",
            { base_url: url.href , redirect_url: sequence }
        );
        return result.rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getUrlRecord(ctx: Context, shortUrl: string): Promise<UrlModel> {
    try {
        const connection: PoolClient = ctx.state.db.connection;
        const result = await connection.queryObject<UrlModel>(
            "SELECT * FROM url WHERE redirect_url = $redirect_url",
            { redirect_url: shortUrl }
        );
        return result.rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}
