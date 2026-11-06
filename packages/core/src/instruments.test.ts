import { describe, expect, it } from "vitest";
import { instrumentHref, instrumentSlug, provisionAnchor, slugify } from "./instruments";

describe("instrumentSlug", () => {
  it.each([
    ["GDPR", "gdpr"],
    ["CLOUD Act", "cloud-act"],
    ["eIDAS 2.0", "eidas-2-0"],
    ["PIPL/CSL", "pipl-csl"],
    ["242-FZ", "242-fz"],
    ["Alabama v. Commerce", "alabama-v-commerce"],
    ["A11y/Interop", "a11y-interop"],
    ["  SOC 2  ", "soc-2"],
  ])("%s → %s", (shortName, slug) => expect(instrumentSlug(shortName)).toBe(slug));

  it("never starts or ends with a hyphen", () => {
    for (const s of ["§ 2518(4)", "(draft)", "-x-"]) expect(slugify(s)).toMatch(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/);
  });
});

describe("provisionAnchor", () => {
  it.each([
    ["Art. 17", "art-17"],
    ["Art. 17(1)", "art-17-1"],
    ["Art. 5(1)(c)", "art-5-1-c"],
    ["Art. 33/34", "art-33-34"],
    ["§ 2518(4)", "2518-4"],
    ["s.121(2)(a)(iii)", "s-121-2-a-iii"],
  ])("%s → #%s", (provision, anchor) => expect(provisionAnchor(provision)).toBe(anchor));
});

describe("instrumentHref", () => {
  it("joins the instrument slug and the provision anchor", () => {
    expect(instrumentHref({ shortName: "GDPR", provision: "Art. 17" })).toBe("/instruments/gdpr#art-17");
  });
});
