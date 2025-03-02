import { Application } from "jsr:@oak/oak/application";
import { urlShorten } from "./controller/UrlController.ts";
import { hookDatabaseConnection, releaseDatabaseConnection } from "./middleware/DatabaseConnection.ts";
import { authMiddleware } from "./middleware/AuthMiddleware.ts";
import { authRouter } from "./controller/AuthController.ts";

const app = new Application();

app.addEventListener("listen", ({ port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${"localhost"}:${port}`,
  );
});

// Logger
app.use(async (ctx, next) => {
  await next();
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  if (ctx.request.hasBody) {
    console.log("---- Request ----");
    console.log(await ctx.request.body.json());
    console.log("-----------------");
  }
});

// Pass database connection to the context of the request
app.use(async (ctx, next) => {
  await hookDatabaseConnection(ctx);
  await next();
  await releaseDatabaseConnection(ctx);
})

// Authentication middleware
// app.use(authMiddleware);

app.use(authRouter.routes());
app.use(urlShorten.routes());

await app.listen({ port: 8000 });
