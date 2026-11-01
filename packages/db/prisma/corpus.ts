/**
 * Seed corpus imported from PARADOX-CORPUS.md (v0.1). Field text is the source's
 * own wording. Where the source is silent, the field is empty rather than filled.
 *
 * VERIFICATION: the source states its legal citations are "from working memory and
 * need verification". Every citation therefore seeds as `unverified`, and the gate
 * holds every case as a draft until someone opens each primary source. The source's
 * ⚠ marks are carried as notes on the affected citations.
 *
 * COUNT: the source header says 23 cases; it lists 24 IDs (A1–A4, B1–B2, C1, D1–D3,
 * E1–E4, F1–F2, G1–G5, H1–H3). H1–H3 appear in no shape in the source taxonomy and
 * are seeded unassigned.
 */

export type SeedCase = {
  ref: string;
  title: string;
  statement: string;
  analysis?: string;
  /** Findings from citation review. Not in the source text, so the round-trip ignores it. */
  review?: string;
  /** Primary first. Taken from the source taxonomy table. */
  shapes: string[];
  /** Why the current shapes were chosen, when someone other than the source author chose them. */
  shapeRationale?: string;
  /** Superseded assignments, kept so case history survives taxonomy changes. */
  shapeHistory?: { shape: string; from: string; until: string; rationale: string }[];
  resolvability: "unresolvable" | "resolvable_costly" | "tech_gap";
  resolution?: "legislative" | "judicial" | "engineering" | "abandonment";
  resolvedBy?: string;
  inclusionVerdict: "passes" | "fails" | "undecided";
  inclusionReasoning?: string;
  instruments: { key: string; role: "mandating" | "conflicting" | "context"; note?: string }[];
  property?: { name: string; text: string; defeat?: string };
  paperingOvers?: {
    technique: string;
    description: string;
    standing: "untested" | "endorsed_by_regulator" | "rejected_by_regulator" | "litigated_unresolved" | "academic_only";
    residual: string;
  }[];
  /** Extra sources named in the prose that are not instruments. */
  sources?: { label: string; note?: string }[];
  /** Declared departures from the v0.1 source text. The round-trip accepts a source sentence found in `from`. */
  amendments?: { field: "title" | "statement" | "analysis" | "inclusionReasoning" | "paperingOver"; from: string; reason: string }[];
  /** Resolution-state changes, oldest first. */
  transitions?: { from: string; to: string; trigger: string; url?: string; at: string }[];
  /** ⚠ in the source. Instrument key, or "case" when the mark is on a prose claim. */
  flags?: Record<string, string>;
};

export const jurisdictions = [
  { code: "EU", name: "European Union", level: "supranational" },
  { code: "US", name: "United States", level: "national" },
  { code: "UK", name: "United Kingdom", level: "national" },
  { code: "CN", name: "China", level: "national" },
  { code: "RU", name: "Russia", level: "national" },
  { code: "IN", name: "India", level: "national" },
  { code: "INT", name: "International", level: "supranational" },
];

export const shapes = [
  {
    slug: "mandate-mutation",
    ordinal: 1,
    name: "Mandate–Mutation",
    family: "architectural" as const,
    definition: "Law requires a state change the security property forbids.",
    boundaryCriteria: "Truly unresolvable for A3, A4. Owner: Architect.",
    provenanceNote: "Well-covered in the blockchain/GDPR literature.",
  },
  {
    slug: "sovereign-contradiction",
    ordinal: 2,
    name: "Sovereign Contradiction",
    family: "conflict_of_law" as const,
    definition: "Two authorities, opposite commands, one artifact.",
    boundaryCriteria: "Truly unresolvable. Owner: nobody. Unowned.",
    provenanceNote:
      "Shape 2 has no architectural content at all. It's a pure conflict of laws that engineers get handed because they hold the data.",
  },
  {
    slug: "locality-emergent-placement",
    ordinal: 3,
    name: "Locality vs. Emergent Placement",
    family: "architectural" as const,
    definition: "Law presumes location; system computes it at runtime.",
    boundaryCriteria: "Not truly unresolvable, but costly. Owner: Architect.",
    provenanceNote: "Its only case (C1) fails the strict inclusion test and sits in the corpus as a boundary case.",
    retiredAt: new Date("2026-10-31"),
    retiredNote: "Retired in taxonomy v2. Every case of this shape is resolvable by pinning data in-country, so none can pass the inclusion test. C1 stays as a boundary case with no shape.",
  },
  {
    slug: "deliberate-blindness",
    ordinal: 4,
    name: "Deliberate Blindness",
    family: "architectural" as const,
    definition: "Law requires knowledge the architecture exists to prevent.",
    boundaryCriteria: "Truly unresolvable. Owner: Architect.",
    provenanceNote:
      "Has no literature under a single name, and it's the shape that recurs hardest as E2EE and confidential computing spread. That's where a paper goes.",
  },
  {
    slug: "trust-root-plurality",
    ordinal: 5,
    name: "Trust-Root Monopoly vs. Plurality",
    family: "architectural" as const,
    definition: "Security from one root; law mandates many.",
    boundaryCriteria: "Unresolvable, pending plural attestation. Owner: Architect.",
    provenanceNote: "Live in antitrust and platform-regulation work.",
  },
  {
    slug: "verification-minimization",
    ordinal: 6,
    name: "Verification vs. Minimization",
    family: "research_gap" as const,
    definition: "Proving an attribute requires collecting more than the attribute.",
    boundaryCriteria: "Not unresolvable. Tech gap. Owner: Researcher.",
    provenanceNote: "Shape 6 is a research gap that will close.",
  },
  {
    slug: "binary-continuum",
    ordinal: 7,
    name: "Binary vs. Continuum",
    family: "drafting_error" as const,
    definition: "Legal category is a threshold on a shifting continuous property.",
    boundaryCriteria: "Unresolvable, but by category error. Owner: Legislator.",
    provenanceNote: "Shape 7 is a drafting error: the statute quantizes something continuous.",
  },
];

