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
  gdpr48: {
    status: "verified",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679",
    publisher: "EUR-Lex",
    quote: "Any judgment of a court or tribunal and any decision of an administrative authority of a third country requiring a controller or processor to transfer or disclose personal data may only be recognised or enforceable in any manner if based on an international agreement, such as a mutual legal assistance treaty, in force between the requesting third country and the Union or a Member State, without prejudice to other grounds for transfer pursuant to this Chapter.",
    note: "Art. 48 read in full from EUR-Lex. It denies the foreign order force as a transfer ground. Other Chapter V grounds remain.",
    verifiedBy: by,
    verifiedAt: "2026-10-31",
  },
  eprivacy15: {
    status: "verified",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32002L0058",
    publisher: "EUR-Lex",
    quote: "Member States may adopt legislative measures to restrict the scope of the rights and obligations provided for in Article 5, Article 6, Article 8(1), (2), (3) and (4), and Article 9 of this Directive when such restriction constitutes a necessary, appropriate and proportionate measure within a democratic society ... To this end, Member States may, inter alia, adopt legislative measures providing for the retention of data for a limited period justified on the grounds laid down in this paragraph.",
    note: "Art. 15(1) read in full from EUR-Lex. The CJEU reads it with Charter Arts. 7, 8, 11 and 52(1) to preclude general and indiscriminate retention (C-511/18, operative part 1).",
    verifiedBy: by,
    verifiedAt: "2026-10-31",
  },
  eidas: {
    status: "corrected",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1183",
    publisher: "EUR-Lex",
    provision: "Art. 45(1a), Art. 45a",
    quote:
      "Qualified certificates for website authentication issued in accordance with paragraph 1 of this Article shall be recognised by providers of web-browsers. [Recital 65:] The obligation of recognition ... does not affect the freedom of providers of web-browsers to ensure web security, domain authentication and the encryption of web traffic in a manner and by means of technology that they consider to be the most appropriate.",
    note: "Regulation (EU) 2024/1183 amends Art. 45 and inserts Art. 45a. The adopted text requires recognition and display of QWAC identity data. Recital 65 keeps browser control over TLS trust, and Art. 45a(2) lets browsers take precautionary measures against a certificate, subject to notification and supervisory review. The v0.1 claim that browsers must trust member-state CAs described the draft. B2 now states the adopted text and records the legislative resolution.",
    verifiedBy: by,
    verifiedAt: "2026-10-31",
  },
};

export const sourceVerifications: Record<string, Verification> = {
  ...Object.assign({}, ...batches.map((b) => b.sources)),
  "EDPB position on crypto-shredding": {
    status: "corrected",
    url: "https://www.edpb.europa.eu/system/files/2026-07/edpb_guidelines_202502_blockchain_v2_en.pdf",
    publisher: "EDPB",
    quote:
      "The EDPB recalls that encrypted personal data is still personal data and encryption does not remove the need for GDPR compliance. Further, even state-of-the-art encryption perfectly implemented will be overtaken by time if the blockchain is retained indefinitely.",
    provision: "Guidelines 02/2025 v2.0 (adopted 7 July 2026), section 4.2, para 51",
    note: "The EDPB has addressed it, so the source's 'no EDPB position' is wrong. The final text keeps the April 2025 wording unchanged; it sits in section 4.2, para 51, not 5.2. Section 4.2 also says 'technical impossibility cannot be invoked to justify non-compliance with GDPR requirements'. Key destruction isn't endorsed as erasure. This strengthens A1.",
    verifiedBy: by,
    verifiedAt: "2026-11-01",
  },
  "HL Deb 6 Sept 2023, col 458 (Lord Parkinson of Whitley Bay)": {
    status: "corrected",
    url: "https://hansard.parliament.uk/Lords/2023-09-06/debates/4AC6A32E-0C53-46C7-A714-AD4165C484D7/OnlineSafetyBill",
    publisher: "Hansard (UK Parliament)",
    quote: "A notice can be issued only where technically feasible and where technology has been accredited as meeting minimum standards of accuracy in detecting only child sexual abuse and exploitation content.",
    provision: "Online Safety Bill, Lords Third Reading, col 458",
    note: "The phrase is real and is the minister's (Clause 122 at the time, s.121 as enacted). It's a Government assurance, not statute text: Lord Moylan replied in the same debate that the feasibility limit 'does not appear in the text of the clause'. D2's 'a legislature admitting the incompatibility' overstates it. Read via the Hansard API.",
    verifiedBy: by,
    verifiedAt: "2026-11-01",
  },
  "Karcher v. Daggett, 462 U.S. 725 (1983)": {
    status: "verified",
    url: "https://tile.loc.gov/storage-services/service/ll/usrep/usrep462/usrep462725/usrep462725.pdf",
    publisher: "Library of Congress (United States Reports)",
    quote: "We thus reaffirm that there are no de minimis population variations, which could practicably be avoided, but which nonetheless meet the standard of Art. I, §2, without justification.",
    provision: "462 U.S. at 734; at 738 on census data",
    note: "Congressional districts only; state legislative maps follow the looser Reynolds v. Sims standard. At 738 the Court treats the census count as the 'best population data available' and 'the only basis for good-faith attempts to achieve population equality', and rejects undercount error as an excuse. Tension for G4: equality is measured against the published count, error and all, so noise injected before publication may not breach Karcher. Alabama v. Commerce challenged the accuracy of DP data but wasn't decided on the merits. Needs a reviewer's read.",
    verifiedBy: by,
    verifiedAt: "2026-11-01",
  },
  "CJEU C-203/22 Dun & Bradstreet Austria, 27 Feb 2025": {
    status: "verified",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62022CJ0203",
    publisher: "Court of Justice of the European Union (EUR-Lex)",
    quote: "the data subject may require the controller, as ‘meaningful information about the logic involved’, to explain, by means of relevant information and in a concise, transparent, intelligible and easily accessible form, the procedure and principles actually applied in order to use, by automated means, the personal data concerning that person with a view to obtaining a specific result",
    provision: "Operative part, point 1; paras 59-60; point 2 on trade secrets",
    note: "Para 59: neither 'a complex mathematical formula, such as an algorithm' nor 'the detailed description of all the steps in automated decision-making' satisfies Art. 15(1)(h). Para 60: 'not necessarily ... disclosure of the full algorithm'. Point 2: trade-secret claims go to the supervisory authority or court for balancing. Tension for G3: the Court doesn't ask for the weights, so 'the procedure applied is weights' needs a reviewer's read.",
    verifiedBy: by,
    verifiedAt: "2026-11-01",
  },
};
