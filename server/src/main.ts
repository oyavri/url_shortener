import { Application } from "jsr:@oak/oak/application";
import { urlShorten } from "./controller/UrlController.ts";
import { hookDatabaseConnection } from "./middleware/HookDatabaseConnection.ts";

const app = new Application();

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${
    hostname ?? "localhost"
    }:${port}`,
  );
});

// Logger
app.use(async (ctx, next) => {
  await next();
  console.log(`${ctx.request.method} ${ctx.request.url}`);
});

app.use(async (ctx, next) => {
  await hookDatabaseConnection(ctx);
  await next();
})

app.use(urlShorten.routes());

await app.listen({ port: 8000 });