type Inst = { regime: string; instrument: string; shortName: string; provision: string; mandate: string; jurisdiction: string };

/** No source URLs: PARADOX-CORPUS.md cites none. Verification adds them. */
export const instruments: Record<string, Inst> = {
  gdpr17: { regime: "EU data protection", instrument: "General Data Protection Regulation", shortName: "GDPR", provision: "Art. 17", mandate: "Data subject may demand erasure of personal data.", jurisdiction: "EU" },
  gdpr16: { regime: "EU data protection", instrument: "General Data Protection Regulation", shortName: "GDPR", provision: "Art. 16", mandate: "Rectification of personal data.", jurisdiction: "EU" },
  gdpr15: { regime: "EU data protection", instrument: "General Data Protection Regulation", shortName: "GDPR", provision: "Art. 15", mandate: "The law asks for the logic.", jurisdiction: "EU" },
  gdpr22: { regime: "EU data protection", instrument: "General Data Protection Regulation", shortName: "GDPR", provision: "Art. 22", mandate: "The law asks for the logic.", jurisdiction: "EU" },
  gdpr33: { regime: "EU data protection", instrument: "General Data Protection Regulation", shortName: "GDPR", provision: "Art. 33/34", mandate: "Notify the supervisory authority within 72 hours, describing the categories and approximate number of records affected.", jurisdiction: "EU" },
  gdpr5c: { regime: "EU data protection", instrument: "General Data Protection Regulation", shortName: "GDPR", provision: "Art. 5(1)(c)", mandate: "Minimization forbids collecting more than necessary for the purpose.", jurisdiction: "EU" },
  gdpr48: { regime: "EU data protection", instrument: "General Data Protection Regulation", shortName: "GDPR", provision: "Art. 48", mandate: "A third-country order to disclose personal data is enforceable only if based on an international agreement.", jurisdiction: "EU" },
  gdpr9: { regime: "EU data protection", instrument: "General Data Protection Regulation", shortName: "GDPR", provision: "Art. 9", mandate: "Prohibits processing special-category data.", jurisdiction: "EU" },
  gdprAnon: { regime: "EU data protection", instrument: "General Data Protection Regulation", shortName: "GDPR", provision: "Anonymous data", mandate: "GDPR treats anonymized data as out of scope.", jurisdiction: "EU" },
  ccpa: { regime: "US state privacy", instrument: "California Consumer Privacy Act", shortName: "CCPA", provision: "Deletion", mandate: "Deletion right.", jurisdiction: "US" },
  sec17a4: { regime: "US broker-dealer recordkeeping", instrument: "SEC Rule 17a-4", shortName: "SEC", provision: "17a-4", mandate: "WORM retention for broker-dealer records.", jurisdiction: "US" },
  frcp37e: { regime: "US civil procedure", instrument: "Federal Rules of Civil Procedure", shortName: "FRCP", provision: "37(e)", mandate: "Litigation hold.", jurisdiction: "US" },
  ftc: { regime: "US consumer protection", instrument: "FTC deletion orders", shortName: "FTC", provision: "Deletion orders", mandate: "Algorithmic disgorgement (Everalbum, Kurbo/WW) orders destruction of the model, not the data.", jurisdiction: "US" },
  schrems2: { regime: "EU data protection", instrument: "Schrems II", shortName: "Schrems II", provision: "Transfer restrictions", mandate: "EU law forbids the transfer.", jurisdiction: "EU" },
  cloudact: { regime: "US lawful access", instrument: "CLOUD Act", shortName: "CLOUD Act", provision: "Production orders", mandate: "US law compels production.", jurisdiction: "US" },
  eidas: { regime: "EU digital identity", instrument: "eIDAS 2.0", shortName: "eIDAS 2.0", provision: "QWAC recognition", mandate: "Browsers must recognise QWACs and display their identity data.", jurisdiction: "EU" },
  ru242: { regime: "Data localization", instrument: "Federal Law 242-FZ", shortName: "242-FZ", provision: "Localization", mandate: "Presupposes data has a determinate location.", jurisdiction: "RU" },
  cnPipl: { regime: "Data localization", instrument: "PIPL / CSL", shortName: "PIPL/CSL", provision: "Localization", mandate: "Presupposes data has a determinate location.", jurisdiction: "CN" },
  inRbi: { regime: "Data localization", instrument: "RBI payments data mandate", shortName: "RBI", provision: "Payments localization", mandate: "Presupposes data has a determinate location.", jurisdiction: "IN" },
  osa121: { regime: "UK online safety", instrument: "Online Safety Act", shortName: "UK OSA", provision: "s.121", mandate: "Scanning notices: the law requires detection capability that the architecture exists to preclude.", jurisdiction: "UK" },
  publicHealth: { regime: "Public health", instrument: "Public health authorities", shortName: "Public Health", provision: "Linkage data", mandate: "Public health authorities needed linkage data to do actual epidemiology.", jurisdiction: "INT" },
  euR2r: { regime: "Right to repair", instrument: "Directive (EU) 2024/1799", shortName: "EU R2R", provision: "Directive 2024/1799", mandate: "Repair requires installing unattested parts.", jurisdiction: "EU" },
  usR2r: { regime: "Right to repair", instrument: "US state right-to-repair statutes", shortName: "US States", provision: "Right to repair", mandate: "Repair requires installing unattested parts.", jurisdiction: "US" },
  dma64: { regime: "EU platform regulation", instrument: "Digital Markets Act", shortName: "DMA", provision: "Art. 6(4)", mandate: "Sideloading.", jurisdiction: "EU" },
  dma7: { regime: "EU platform regulation", instrument: "Digital Markets Act", shortName: "DMA", provision: "Art. 7", mandate: "Messaging interoperability.", jurisdiction: "EU" },
  a11yInterop: { regime: "Accessibility", instrument: "Accessibility and interoperability obligations", shortName: "A11y/Interop", provision: "Unspecified", mandate: "Assistive tooling and interoperable clients are modified clients.", jurisdiction: "INT" },
  ageVerif: { regime: "Online safety", instrument: "Age verification mandates", shortName: "Age Verification", provision: "Unspecified", mandate: "Verifying age requires collecting identity evidence.", jurisdiction: "INT" },
  fatf: { regime: "AML", instrument: "FATF Travel Rule", shortName: "FATF", provision: "Travel Rule", mandate: "Originator/beneficiary information must accompany the transfer.", jurisdiction: "INT" },
  schufa: { regime: "EU case law", instrument: "SCHUFA (C-634/21)", shortName: "CJEU", provision: "C-634/21", mandate: "SCHUFA.", jurisdiction: "EU" },
  nowak: { regime: "EU case law", instrument: "Nowak", shortName: "CJEU", provision: "Nowak", mandate: "Nowak.", jurisdiction: "EU" },
  tradeSecret: { regime: "Trade secret", instrument: "Trade secret protection", shortName: "Trade Secret", provision: "Unspecified", mandate: "Model opacity plus trade secret.", jurisdiction: "INT" },
  title13: { regime: "US census", instrument: "Title 13", shortName: "Title 13", provision: "Confidentiality", mandate: "Title 13 confidentiality.", jurisdiction: "US" },
  pl94171: { regime: "US census", instrument: "PL 94-171", shortName: "PL 94-171", provision: "Redistricting data", mandate: "Redistricting accuracy.", jurisdiction: "US" },
  alabama: { regime: "US case law", instrument: "Alabama v. Commerce", shortName: "Alabama v. Commerce", provision: "Litigation", mandate: "Litigated.", jurisdiction: "US" },
  aiAct105: { regime: "EU AI regulation", instrument: "AI Act", shortName: "AI Act", provision: "Art. 10(5)", mandate: "Testing for bias against protected classes.", jurisdiction: "EU" },
  euRetention: { regime: "EU telecom retention", instrument: "Member-state data retention regimes", shortName: "EU Retention", provision: "Retention mandates", mandate: "Member states keep re-legislating retention regimes.", jurisdiction: "EU" },
  eprivacy15: { regime: "EU telecom privacy", instrument: "Directive 2002/58/EC (ePrivacy)", shortName: "ePrivacy", provision: "Art. 15(1)", mandate: "Retention must be a necessary, appropriate and proportionate measure, in accordance with general principles of EU law.", jurisdiction: "EU" },
  cjeuRetention: { regime: "EU case law", instrument: "Digital Rights Ireland, Tele2, La Quadrature", shortName: "CJEU", provision: "Retention rulings", mandate: "The CJEU keeps striking retention regimes.", jurisdiction: "EU" },
  pci10: { regime: "Payment security", instrument: "PCI DSS", shortName: "PCI DSS", provision: "10.x", mandate: "Logging of IPs and access records.", jurisdiction: "INT" },
  soc2: { regime: "Audit", instrument: "SOC 2", shortName: "SOC 2", provision: "Logging", mandate: "Logging of IPs and access records.", jurisdiction: "US" },
};

