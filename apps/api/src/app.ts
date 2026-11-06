import Fastify, { type FastifySchema } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import { hasZodFastifySchemaValidationErrors, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { buildSubmissionSchema, caseQuerySchema, corpusExportSchema } from "@bind/shared";
import {
  atomFeed,
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
  CORPUS_JSON_FILENAME,
  corpusExport,
  corpusExportText,
  prisma,
  getCase,
  getProperty,
  getShape,
  listCases,
  listChanges,
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
import { toSubmissionRow } from "./submissions";
import {
  badRequestSchema,
  caseDetailSchema,
  caseListSchema,
  changeListSchema,
  checkResponseSchema,
  healthSchema,
  jurisdictionListSchema,
  latexQuerySchema,
  notFoundSchema,
  openApiDocumentSchema,
  propertyDetailSchema,
  propertyListSchema,
  rejectionListSchema,
  shapeDetailSchema,
  shapeListSchema,
  slugParamsSchema,
  statsSchema,
  transitionListSchema,
} from "./schemas";

declare module "fastify" {
  interface FastifyInstance {
    /** Every public GET route on this instance, as Fastify spells it (`/cases/:slug`). Hidden routes stay out. */
    readRoutes: string[];
  }
}

const API_VERSION = "1.0.0";
const EXPORT_LIMIT = 200;
/** A static corpus changes on publish, not per request. One hour keeps mirrors fresh without hammering the DB. */
const EXPORT_CACHE_CONTROL = "public, max-age=3600";

/** Where the web app's pages live. Feed entries link there. */
const DEFAULT_SITE_URL = "http://localhost:3300";
const CHANGES_FEED_TITLE = "Bind Changes";
const ATOM_TYPE = "application/atom+xml";
const BIBTEX_TYPE = "application/x-bibtex";
const LATEX_TYPE = "application/x-tex";
const JSON_TYPE = "application/json";
const utf8 = (type: string) => `${type}; charset=utf-8`;

const isZodSchema = (value: unknown): value is z.ZodTypeAny =>
  typeof value === "object" && value !== null && "_def" in value && typeof (value as { safeParse?: unknown }).safeParse === "function";

/** OpenAPI 3.1 takes JSON Schema as is, so nullables become `type: [..., "null"]` instead of the 3.0 `nullable` flag. */
function toJsonSchema(schema: unknown): unknown {
  if (!isZodSchema(schema)) return schema;
  const json: Record<string, unknown> = zodToJsonSchema(schema, { target: "jsonSchema7", $refStrategy: "none" });
  delete json.$schema;
  return json;
}

function transformSchema({ schema, url }: { schema: FastifySchema; url: string }) {
  const { params, querystring, body, headers, response, ...rest } = schema;
  const responses = response && typeof response === "object" ? Object.entries(response as Record<string, unknown>) : [];
  return {
    url,
    schema: {
      ...rest,
      params: toJsonSchema(params),
      querystring: toJsonSchema(querystring),
      body: toJsonSchema(body),
      headers: toJsonSchema(headers),
      response: responses.length ? Object.fromEntries(responses.map(([code, s]) => [code, toJsonSchema(s)])) : undefined,
    },
  };
}

/** Builds the API without binding a port. The entry file listens; tests call `inject`. */
export async function buildApp(options: { reviewers: Reviewer[]; logLevel?: string; siteUrl?: string }) {
  const app = Fastify({ logger: { level: options.logLevel ?? "info" } });
  const siteUrl = options.siteUrl ?? DEFAULT_SITE_URL;
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const readRoutes: string[] = [];
  app.decorate("readRoutes", readRoutes);
  app.addHook("onRoute", (route) => {
    const methods = Array.isArray(route.method) ? route.method : [route.method];
    if (methods.includes("GET") && !route.schema?.hide) readRoutes.push(route.url);
  });

  await app.register(cors, { origin: true });
  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Bind API",
        version: API_VERSION,
        description: "Read access to the Bind corpus: published cases, their shapes, properties, instruments and sources.",
      },
    },
    transform: transformSchema,
  });

  app.setErrorHandler((err, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      const issues = err.validation.map((v) => ({ path: v.instancePath, message: v.message }));
      return reply.code(400).send({ error: "validation", issues });
    }
    // Anything else falls through to Fastify's default handler and its status code.
    return reply.send(err);
  });

  app.addHook("preHandler", async (req, reply) => {
    if ([req.params, req.query, req.body].some(containsNulByte)) return reply.code(400).send({ error: "nul_byte" });
  });

  const api = app.withTypeProvider<ZodTypeProvider>();

  api.get("/health", { schema: { summary: "Liveness check", response: { 200: healthSchema } } }, async () => ({ ok: true as const }));

  api.get(
    "/cases",
    { schema: { summary: "List published cases", querystring: caseQuerySchema, response: { 200: caseListSchema, 400: badRequestSchema } } },
    async (req) => {
      // Held cases aren't public. A status filter narrows the list; it never widens it past published.
      const asksForHeld = req.query.status !== undefined && req.query.status !== "published";
      const cases = asksForHeld && !previewDrafts ? [] : await listCases(req.query);
      return { count: cases.length, cases };
    }
  );

  api.get(
    "/cases/:slug",
    {
      schema: {
        summary: "One published case with its citation string and BibTeX",
        params: slugParamsSchema,
        response: { 200: caseDetailSchema, 400: badRequestSchema, 404: notFoundSchema },
      },
    },
    async (req, reply) => {
      const c = await getCase(req.params.slug);
      if (!c || c.status !== "published") return reply.code(404).send({ error: "not_found" });
      return { ...c, citation: suggestedCitation(c), bibtex: caseToBibTeX(c) };
    }
  );

  api.get("/shapes", { schema: { summary: "The taxonomy with each shape's published cases", response: { 200: shapeListSchema } } }, async () => {
    const shapes = await listShapes();
    return shapes.map((s) => ({ ...s, cases: s.cases.filter((c) => c.status === "published") }));
  });

  api.get(
    "/shapes/:slug",
    {
      schema: {
        summary: "One shape with its audits and published cases",
        params: slugParamsSchema,
        response: { 200: shapeDetailSchema, 400: badRequestSchema, 404: notFoundSchema },
      },
    },
    async (req, reply) => {
      const s = await getShape(req.params.slug);
      if (!s) return reply.code(404).send({ error: "not_found" });
      return { ...s, cases: s.cases.filter((c) => c.status === "published") };
    }
  );

  api.get(
    "/properties",
    { schema: { summary: "Architectural properties with their published cases", response: { 200: propertyListSchema } } },
    async () => listProperties()
  );

  api.get(
    "/properties/:slug",
    {
      schema: {
        summary: "One property with its cases grouped by primary shape",
        params: slugParamsSchema,
        response: { 200: propertyDetailSchema, 400: badRequestSchema, 404: notFoundSchema },
      },
    },
    async (req, reply) => {
      const p = await getProperty(req.params.slug);
      if (!p) return reply.code(404).send({ error: "not_found" });
      return p;
    }
  );

  api.get(
    "/check",
    {
      schema: {
        summary: "Design check: the shapes and cases a set of properties and jurisdictions hits",
        querystring: checkQuerySchema,
        response: { 200: checkResponseSchema, 400: badRequestSchema },
      },
    },
    async (req) => {
      const [cases, properties, jurisdictions] = await Promise.all([listCheckCases(), listProperties(), listJurisdictions()]);
      const selection = resolveCheckSelection(req.query, {
        properties: properties.map((p) => p.slug),
        jurisdictions: jurisdictions.map((j) => j.code),
      });
      const shapes = runCheck(cases, selection);
      return { selection, count: shapes.reduce((n, g) => n + g.cases.length, 0), shapes };
    }
  );

  api.get(
    "/jurisdictions",
    { schema: { summary: "Jurisdictions with instrument and published case counts", response: { 200: jurisdictionListSchema } } },
    async () => listJurisdictions()
  );
  api.get("/rejections", { schema: { summary: "Rejected claims and why", response: { 200: rejectionListSchema } } }, async () =>
    listRejections()
  );
  api.get(
    "/transitions",
    { schema: { summary: "State transitions of published cases, newest first", response: { 200: transitionListSchema } } },
    async () => listTransitions()
  );
  api.get("/stats", { schema: { summary: "Corpus counts", response: { 200: statsSchema } } }, async () => stats());

  api.get(
    "/changes",
    { schema: { summary: "What changed in the published corpus, newest first", response: { 200: changeListSchema } } },
    async () => (await listChanges()).map((event) => ({ ...event, url: new URL(event.url, siteUrl).toString() }))
  );
  api.get(
    "/changes.atom",
    { schema: { summary: "The changes as an Atom 1.0 feed", produces: [ATOM_TYPE], response: { 200: z.string() } } },
    async (req, reply) => {
      const feedUrl = `${req.protocol}://${req.host}/changes.atom`;
      const body = atomFeed(await listChanges(), { siteUrl, feedUrl, title: CHANGES_FEED_TITLE, generatedAt: new Date() });
      return reply.type(utf8(ATOM_TYPE)).header("cache-control", EXPORT_CACHE_CONTROL).send(body);
    }
  );

  app.post("/submissions", { schema: { hide: true } }, async (req, reply) => {
    const [properties, jurisdictions] = await Promise.all([
      prisma.architecturalProperty.findMany({ select: { slug: true } }),
      prisma.jurisdiction.findMany({ select: { code: true } }),
    ]);
    const schema = buildSubmissionSchema({ properties: properties.map((p) => p.slug), jurisdictions: jurisdictions.map((j) => j.code) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(422).send({ error: parsed.error.flatten() });
    const s = await prisma.submission.create({ data: toSubmissionRow(parsed.data), select: { id: true, status: true, submittedAt: true } });
    return reply.code(201).send(s);
  });

  registerReviewRoutes(app, options.reviewers);

  api.get(
    "/export/bibtex",
    { schema: { summary: "Every published case and its sources as BibTeX", produces: [BIBTEX_TYPE], response: { 200: z.string() } } },
    async (_req, reply) => {
      const cases = await listCases({ limit: EXPORT_LIMIT });
      const body = cases
        .flatMap((c) => [caseToBibTeX(c), ...c.citations.map((s, i) => sourceToBibTeX(s, `${bibtexKey(c.slug)}:src${i + 1}`))])
        .join("\n\n");
      return reply.type(utf8(BIBTEX_TYPE)).header("content-disposition", 'inline; filename="bind.bib"').send(body + "\n");
    }
  );

  api.get(
    "/export/latex",
    {
      schema: {
        summary: "The paper's shape or case table as LaTeX",
        querystring: latexQuerySchema,
        produces: [LATEX_TYPE],
        response: { 200: z.string(), 400: badRequestSchema },
      },
    },
    async (req, reply) => {
      const tex =
        req.query.table === "cases"
          ? caseTableTeX(
              (await listCases({ limit: EXPORT_LIMIT })).map((c) => ({
                slug: c.slug,
                corpusRef: c.corpusRef,
                title: c.title,
                shape: c.shapes[0]?.shape.name ?? "",
                resolvability: c.resolvability,
              }))
            )
          : shapeTableTeX(...(await shapeTableInput()));
      return reply.type(utf8(LATEX_TYPE)).send(tex + "\n");
    }
  );

  // Registered on the untyped instance: the body goes out as text, which the typed reply wouldn't accept.
  app.get(
    "/export/json",
    { schema: { summary: "The whole published corpus as one JSON document", response: { 200: corpusExportSchema } } },
    async (_req, reply) => {
      // Sent as text so the bytes match the committed corpus/bind-corpus.json byte for byte.
      const body = corpusExportText(await corpusExport());
      return reply
        .type(utf8(JSON_TYPE))
        .header("content-disposition", `attachment; filename="${CORPUS_JSON_FILENAME}"`)
        .header("cache-control", EXPORT_CACHE_CONTROL)
        .send(body);
    }
  );

  api.get("/openapi.json", { schema: { summary: "This document", response: { 200: openApiDocumentSchema } } }, async () => ({ ...app.swagger() }));

  return app;
}
