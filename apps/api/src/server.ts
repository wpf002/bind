import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { caseQuerySchema, submissionSchema } from "@bind/shared";
import { caseTableTeX, caseToBibTeX, shapeTableTeX, sourceToBibTeX, bibtexKey, suggestedCitation } from "@bind/core";
import {
  prisma,
  getCase,
  getShape,
  listCases,
  listJurisdictions,
  listRejections,
  listShapes,
  shapeTableInput,
  listTransitions,
  stats,
} from "@bind/db";

const app = Fastify({ logger: { level: "info" } });
await app.register(cors, { origin: true });

app.get("/health", async () => ({ ok: true }));

app.get("/cases", async (req, reply) => {
  const q = caseQuerySchema.safeParse(req.query);
  if (!q.success) return reply.code(400).send({ error: q.error.flatten() });
  const cases = await listCases(q.data);
  return { count: cases.length, cases };
});

app.get<{ Params: { slug: string } }>("/cases/:slug", async (req, reply) => {
  const c = await getCase(req.params.slug);
  if (!c || c.status !== "published") return reply.code(404).send({ error: "not_found" });
  return { ...c, citation: suggestedCitation(c), bibtex: caseToBibTeX(c) };
});

app.get("/shapes", async () => listShapes());

app.get<{ Params: { slug: string } }>("/shapes/:slug", async (req, reply) => {
  const s = await getShape(req.params.slug);
  if (!s) return reply.code(404).send({ error: "not_found" });
  return { ...s, cases: s.cases.filter((c) => c.status === "published") };
});

app.get("/jurisdictions", async () => listJurisdictions());
app.get("/rejections", async () => listRejections());
app.get("/transitions", async () => listTransitions());
app.get("/stats", async () => stats());

app.post("/submissions", async (req, reply) => {
  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(422).send({ error: parsed.error.flatten() });
  const s = await prisma.submission.create({ data: parsed.data, select: { id: true, status: true, submittedAt: true } });
  return reply.code(201).send(s);
});

app.get("/export/bibtex", async (_req, reply) => {
  const cases = await listCases({ limit: 200 });
  const body = cases
    .flatMap((c) => [caseToBibTeX(c), ...c.citations.map((s, i) => sourceToBibTeX(s, `${bibtexKey(c.slug)}:src${i + 1}`))])
    .join("\n\n");
  return reply.type("application/x-bibtex; charset=utf-8").header("content-disposition", 'inline; filename="bind.bib"').send(body + "\n");
});

app.get<{ Querystring: { table?: string } }>("/export/latex", async (req, reply) => {
  const tex =
    req.query.table === "cases"
      ? caseTableTeX(
          (await listCases({ limit: 200 })).map((c) => ({
            slug: c.slug,
            corpusRef: c.corpusRef,
            title: c.title,
            shape: c.shapes[0]?.shape.name ?? "",
            resolvability: c.resolvability,
          }))
        )
      : shapeTableTeX(...(await shapeTableInput()));
  return reply.type("application/x-tex; charset=utf-8").send(tex + "\n");
});

const port = Number(process.env.API_PORT ?? 4300);
app.listen({ port, host: "127.0.0.1" }).catch((e) => {
  app.log.error(e);
  process.exit(1);
});
