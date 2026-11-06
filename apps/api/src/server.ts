import "dotenv/config";
import { parseReviewers } from "@bind/core";
import { buildApp } from "./app";

// Fails at startup if REVIEWERS is set but malformed.
const reviewers = process.env.REVIEWERS ? parseReviewers(process.env.REVIEWERS) : [];

const app = await buildApp({ reviewers });

const port = Number(process.env.API_PORT ?? 4300);
app.listen({ port, host: "127.0.0.1" }).catch((e) => {
  app.log.error(e);
  process.exit(1);
});
