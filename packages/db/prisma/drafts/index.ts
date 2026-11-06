/**
 * Model-drafted cases (claude-opus-5-5, 2026-10-31). They publish under the corpus-wide owner
 * sign-off in signoff.ts, which records that no case-by-case human check was done.
 * Drafts that failed the inclusion test become rejections, not cases.
 */
import type { SeedCase } from "../corpus";
import type { Verification } from "../verifications";
import * as a from "./drafts-a";
import * as b from "./drafts-b";

export const draftInstruments = { ...a.draftInstruments, ...b.draftInstruments };
export const draftVerifications = { ...a.draftVerifications, ...b.draftVerifications };

const all: SeedCase[] = [...a.draftCases, ...b.draftCases];
export const draftCases = all.filter((c) => c.inclusionVerdict !== "fails");

/** Failed leads. Reason per the drafting agent's finding. */
const reasonFor: Record<string, "merely_expensive" | "resolved_by_known_technique"> = { N10: "merely_expensive" };
export const draftRejections = all
  .filter((c) => c.inclusionVerdict === "fails")
  .map((c) => ({
    slug: `reject-${c.ref.toLowerCase()}`,
    title: c.title,
    claim: c.statement,
    reason: reasonFor[c.ref] ?? ("resolved_by_known_technique" as const),
    reasoning: c.inclusionReasoning ?? "",
  }));

/**
 * Verifications for draft `sources` labels, keyed by exact label. Most reuse the instrument
 * check for the same text; the rest were read from the primary source on 2026-11-01.
 * "WhatsApp v Union of India, Delhi HC, 2021" is left out on purpose (rechecked 2026-11-03): the petition has no
 * judgment and the court record wasn't reachable, so it seeds as unverified.
 */
const v = (k: string): Verification => {
  const x = draftVerifications[k];
  if (!x) throw new Error(`missing draft verification ${k}`);
  return x;
};
const BY = "claude-opus-5-5";
const AT = "2026-11-01";
const eurlex = (celex: string) => `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`;
const also = (base: Verification, note: string): Verification => ({ ...base, note: `${base.note} ${note}`, verifiedAt: AT });

export const draftSourceVerifications: Record<string, Verification> = {
  "45 CFR 171.206 (Protecting Care Access exception)": {
    status: "verified",
    url: "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-D/part-171/subpart-B/section-171.206",
    publisher: "eCFR (Office of the Federal Register)",
    quote: "An actor's practice that is implemented to reduce potential exposure to legal action will not be considered information blocking when the practice satisfies the condition in paragraph (a)",
    provision: "§ 171.206, introductory text",
    note: "Read via the eCFR versioner API. One version on record, effective 2024-12-17; still in force on 2026-11-01.",
    verifiedBy: BY, verifiedAt: AT,
  },
  "IPA 2016 ss. 253, 257 as amended 2024": also(
    v("nb_ipa253"),
    "s. 257(3A): \"the person must not make any relevant changes to telecommunications or postal services, or telecommunication systems, to which obligations imposed by the notice given under section 252 or 253 relate\". Inserted by the Investigatory Powers (Amendment) Act 2024, commenced by S.I. 2025/722. Read from legislation.gov.uk XML.",
  ),
  "Apple support article 122234": {
    status: "verified",
    url: "https://support.apple.com/en-us/122234",
    publisher: "Apple",
    quote: "Apple can no longer offer Advanced Data Protection in the United Kingdom to new users",
    note: "Vendor statement only. It doesn't name a technical capability notice; the TCN link is press-reported.",
    verifiedBy: BY, verifiedAt: AT,
  },
  "IT Rules 2021, rule 4(2), MeitY consolidated text to 06.04.2023": { ...v("nb_inItRules42"), verifiedAt: AT },
  "Commission Decision C(2025) 3000 final, DMA.100203": also(v("nb_dmaSpec100203"), "Para 107 re-read from the Commission PDF on 2026-11-01."),
  "DMA Art. 6(7)": { ...v("nb_dma67"), verifiedAt: AT },
  "DSA Art. 24(2), recital 77": { ...v("nb_dsa24"), verifiedAt: AT },
  "DMA Art. 6(8), 8(1), recital 58": also(
    v("nb_dma68"),
    "Art. 8(1): \"The gatekeeper shall ensure that the implementation of those measures complies with applicable law, in particular Regulation (EU) 2016/679\". Recital 58: access to \"the data, including aggregated and non-aggregated data, necessary for advertisers ... to carry out their own independent verification of the provision of the relevant online advertising services.\"",
  ),
  "GDPR recital 47": {
    status: "verified",
    url: eurlex("32016R0679"),
    publisher: "EUR-Lex",
    quote: "The processing of personal data strictly necessary for the purposes of preventing fraud also constitutes a legitimate interest of the data controller concerned.",
    provision: "Recital 47",
    note: "The recital frames legitimate interest as subject to the Art. 6(1)(f) balancing test; it isn't a standalone basis.",
    verifiedBy: BY, verifiedAt: AT,
  },
  "DSA Art. 26(3)": { ...v("nb_dsa263"), verifiedAt: AT },
  "CJEU C-252/21, C-184/20": also(
    v("nb_cjeuMetaBka"),
    "C-184/20, operative part point 2: data \"liable to disclose indirectly the sexual orientation of a natural person constitutes processing of special categories of personal data\". Both re-read on EUR-Lex 2026-11-01.",
  ),
  "149-FZ Art. 10.1, consolidated text via КонсультантПлюс": also(
    v("nb_ru1014_1"),
    "Part 4.2(4) (241-FZ of 2017, amended by 41-FZ of 01.04.2025) also requires the organizer to \"обеспечивать конфиденциальность передаваемых электронных сообщений\" (ensure confidentiality of transmitted messages).",
  ),
  "CERT-In Directions No. 20(3)/2022-CERT-In, 28 April 2022": v("nb_certin2022v"),
  "CERT-In FAQs on Cyber Security Directions, May 2022": v("nb_certinFaq"),
  "DSA Art. 28(1), (3)": v("nb_dsa28"),
  "Commission Guidelines C(2025) 6826 final, paras 41, 46": v("nb_dsa28Guidelines"),
};
