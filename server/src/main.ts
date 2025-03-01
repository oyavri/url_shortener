import { Application } from "jsr:@oak/oak/application";
import { urlShorten } from "./controller/UrlController.ts";
import { hookDatabaseConnection } from "./middleware/HookDatabaseConnection.ts";
import { authMiddleware } from "./middleware/AuthMiddleware.ts";

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

// Pass database connection to the context of the request
app.use(async (ctx, next) => {
  await hookDatabaseConnection(ctx);
  await next();
})

// Authentication middleware
// app.use(authMiddleware);

app.use(urlShorten.routes());

await app.listen({ port: 8000 });
