import { PoolClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { nanoid } from "npm:nanoid";
import { UrlModel } from "../model/UrlModel.ts";

export async function createShortUrl(dbConnection: PoolClient, url: URL, length: number): Promise<UrlModel> {
  const sequence = generateSequence(length);

  try {
    const result = await dbConnection.queryObject<UrlModel>({
      camelCase: true,
      text: "INSERT INTO url (long_url, short_url) VALUES($longUrl, $shortUrl) RETURNING *",
      args: { longUrl: url.href , shortUrl: sequence }
    });

    console.log(result)
    return result.rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function generateSequence(length: number): string {
  // To do: add customized alphabet
  // const nanoid = customAlphabet(alphabet, length)
  try {
    return nanoid(length);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getUrlRecord(dbConnection: PoolClient, shortUrl: string): Promise<UrlModel> {
  try {
    const result = await dbConnection.queryObject<UrlModel>({
      camelCase: true,
      text: "SELECT * FROM url WHERE short_url = $shortUrl",
      args: { shortUrl: shortUrl }
    });

    return result.rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}
