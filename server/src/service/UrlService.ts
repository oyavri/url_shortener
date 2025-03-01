import { PoolClient, PostgresError } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { nanoid } from "npm:nanoid";
import { UrlModel } from "../model/UrlModel.ts";
import { CollisionError } from "../model/CollisionError.ts";

export async function createShortUrl(dbConnection: PoolClient, url: URL, length: number, maxRetries: number = 5): Promise<UrlModel> {
  for (let attempts = 0; attempts < maxRetries; attempts++) {
    try {
      const sequence = generateSequence(length);

      const result = await dbConnection.queryObject<UrlModel>({
        camelCase: true,
        text: "INSERT INTO url (long_url, short_url) VALUES($longUrl, $shortUrl) RETURNING *;",
        args: { longUrl: url.href , shortUrl: sequence }
      });

      return result.rows[0];
    } catch (error) {
      // code 23505 means collision, if there is a collision, retry
      if (error instanceof PostgresError && error.fields.code == "23505")
        continue;

      throw error;
    }
  }
  
  throw new CollisionError(`Failed to create the resource for "${url}" after ${maxRetries} attempts.`);
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
      text: "SELECT * FROM url WHERE short_url = $shortUrl;",
      args: { shortUrl: shortUrl }
    });

    return result.rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}
