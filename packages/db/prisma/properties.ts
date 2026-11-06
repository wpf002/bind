/**
 * The architectural properties an engineer picks, shared across cases. One property links many cases.
 * A case's own property statement (SeedCase.property) stays case-specific and seeds the link's note.
 */
export type SeedProperty = {
  slug: string;
  name: string;
  /** What the property is for. */
  threatModel: string;
  /** Why abandoning the property defeats the system. */
  defeatNote: string;
  /** Systems that rely on it. */
  exemplars: string[];
};

export const properties: SeedProperty[] = [
  {
    slug: "append-only-integrity",
    name: "Append-Only Integrity",
    threatModel: "Records, once written, cannot be altered or removed by any party, so a reader can detect tampering and trust history.",
    defeatNote: "A store that can delete or rewrite on demand gives up the tamper evidence that justified using it.",
    exemplars: ["Distributed ledgers", "Certificate Transparency", "WORM archives", "Hash-chained audit logs", "Immutable smart contracts"],
  },
  {
    slug: "end-to-end-encryption",
    name: "End-To-End Encryption",
    threatModel: "Only the communicating endpoints hold the keys. The operator carries ciphertext it cannot read.",
    defeatNote: "Any operator-side key, scanner or escrow makes the operator a party to every conversation and a target for compulsion.",
    exemplars: ["Signal", "WhatsApp", "iMessage", "Provider-blind backups"],
  },
  {
    slug: "unlinkability",
    name: "Unlinkability",
    threatModel: "No party can tie a record, session or proof to a person, device or other record beyond what the protocol discloses.",
    defeatNote: "A persistent link, however it is justified, re-identifies every record that shares it.",
    exemplars: ["No-log VPNs", "Decentralised exposure notification", "Anonymous credentials", "Logged-out analytics"],
  },
  {
    slug: "data-minimisation",
    name: "Data Minimisation",
    threatModel: "The system collects, infers and keeps only the data its purpose needs, and nothing it could later be compelled to use.",
    defeatNote: "Data collected for one mandate is available to every other mandate and every breach.",
    exemplars: ["Threshold-only age proofs", "Ephemeral messaging", "Contextual advertising", "Aggregate-only metrics"],
  },
  {
    slug: "anonymised-release",
    name: "Anonymised Release",
    threatModel: "Published data is useful in aggregate and cannot be traced back to an individual.",
    defeatNote: "A release accurate enough to be useful is a release that re-identifies, given enough auxiliary data.",
    exemplars: ["Census tabulations", "Differential privacy", "Event data recorders", "Open research datasets"],
  },
  {
    slug: "learned-models",
    name: "Learned Models",
    threatModel: "Behaviour is a statistical function of training data, not a stored fact, so it can generalise and adapt.",
    defeatNote: "Making the model a lookup table of auditable, correctable, deletable facts removes the reason it was a model.",
    exemplars: ["Credit scoring", "Large language models", "Behavioural ad targeting", "Fraud detection"],
  },
  {
    slug: "single-trust-root",
    name: "Single Trust Root",
    threatModel: "The device or platform runs only what one root has signed or attested, so a compromise elsewhere cannot reach it.",
    defeatNote: "A second root, or an exception for unattested parts and clients, is the attack the root was built to refuse.",
    exemplars: ["Secure boot", "iOS app distribution", "Play Integrity", "Component pairing", "Browser root programs"],
  },
  {
    slug: "decentralised-control",
    name: "Decentralised Control",
    threatModel: "No single party can stop, alter or be compelled over the system. There is no intermediary to serve.",
    defeatNote: "An operator who can comply with an order is an operator who can be ordered.",
    exemplars: ["Self-hosted wallets", "Immutable smart contracts", "Decentralised exposure notification", "Permissionless protocols"],
  },
  {
    slug: "data-residency",
    name: "Data Residency",
    threatModel: "Data stays within a jurisdiction's boundary, so only that jurisdiction's law reaches it.",
    defeatNote: "A copy outside the boundary is reachable by whoever has jurisdiction over the copy or its custodian.",
    exemplars: ["Regional cloud deployments", "Anycast CDNs", "Correspondent banking records", "Segregated clinical records"],
  },
  {
    slug: "uniform-global-policy",
    name: "Uniform Global Policy",
    threatModel: "One system applies one rule to every record and counterparty, wherever it is sold or stored.",
    defeatNote: "Per-jurisdiction forks of policy mean the same record or token behaves differently depending on who asks.",
    exemplars: ["Cross-border stablecoins", "Global sanctions screening", "Multinational record retention"],
  },
];

/** Case corpus ref to property slugs, primary first. The seed refuses a case that isn't here. */
export const caseProperties: Record<string, string[]> = {
  A1: ["append-only-integrity"],
  A2: ["append-only-integrity", "uniform-global-policy"],
  A3: ["append-only-integrity"],
  A4: ["learned-models"],
  B1: ["data-residency"],
  B2: ["single-trust-root"],
  C1: ["data-residency"],
  D1: ["end-to-end-encryption"],
  D2: ["end-to-end-encryption"],
  D3: ["decentralised-control", "unlinkability"],
  E1: ["single-trust-root"],
  E2: ["single-trust-root"],
  E3: ["end-to-end-encryption"],
  E4: ["single-trust-root"],
  F1: ["data-minimisation"],
  F2: ["decentralised-control"],
  G1: ["anonymised-release"],
  G2: ["learned-models"],
  G3: ["learned-models"],
  G4: ["anonymised-release"],
  G5: ["data-minimisation", "learned-models"],
  H1: ["data-minimisation"],
  H2: ["append-only-integrity"],
  H3: ["data-minimisation"],
  N4: ["append-only-integrity", "decentralised-control"],
  N5: ["uniform-global-policy"],
  N6: ["data-residency", "uniform-global-policy"],
  N7: ["decentralised-control"],
  N8: ["data-residency"],
  N12: ["end-to-end-encryption"],
  N13: ["end-to-end-encryption", "unlinkability"],
  N14: ["single-trust-root"],
  N15: ["unlinkability", "data-minimisation"],
  N17: ["data-minimisation", "learned-models"],
  N18: ["end-to-end-encryption"],
  N19: ["anonymised-release", "unlinkability"],
  N20: ["uniform-global-policy"],
  N21: ["unlinkability"],
  N23: ["unlinkability", "data-minimisation"],
  N24: ["single-trust-root"],
};
