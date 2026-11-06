import Fastify from "fastify";
import cors from "@fastify/cors";
import { caseQuerySchema, submissionSchema } from "@bind/shared";
import {
  caseTableTeX,
  caseToBibTeX,
  checkQuerySchema,
  resolveCheckSelection,
  runCheck,
  shapeTableTeX,
  sourceToBibTeX,
  bibtexKey,
  suggestedCitation,
  type Reviewer,
} from "@bind/core";
import {
  prisma,
  getCase,
  getProperty,
  getShape,
  listCases,
  listCheckCases,
  listJurisdictions,
  listProperties,
  listRejections,
  listShapes,
  previewDrafts,
  shapeTableInput,
  listTransitions,
  stats,
} from "@bind/db";
import { containsNulByte } from "./nulBytes";
import { registerReviewRoutes } from "./review";

/** Builds the API without binding a port. The entry file listens; tests call `inject`. */
export async function buildApp(options: { reviewers: Reviewer[]; logLevel?: string }) {
  const app = Fastify({ logger: { level: options.logLevel ?? "info" } });
  await app.register(cors, { origin: true });

  app.addHook("preHandler", async (req, reply) => {
    if ([req.params, req.query, req.body].some(containsNulByte)) return reply.code(400).send({ error: "nul_byte" });
  });

  app.get("/health", async () => ({ ok: true }));

  app.get("/cases", async (req, reply) => {
    const q = caseQuerySchema.safeParse(req.query);
    if (!q.success) return reply.code(400).send({ error: q.error.flatten() });
    // Held cases aren't public. A status filter narrows the list; it never widens it past published.
    const asksForHeld = q.data.status !== undefined && q.data.status !== "published";
    const cases = asksForHeld && !previewDrafts ? [] : await listCases(q.data);
    return { count: cases.length, cases };
  });

  app.get<{ Params: { slug: string } }>("/cases/:slug", async (req, reply) => {
    const c = await getCase(req.params.slug);
    if (!c || c.status !== "published") return reply.code(404).send({ error: "not_found" });
    return { ...c, citation: suggestedCitation(c), bibtex: caseToBibTeX(c) };
  });

  app.get("/shapes", async () => {
    const shapes = await listShapes();
    return shapes.map((s) => ({ ...s, cases: s.cases.filter((c) => c.status === "published") }));
  });

  app.get<{ Params: { slug: string } }>("/shapes/:slug", async (req, reply) => {
    const s = await getShape(req.params.slug);
    if (!s) return reply.code(404).send({ error: "not_found" });
    return { ...s, cases: s.cases.filter((c) => c.status === "published") };
  });

  app.get("/properties", async () => listProperties());

  app.get<{ Params: { slug: string } }>("/properties/:slug", async (req, reply) => {
    const p = await getProperty(req.params.slug);
    if (!p) return reply.code(404).send({ error: "not_found" });
    return p;
  });

  app.get("/check", async (req, reply) => {
    const q = checkQuerySchema.safeParse(req.query);
    if (!q.success) return reply.code(400).send({ error: q.error.flatten() });
    const [cases, properties, jurisdictions] = await Promise.all([listCheckCases(), listProperties(), listJurisdictions()]);
    const selection = resolveCheckSelection(q.data, { properties: properties.map((p) => p.slug), jurisdictions: jurisdictions.map((j) => j.code) });
    const shapes = runCheck(cases, selection);
    return { selection, count: shapes.reduce((n, g) => n + g.cases.length, 0), shapes };
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

  registerReviewRoutes(app, options.reviewers);

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

  return app;
}
