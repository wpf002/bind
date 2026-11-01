/**
 * Citation verification ledger (Phase 2). Each entry records that someone opened the
 * primary source and checked the provision against the case's claim. The seed applies it.
 *
 * `instruments` is keyed by instrument key in corpus.ts and covers every case that cites it.
 * `sources` is keyed by the citation label of a case-level source.
 *
 * verifiedBy "claude-opus-5-5" means a model read the source. A human reviewer should
 * countersign before publication; the roadmap's gate is about opened sources, not who opened them.
 */
export type Verification = {
  status: "verified" | "corrected" | "disputed";
  url: string;
  publisher: string;
  quote: string;
  /** Replaces the provision string when the source's provision was wrong or vague. */
  provision?: string;
  note: string;
  verifiedBy: string;
  verifiedAt: string;
};

import { readFileSync } from "node:fs";
import { join } from "node:path";

const by = "claude-opus-5-5";

/** Batch checks written by research agents (2026-10-31). Each note says what wasn't opened. */
type Batch = { instruments: Record<string, Verification>; sources: Record<string, Verification> };
const batch = (f: string): Batch => JSON.parse(readFileSync(join(import.meta.dirname, "ledger", f), "utf8"));
const batches = ["verify-a.json", "verify-b.json"].map(batch);

export const instrumentVerifications: Record<string, Verification> = {
  ...Object.assign({}, ...batches.map((b) => b.instruments)),
  euR2r: {
    status: "verified",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024L1799",
    publisher: "EUR-Lex",
    provision: "Art. 5(6)",
    quote:
      "Manufacturers shall not use any contractual clauses, hardware or software techniques that impede the repair of goods covered by Union legal acts listed in Annex II unless justified by legitimate and objective factors including the protection of intellectual property rights under Union and national law.",
    note: "Directive number is correct. The anti-pairing rule is Art. 5(6). It carries an exception for 'legitimate and objective factors'. Whether security attestation qualifies is the open question, and it decides E1's inclusion verdict. Scope is limited to goods in Annex II.",
    verifiedBy: by,
    verifiedAt: "2026-10-31",
  },
  aiAct105: {
    status: "verified",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
    publisher: "EUR-Lex",
    quote:
      "To the extent that it is strictly necessary for the purpose of ensuring bias detection and correction in relation to the high-risk AI systems ... the providers of such systems may exceptionally process special categories of personal data, subject to appropriate safeguards ...",
    note: "Provision is correct (Regulation (EU) 2024/1689, Art. 10(5)). Conditions (a) to (f) apply 'in addition to' the GDPR, so the carve-out narrows the conflict with Art. 9 without removing it.",
    verifiedBy: by,
    verifiedAt: "2026-10-31",
  },
  osa121: {
    status: "verified",
    url: "https://www.legislation.gov.uk/ukpga/2023/50/section/121",
    publisher: "legislation.gov.uk",
    provision: "s.121(2)(a)(iii)",
    quote: "use accredited technology to identify CSEA content, whether communicated publicly or privately by means of the service, and to swiftly take down that content",
    note: "Section number is correct. 'When technically feasible' is not in the statute. It comes from a ministerial statement, which needs its own Hansard citation before D2's 'deferred in practice' claim can stand. s.122 requires a skilled person's report before a notice.",
    verifiedBy: by,
    verifiedAt: "2026-10-31",
  },
  eidas: {
    status: "disputed",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1183",
    publisher: "EUR-Lex",
    provision: "Art. 45(1a), Art. 45a",
    quote:
      "Qualified certificates for website authentication issued in accordance with paragraph 1 of this Article shall be recognised by providers of web-browsers. [Recital 65:] The obligation of recognition ... does not affect the freedom of providers of web-browsers to ensure web security, domain authentication and the encryption of web traffic in a manner and by means of technology that they consider to be the most appropriate.",
    note: "Regulation (EU) 2024/1183 amends Art. 45 and inserts Art. 45a. The adopted text requires recognition and display of QWAC identity data. Recital 65 keeps browser control over TLS trust, and Art. 45a(2) lets browsers take precautionary measures against a certificate, subject to notification and supervisory review. The case's claim that browsers must trust member-state CAs describes the draft, not the adopted text. B2 needs a rewrite or a move to a resolved-legislatively transition.",
    verifiedBy: by,
    verifiedAt: "2026-10-31",
  },
};

export const sourceVerifications: Record<string, Verification> = {
  ...Object.assign({}, ...batches.map((b) => b.sources)),
  "EDPB position on crypto-shredding": {
    status: "corrected",
    url: "https://www.edpb.europa.eu/documents/guideline/guidelines-022025-on-processing-of-personal-data-through-blockchain_en",
    publisher: "EDPB",
    quote:
      "The EDPB recalls that encrypted personal data is still personal data and encryption does not remove the need for GDPR compliance. Further, even state-of-the-art encryption perfectly implemented will be overtaken by time if the blockchain is retained indefinitely.",
    note: "The EDPB has now addressed it: Guidelines 02/2025 on blockchain (consultation version April 2025, section 5.2). It does not endorse key destruction as erasure and says technical impossibility can't justify non-compliance. This strengthens A1. Read from the April 2025 version; the final version adopted in 2026 needs a check for changes to section 5.2.",
    verifiedBy: by,
    verifiedAt: "2026-10-31",
  },
};