const prop = (name: string, text: string, defeat?: string) => ({ name, text, defeat });

export const cases: SeedCase[] = [
  {
    ref: "A1",
    review: "EDPB Guidelines 02/2025 (draft) say encrypted data stays personal data, so key destruction isn't erasure. Strengthens the case. Final text not yet checked. Review by claude-opus-5-5, 2026-10-31, pending human countersign.",
    title: "GDPR Art. 17 erasure vs. append-only ledgers",
    statement: "Erasure requires the operation the threat model forbids.",
    shapes: ["mandate-mutation"],
    resolvability: "resolvable_costly",
    inclusionVerdict: "passes",
    inclusionReasoning: "Partially, but only by moving personal data out of the architecture, i.e. by not using the property you adopted the ledger for.",
    instruments: [{ key: "gdpr17", role: "mandating" }],
    property: prop("Ledger Immutability", "Immutability is the security property of a distributed ledger. Mutation is the attack it's designed to prevent."),
    paperingOvers: [
      { technique: "Off-chain storage", description: "Off-chain storage with on-chain hash pointers.", standing: "untested", residual: "" },
      { technique: "Crypto-shredding", description: "Destroy the key, leave the ciphertext. CNIL's 2018 guidance treated key destruction as a possible route.", standing: "untested", residual: "I don't believe the EDPB has ever endorsed it, which leaves it legally untested." },
    ],
    sources: [{ label: "CNIL 2018 guidance on key destruction" }, { label: "EDPB position on crypto-shredding", note: "⚠ in source: no EDPB endorsement is believed to exist. Confirm." }],
  },
  {
    ref: "A2",
    title: "Erasure/deletion rights vs. mandatory retention",
    statement: "GDPR Art. 17(3)(b) exempts retention only where Union or Member State law requires it. A broker-dealer under both the GDPR and SEC Rule 17a-4 must keep records that a US rule requires, so an erasure request and the retention duty command opposite state changes on the same records. The architecture didn't cause this and can't fix it.",
    shapes: ["mandate-mutation", "sovereign-contradiction"],
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    inclusionReasoning: "No. Neither regime's exemption reaches the other's rule, and storage design can't satisfy both. Not an engineering problem.",
    instruments: [
      { key: "gdpr17", role: "mandating", note: "Art. 17(3)(b) exempts only Union or Member State legal obligations." },
      { key: "sec17a4", role: "conflicting", note: "Retention on WORM or an audit-trail system that can re-create deleted records. Either forbids erasure within the period." },
      { key: "ccpa", role: "context", note: "§ 1798.105(d)(8) exempts records kept for a legal obligation, so the CCPA yields to 17a-4." },
      { key: "frcp37e", role: "context", note: "Litigation hold. GDPR Art. 17(3)(e) exempts data needed for legal claims." },
    ],
    property: prop("WORM Media", "WORM media and immutable backup snapshots are physically/cryptographically non-erasable by design."),
    paperingOvers: [
      { technique: "Deletion debt", description: "Scope backups out of deletion; delete on restore (\"deletion debt\").", standing: "untested", residual: "" },
      { technique: "Put beyond use", description: "ICO's \"put beyond use\" position.", standing: "endorsed_by_regulator", residual: "" },
    ],
    amendments: [
      { field: "statement", from: "Two legal regimes command opposite state changes on the same bytes.", reason: "GDPR Art. 17(3)(b) and CCPA § 1798.105(d)(8) exempt data kept for a legal obligation, so the conflict holds only where the retention rule is foreign to the deleting regime. Narrowed to GDPR vs. 17a-4." },
      { field: "inclusionReasoning", from: "No. Not an engineering problem.", reason: "States why the exemptions don't close the gap." },
    ],
  },
  {
    ref: "A3",
    title: "Erasure vs. transparency logs",
    statement: "A mis-issued certificate with personal data in the SAN field is permanently public, by design, and the design is the point.",
    shapes: ["mandate-mutation"],
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    inclusionReasoning: "No.",
    instruments: [{ key: "gdpr17", role: "mandating" }],
    property: prop("Certificate Transparency", "Certificate Transparency logs are append-only Merkle trees; their entire security value is that entries cannot be removed retroactively."),
    analysis: "Current papering-over: none. The tension is acknowledged and tolerated.",
  },
  {
    ref: "A4",
    title: "Erasure vs. trained model weights",
    statement: "The law wants a proof of absence. The architecture can only offer a probabilistic reduction.",
    shapes: ["mandate-mutation"],
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    inclusionReasoning: "No, absent verifiable unlearning.",
    instruments: [
      { key: "gdpr17", role: "mandating" },
      { key: "ftc", role: "context" },
    ],
    property: prop("Trained Weights", "Memorization means the weights may constitute a copy. Machine unlearning is approximate and, critically, not verifiable by the data subject or regulator."),
    paperingOvers: [
      { technique: "Algorithmic disgorgement", description: "The FTC's algorithmic disgorgement remedy (Everalbum, Kurbo/WW) orders destruction of the data and of any model trained on it.", standing: "endorsed_by_regulator", residual: "That's a regulator conceding the point rather than solving it. The most interesting datum in this section." },
    ],
    amendments: [
      { field: "paperingOver", from: "The FTC's algorithmic disgorgement remedy (Everalbum, Kurbo/WW) orders destruction of the model, not the data.", reason: "Everalbum § III.A-C and WW/Kurbo § D order deletion of the data and of models built from it." },
    ],
  },
  {
    ref: "B1",
    title: "Schrems II transfer restrictions vs. CLOUD Act production orders",
    statement: "A US warrant reaches data in a provider's control wherever it's stored (18 U.S.C. § 2713). GDPR Art. 48 bars that warrant from serving as the transfer ground unless an international agreement backs it, so the provider must find another Chapter V ground or refuse. Same data, same provider.",
    analysis: "Architectural: irrelevant. Encryption doesn't help when the compelled party holds the keys.\n\nThis is a legal conflict that merely surfaces in architecture. Engineers get handed it anyway.\n\n§ 2703(h) allows a comity motion to quash only for a qualifying foreign government with an executive agreement. Whether an EU-US agreement is in force wasn't checked.",
    shapes: ["sovereign-contradiction"],
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    inclusionReasoning: "No. This is a legal conflict that merely surfaces in architecture.",
    instruments: [
      { key: "gdpr48", role: "mandating" },
      { key: "cloudact", role: "mandating" },
      { key: "schrems2", role: "context", note: "Requires essentially equivalent protection for transfers. Doesn't forbid them outright." },
    ],
    amendments: [
      { field: "statement", from: "EU law forbids the transfer; US law compels production; same data, same provider.", reason: "Schrems II doesn't forbid transfers, and the 2023 Data Privacy Framework covers certified US recipients. The blocking rule is GDPR Art. 48." },
    ],
  },
  {
    ref: "B2",
    title: "eIDAS 2.0 QWAC trust-root mandate vs. root program distrust authority",
    statement: "Regulation (EU) 2024/1183 requires browsers to recognise QWACs (Art. 45(1a)) but leaves them free to secure TLS as they choose (Recital 65) and to take precautionary measures against a certificate (Art. 45a(2)). The draft's non-removable trust root wasn't enacted.",
    analysis: "Resolved legislatively between draft and adoption. Art. 45a(2) measures require notification and remain subject to supervisory review, so a contested distrust hasn't been tested.",
    shapes: ["sovereign-contradiction", "trust-root-plurality"],
    resolvability: "unresolvable",
    resolution: "legislative",
    resolvedBy: "Reg. (EU) 2024/1183, Recital 65 and Art. 45a(2)",
    inclusionVerdict: "passes",
    inclusionReasoning: "Not by engineering. Mozilla/Google's public objections were the tell, and the legislature changed the text.",
    instruments: [{ key: "eidas", role: "mandating" }],
    property: prop("Root Program Distrust", "The Web PKI's only real security mechanism is the ability to distrust a misbehaving CA quickly."),
    flags: { eidas: "⚠ in source: least confident on the specific provision." },
    transitions: [
      { from: "unresolvable", to: "resolved_legislative", trigger: "Regulation (EU) 2024/1183 adopted", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1183", at: "2024-04-11" },
    ],
    amendments: [
      { field: "statement", from: "A trust root you cannot remove is not a trust decision.", reason: "Describes the draft. The adopted text keeps browser control over TLS trust." },
      { field: "inclusionReasoning", from: "No. Mozilla/Google's public objections were the tell.", reason: "Records the legislative resolution." },
    ],
  },
  {
    ref: "C1",
    title: "Data localization vs. anycast + global load balancing",
    statement: "The law asks a question the system cannot answer without giving up the property (global failover, latency) it was built for.",
    shapes: [],
    shapeHistory: [{ shape: "locality-emergent-placement", from: "2026-01-12", until: "2026-10-31", rationale: "Shape retired in taxonomy v2." }],
    resolvability: "resolvable_costly",
    inclusionVerdict: "fails",
    inclusionReasoning: "Yes, expensively, by abandoning the architecture. So it fails the strict inclusion test and sits here as a boundary case.",
    instruments: [
      { key: "ru242", role: "mandating" },
      { key: "cnPipl", role: "mandating" },
      { key: "inRbi", role: "mandating" },
    ],
    property: prop("Emergent Placement", "Placement under anycast routing and opportunistic cache fill is an emergent runtime property of BGP and traffic, not a configured fact.", "Global failover, latency."),
    paperingOvers: [
      { technique: "Pinned regions", description: "In-country pinned regions with degraded performance and separate operational stacks.", standing: "untested", residual: "Degraded performance and separate operational stacks." },
    ],
  },
  {
    ref: "D1",
    title: "E2EE vs. Art. 33/34 breach notification",
    statement: "The operator must assess and report a breach of data it was built not to read. Art. 33(3)(a) asks for categories and record counts only where possible, and Art. 34(3)(a) waives data-subject notice where encryption left the data unintelligible, so the law may accept an operator that can't know.",
    shapes: ["deliberate-blindness"],
    resolvability: "unresolvable",
    inclusionVerdict: "undecided",
    inclusionReasoning: "Either the operator can inspect user data or it can't. The conflict survives only if a regulator reads 'where possible' to demand detail the operator could have had under a different architecture. Not tested.",
    instruments: [{ key: "gdpr33", role: "mandating" }],
    property: prop("Zero-Knowledge Operator", "A zero-knowledge operator holds ciphertext and cannot inspect what leaked."),
    amendments: [
      { field: "statement", from: "The law requires the operator to know something the architecture was specifically built to prevent it from knowing.", reason: "Art. 33(3)(a) qualifies the content duty with 'where possible' and Art. 34(3)(a) waives notice for encrypted data." },
      { field: "inclusionReasoning", from: "No.", reason: "Verdict moved to undecided pending a regulator's reading of 'where possible'." },
    ],
  },
  {
    ref: "D2",
    review: "'When technically feasible' isn't in OSA s.121. It's a ministerial statement in Hansard (Lords, 6 Sept 2023). Citation not yet added. Review by claude-opus-5-5, 2026-10-31, pending human countersign.",
    title: "UK Online Safety Act s.121 scanning notices vs. E2EE",
    statement: "Same shape, different direction: the law requires detection capability that the architecture exists to preclude.",
    analysis: "Deferred in practice (\"when technically feasible\"), which is a legislature admitting the incompatibility without repealing the clause.",
    shapes: ["deliberate-blindness"],
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    instruments: [{ key: "osa121", role: "mandating" }],
    property: prop("End-To-End Encryption", "The architecture exists to preclude detection capability."),
    flags: { osa121: "⚠ in source: least confident on the specific provision." },
  },
  {
    ref: "D3",
    review: "No binding mandate found. Commission Recommendation (EU) 2020/518 is non-binding and asks for aggregated data. Fails criterion 'binding mandate'. Review by claude-opus-5-5, 2026-10-31, pending human countersign.",
    title: "Exposure notification: DP-3T/GAEN vs. epidemiological need",
    statement: "The decentralized design deliberately withheld the linkage data public health authorities needed.",
    analysis: "The clearest case where the architecture won and the requirement went unmet. Useful control case.",
    shapes: ["deliberate-blindness"],
    resolvability: "unresolvable",
    inclusionVerdict: "fails",
    instruments: [{ key: "publicHealth", role: "mandating", note: "Legal/institutional." }],
    property: prop("Decentralized Exposure Notification", "The decentralized design deliberately withheld it."),
  },
  {
    ref: "E1",
    review: "Directive 2024/1799 Art. 5(6) exempts techniques 'justified by legitimate and objective factors'. If security attestation qualifies, the directive resolves the conflict. Verdict held pending that reading. Review by claude-opus-5-5, 2026-10-31, pending human countersign.",
    title: "Right to repair vs. parts pairing / attested firmware",
    statement: "Secure boot and component attestation work by rejecting unattested parts. Repair requires installing exactly those.",
    shapes: ["trust-root-plurality"],
    resolvability: "unresolvable",
    inclusionVerdict: "undecided",
    inclusionReasoning: "No, not without a plural attestation model that doesn't currently exist.",
    instruments: [
      { key: "euR2r", role: "mandating" },
      { key: "usR2r", role: "mandating" },
    ],
    property: prop("Component Attestation", "Secure boot and component attestation work by rejecting unattested parts."),
    flags: { euR2r: "⚠ in source: least confident on the specific provision." },
  },
  {
    ref: "E2",
    title: "DMA Art. 6(4) sideloading vs. single-root iOS distribution model",
    statement: "DMA Art. 6(4) sideloading vs. single-root iOS distribution model.",
    shapes: ["trust-root-plurality"],
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    instruments: [{ key: "dma64", role: "mandating" }],
    property: prop("Single-Root Distribution", "Single-root iOS distribution model."),
  },
  {
    ref: "E3",
    title: "DMA Art. 7 messaging interoperability vs. E2EE guarantees",
    statement: "You cannot verify the security properties of a bridged counterparty's implementation. Interop degrades the guarantee to \"as strong as the weakest bridge.\"",
    shapes: ["trust-root-plurality"],
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    instruments: [{ key: "dma7", role: "mandating" }],
    property: prop("E2EE Guarantees", "E2EE guarantees."),
  },
  {
    ref: "E4",
    title: "Client attestation (Play Integrity, WEI) vs. accessibility and interoperability obligations",
    statement: "Attestation excludes modified clients. Assistive tooling and interoperable clients are modified clients.",
    shapes: ["trust-root-plurality"],
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    instruments: [{ key: "a11yInterop", role: "mandating" }],
    property: prop("Client Attestation", "Attestation excludes modified clients."),
  },
  {
    ref: "F1",
    title: "Age verification mandates vs. GDPR Art. 5(1)(c)",
    statement: "Verifying age requires collecting identity evidence; minimization forbids collecting more than necessary for the purpose.",
    shapes: ["verification-minimization"],
    resolvability: "tech_gap",
    inclusionVerdict: "undecided",
    inclusionReasoning: "Yes, in principle: ZK age attestation. Not deployed at scale. This is a technology gap, not a true incompatibility, and belongs in a different bucket than D.",
    instruments: [
      { key: "ageVerif", role: "mandating" },
      { key: "gdpr5c", role: "conflicting" },
    ],
  },
  {
    ref: "F2",
    review: "The Travel Rule binds VASPs and financial institutions only, and the data needn't travel on-chain. Self-hosted to self-hosted transfers carry no obligation. Fails inclusion. Review by claude-opus-5-5, 2026-10-31, pending human countersign.",
    title: "FATF Travel Rule vs. self-hosted wallets",
    statement: "The rule requires originator/beneficiary information to accompany the transfer. A self-hosted wallet has no institution to attach it to and no counterparty to receive it.",
    shapes: ["verification-minimization"],
    resolvability: "unresolvable",
    inclusionVerdict: "fails",
    inclusionReasoning: "No, for self-hosted endpoints specifically.",
    instruments: [{ key: "fatf", role: "mandating" }],
    property: prop("Self-Hosted Wallets", "A self-hosted wallet has no institution to attach it to and no counterparty to receive it."),
  },
  {
    ref: "G1",
    title: "\"Anonymous\" as a binary vs. re-identifiability as a continuum",
    statement: "GDPR treats anonymized data as out of scope. Re-identifiability is a function of dataset sparsity plus available auxiliary data, and auxiliary data grows monotonically over time.",
    analysis: "Consequence: a dataset can become personal data years later without anyone touching it. No engineering action at time T fixes this.",
    shapes: ["binary-continuum"],
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    instruments: [{ key: "gdprAnon", role: "mandating" }],
  },
  {
    ref: "G2",
    title: "Art. 16 rectification vs. probabilistic inference",
    statement: "You cannot \"correct\" a credit score or a propensity estimate. It isn't true or false the way a stored field is.",
    shapes: ["binary-continuum"],
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    analysis: "Live in SCHUFA (C-634/21) and Nowak.",
    instruments: [
      { key: "gdpr16", role: "mandating" },
      { key: "schufa", role: "context" },
      { key: "nowak", role: "context" },
    ],
  },
  {
    ref: "G3",
    title: "Art. 15 / Art. 22 explainability vs. model opacity + trade secret",
    statement: "Art. 15(1)(h), as read in C-203/22, owes the data subject the procedure and principles actually applied to their data, and a complex formula doesn't satisfy it. Post-hoc attributions (SHAP, LIME) approximate the model's output. They aren't the procedure applied, and the procedure applied is weights.",
    analysis: "C-203/22 sends trade-secret claims to the supervisory authority or court for balancing, so trade secret is a limit, not a bar. Art. 22(3) asks for human intervention and contest. The explanation language is in Recital 71, which isn't binding.",
    shapes: ["binary-continuum"],
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    instruments: [
      { key: "gdpr15", role: "mandating" },
      { key: "gdpr22", role: "context" },
      { key: "tradeSecret", role: "context" },
    ],
    amendments: [
      { field: "statement", from: "Post-hoc attributions (SHAP, LIME) are approximations of the decision, not the logic. The law asks for the logic; the architecture has weights.", reason: "Restated around C-203/22's test. The mandate comes from Art. 15(1)(h), not Art. 22." },
    ],
  },
  {
    ref: "G4",
    title: "Differential privacy budget vs. redistricting accuracy",
    statement: "Census Bureau reconstruction tests show block-level tables accurate enough for equal-population districting let an attacker rebuild individual records, which 13 U.S.C. § 9(a)(2) forbids publishing. The privacy budget sets where that trade lands, and no setting satisfies both. Neither statute sets an accuracy floor or a privacy-loss limit.",
    analysis: "2020 US Census: Title 13 confidentiality vs. PL 94-171 redistricting accuracy. Litigated (Alabama v. Commerce). The court denied relief on standing and ripeness without reaching the merits.\n\nThe accuracy demand comes from equal-population case law, not PL 94-171. That source isn't cited yet. Whether swapping or other methods would meet § 9 is the Bureau's judgment and is disputed.",
    shapes: ["binary-continuum"],
    resolvability: "unresolvable",
    inclusionVerdict: "undecided",
    inclusionReasoning: "Turns on the Bureau's reconstruction-risk reading of § 9, which no court has tested.",
    instruments: [
      { key: "title13", role: "mandating" },
      { key: "pl94171", role: "mandating", note: "Block-level tabulations and a deadline. No accuracy standard." },
      { key: "alabama", role: "context" },
    ],
    amendments: [
      { field: "title", from: "Differential privacy budget vs. statutory accuracy", reason: "Neither statute sets an accuracy standard." },
      { field: "statement", from: "The privacy budget is a dial with no setting that satisfies both statutes.", reason: "The conflict is between § 9 as the Bureau reads it and equal-population accuracy, not between two statutes." },
    ],
  },
  {
    ref: "G5",
    title: "AI Act Art. 10(5) bias testing vs. GDPR Art. 9",
    statement: "Testing for bias against protected classes requires processing special-category data that Art. 9 prohibits.",
    analysis: "It was resolved by an explicit statutory carve-out. It's the corpus's only worked example of what resolution actually looks like: a legislature patching the conflict, not an engineer.",
    shapes: ["binary-continuum"],
    resolvability: "unresolvable",
    resolution: "legislative",
    resolvedBy: "AI Act Art. 10(5) carve-out",
    inclusionVerdict: "passes",
    instruments: [
      { key: "aiAct105", role: "mandating" },
      { key: "gdpr9", role: "conflicting" },
    ],
    flags: { aiAct105: "⚠ in source: least confident on the specific provision." },
  },
  {
    ref: "H1",
    title: "EU data retention mandates vs. ePrivacy Art. 15(1)",
    statement: "Member states keep enacting general and indiscriminate retention of traffic and location data, and the CJEU keeps holding that ePrivacy Art. 15(1), read with the Charter, precludes it (Tele2, La Quadrature, SpaceNet). Targeted retention and general retention of source IP addresses survive, so the conflict sits at that boundary. Structural, cyclical.",
    analysis: "Digital Rights Ireland invalidated the EU Retention Directive itself. The later rulings struck national regimes.",
    shapes: ["sovereign-contradiction"],
    shapeRationale: "Taxonomy v2, assigned by claude-opus-5-5 pending review. National legislatures mandate retention; the CJEU, applying the Charter, strikes it. Two authorities, opposite commands, one dataset.",
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    instruments: [
      { key: "euRetention", role: "mandating", note: "National statutes, e.g. the German TKG provisions struck in SpaceNet (C-793/19)." },
      { key: "eprivacy15", role: "conflicting" },
      { key: "cjeuRetention", role: "context" },
    ],
    amendments: [
      { field: "title", from: "EU data retention mandates vs. minimization", reason: "The conflicting rule is ePrivacy Art. 15(1) with the Charter, not GDPR minimization." },
      { field: "statement", from: "Member states keep re-legislating retention regimes the CJEU keeps striking (Digital Rights Ireland, Tele2, La Quadrature).", reason: "Narrowed to general and indiscriminate retention, which is what the rulings strike." },
    ],
  },
  {
    ref: "H2",
    review: "SOC 2 doesn't require logging IPs, and PCI DSS is contractual. Supports the 'fails' verdict. Review by claude-opus-5-5, 2026-10-31, pending human countersign.",
    title: "PCI DSS 10.x / SOC2 logging vs. deletion rights over IPs and access records",
    statement: "Legitimate interest usually carries this, but the tension is permanent.",
    shapes: ["mandate-mutation"],
    shapeRationale: "Taxonomy v2, assigned by claude-opus-5-5 pending review. Tamper-evident audit logs (PCI DSS Req. 10) forbid the deletion an Art. 17 request asks for. Fails inclusion: Art. 17(3)(e) and legitimate-interest balancing let the controller refuse, so a legal mechanism already carries it.",
    resolvability: "unresolvable",
    inclusionVerdict: "fails",
    instruments: [
      { key: "pci10", role: "mandating" },
      { key: "soc2", role: "mandating" },
      { key: "gdpr17", role: "conflicting" },
    ],
  },
  {
    ref: "H3",
    title: "FRCP 37(e) litigation hold vs. ephemeral messaging",
    statement: "Auto-delete defaults are a security control and a spoliation risk simultaneously.",
    analysis: "Sanctions have landed (Google Chat retention; Uber's Wickr use).",
    shapes: ["mandate-mutation"],
    shapeRationale: "Taxonomy v2, assigned by claude-opus-5-5 pending review. Inverse direction of shape 1: preservation duties forbid the deletion that ephemeral messaging uses as a security control. Passes for data under hold. Shape 1 definition should be widened to cover both directions.",
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    instruments: [{ key: "frcp37e", role: "mandating" }],
    property: prop("Ephemeral Messaging", "Auto-delete defaults are a security control."),
  },
];

export const rejections = [
  { slug: "reject-0001", title: "Cookie consent vs. functional requirements", claim: "Cookie consent vs. functional requirements.", reason: "merely_expensive" as const, reasoning: "Solvable with effort." },
  { slug: "reject-0002", title: "Accessibility vs. visual design", claim: "Accessibility vs. visual design.", reason: "out_of_scope" as const, reasoning: "Design constraint, not incompatibility." },
  { slug: "reject-0003", title: "Encryption export controls", claim: "Encryption export controls.", reason: "out_of_scope" as const, reasoning: "Historical, and a policy choice, not a structural conflict." },
  { slug: "reject-0004", title: "Latency SLAs vs. consent checks", claim: "Latency SLAs vs. consent checks.", reason: "merely_expensive" as const, reasoning: "Engineering cost." },
  { slug: "reject-0005", title: "HIPAA vs. cloud hosting", claim: "HIPAA vs. cloud hosting.", reason: "resolved_by_known_technique" as const, reasoning: "Solved by BAAs a decade ago." },
];

/** "Next 17 cases: where to look." Shape is set only where the source names one. */
/** Every v0.1 lead has been drafted: passing ones are N-series cases, failing ones are rejections. */
export const leads: { ref: string; title: string; shape?: string }[] = [];

/** Filled by `pnpm --filter @bind/db prior-art`. Nothing has been run yet. */
export const audits: { shape: string; model: string; promptVersion: string; verdict: "novel" | "partial" | "rebrand" | "inconclusive"; priorArt: string | null; reasoning: string }[] = [];
