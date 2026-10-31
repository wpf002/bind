# Legal–Architectural Incompatibilities: Corpus v0.1

23 cases where a legal requirement and a technical architecture issue
contradictory mandates, such that no amount of engineering effort resolves the
conflict — because the contradiction is upstream of implementation.

**Inclusion test.** A case qualifies only if a competent engineer with unlimited
budget still cannot satisfy both sides. Cases that are merely expensive, or that
a better implementation would fix, are out. This test is stricter than it sounds
and it excluded several obvious-seeming candidates (see Rejected, end of file).

**Status.** Legal citations are from working memory and need verification before
this goes anywhere public. Marked ⚠ where I'm least confident on the specific
provision number.

---

## A. Deletion vs. durability

### A1. GDPR Art. 17 erasure vs. append-only ledgers
- **Legal:** Data subject may demand erasure of personal data.
- **Architectural:** Immutability is the security property of a distributed
  ledger. Mutation is the attack it's designed to prevent.
- **Incompatibility:** Erasure requires the operation the threat model forbids.
- **Current papering-over:** Off-chain storage with on-chain hash pointers;
  "crypto-shredding" (destroy the key, leave the ciphertext). CNIL's 2018
  guidance treated key destruction as a possible route; ⚠ I don't believe the
  EDPB has ever endorsed it, which leaves it legally untested.
- **Resolvable?** Partially — but only by moving personal data out of the
  architecture, i.e. by not using the property you adopted the ledger for.

### A2. Erasure/deletion rights vs. mandatory retention
- **Legal:** GDPR Art. 17 / CCPA deletion *and* SEC 17a-4 WORM retention for
  broker-dealer records, plus litigation hold.
- **Architectural:** WORM media and immutable backup snapshots are
  physically/cryptographically non-erasable by design.
- **Incompatibility:** Two legal regimes command opposite state changes on the
  same bytes. The architecture didn't cause this and can't fix it.
- **Current papering-over:** Scope backups out of deletion; delete on restore
  ("deletion debt"). ICO's "put beyond use" position.
- **Resolvable?** No. Not an engineering problem.

### A3. Erasure vs. transparency logs
- **Legal:** Art. 17.
- **Architectural:** Certificate Transparency logs are append-only Merkle
  trees; their entire security value is that entries cannot be removed
  retroactively.
- **Incompatibility:** A mis-issued certificate with personal data in the SAN
  field is permanently public, by design, and the design is the point.
- **Current papering-over:** None. The tension is acknowledged and tolerated.
- **Resolvable?** No.

### A4. Erasure vs. trained model weights
- **Legal:** Art. 17; also FTC deletion orders.
- **Architectural:** Memorization means the weights may constitute a copy.
  Machine unlearning is approximate and — critically — not verifiable by the
  data subject or regulator.
- **Incompatibility:** The law wants a proof of absence. The architecture can
  only offer a probabilistic reduction.
- **Current papering-over:** The FTC's algorithmic disgorgement remedy
  (Everalbum, Kurbo/WW) orders destruction of *the model*, not the data. That's
  a regulator conceding the point rather than solving it — the most
  interesting datum in this section.
- **Resolvable?** No, absent verifiable unlearning.

---

## B. Sovereign contradiction

### B1. Schrems II transfer restrictions vs. CLOUD Act production orders
- **Legal:** EU law forbids the transfer; US law compels production; same data,
  same provider.
- **Architectural:** Irrelevant. Encryption doesn't help when the compelled
  party holds the keys.
- **Resolvable?** No. This is a legal conflict that merely *surfaces* in
  architecture. Engineers get handed it anyway.

### B2. eIDAS 2.0 QWAC trust-root mandate vs. root program distrust authority ⚠
- **Legal:** Browsers required to trust member-state-designated CAs.
- **Architectural:** The Web PKI's only real security mechanism is the ability
  to distrust a misbehaving CA quickly.
- **Incompatibility:** A trust root you cannot remove is not a trust decision.
- **Resolvable?** No. Mozilla/Google's public objections were the tell.

---

## C. Locality vs. emergent topology

### C1. Data localization vs. anycast + global load balancing
- **Legal:** Russia 242-FZ, China PIPL/CSL, India's RBI payments mandate — all
  presuppose data has a determinate location.
- **Architectural:** Placement under anycast routing and opportunistic cache
  fill is an emergent runtime property of BGP and traffic, not a configured
  fact.
- **Incompatibility:** The law asks a question the system cannot answer without
  giving up the property (global failover, latency) it was built for.
- **Current papering-over:** In-country pinned regions with degraded
  performance and separate operational stacks.
- **Resolvable?** Yes, expensively — by abandoning the architecture. So it
  fails the strict inclusion test and sits here as a boundary case.

---

## D. Deliberate operator blindness

*The most interesting shape in the corpus.*

### D1. E2EE vs. Art. 33/34 breach notification
- **Legal:** Notify the supervisory authority within 72 hours, describing the
  categories and approximate number of records affected.
- **Architectural:** A zero-knowledge operator holds ciphertext and cannot
  inspect what leaked.
- **Incompatibility:** The law requires the operator to know something the
  architecture was specifically built to prevent it from knowing.
- **Resolvable?** No. Either the operator can inspect user data or it can't.

### D2. UK Online Safety Act s.121 scanning notices vs. E2EE ⚠
- Same shape, different direction: the law requires detection capability that
  the architecture exists to preclude. Deferred in practice ("when technically
  feasible"), which is a legislature admitting the incompatibility without
  repealing the clause.

### D3. Exposure notification: DP-3T/GAEN vs. epidemiological need
- **Legal/institutional:** Public health authorities needed linkage data to do
  actual epidemiology.
- **Architectural:** The decentralized design deliberately withheld it.
- **Note:** The clearest case where the architecture *won* and the requirement
  went unmet. Useful control case.

---

## E. Trust-root monopoly vs. plurality mandates

### E1. Right to repair vs. parts pairing / attested firmware
- **Legal:** EU Directive 2024/1799 ⚠ and US state statutes.
- **Architectural:** Secure boot and component attestation work by rejecting
  unattested parts. Repair requires installing exactly those.
- **Resolvable?** No, not without a plural attestation model that doesn't
  currently exist.

### E2. DMA Art. 6(4) sideloading vs. single-root iOS distribution model
### E3. DMA Art. 7 messaging interoperability vs. E2EE guarantees
- You cannot verify the security properties of a bridged counterparty's
  implementation. Interop degrades the guarantee to "as strong as the weakest
  bridge."
### E4. Client attestation (Play Integrity, WEI) vs. accessibility and
  interoperability obligations
- Attestation excludes modified clients. Assistive tooling and interoperable
  clients *are* modified clients.

---

## F. Verification vs. minimization

### F1. Age verification mandates vs. GDPR Art. 5(1)(c)
- Verifying age requires collecting identity evidence; minimization forbids
  collecting more than necessary for the purpose.
- **Resolvable?** Yes, in principle — ZK age attestation. Not deployed at
  scale. This is a *technology gap*, not a true incompatibility, and belongs in
  a different bucket than D.

### F2. FATF Travel Rule vs. self-hosted wallets
- The rule requires originator/beneficiary information to accompany the
  transfer. A self-hosted wallet has no institution to attach it to and no
  counterparty to receive it.
- **Resolvable?** No, for self-hosted endpoints specifically.

---

## G. Legal binary vs. continuous property

*The category-error bucket.*

### G1. "Anonymous" as a binary vs. re-identifiability as a continuum
- GDPR treats anonymized data as out of scope. Re-identifiability is a function
  of dataset sparsity plus available auxiliary data, and auxiliary data grows
  monotonically over time.
- **Consequence:** A dataset can become personal data years later without
  anyone touching it. No engineering action at time T fixes this.

### G2. Art. 16 rectification vs. probabilistic inference
- You cannot "correct" a credit score or a propensity estimate. It isn't true
  or false the way a stored field is. Live in SCHUFA (C-634/21) and Nowak.

### G3. Art. 15 / Art. 22 explainability vs. model opacity + trade secret
- Post-hoc attributions (SHAP, LIME) are approximations of the decision, not
  the logic. The law asks for the logic; the architecture has weights.

### G4. Differential privacy budget vs. statutory accuracy
- 2020 US Census: Title 13 confidentiality vs. PL 94-171 redistricting
  accuracy. Litigated (Alabama v. Commerce). The privacy budget is a dial with
  no setting that satisfies both statutes.

### G5. AI Act Art. 10(5) bias testing vs. GDPR Art. 9 ⚠
- Testing for bias against protected classes requires processing
  special-category data that Art. 9 prohibits.
- **Why this one matters:** It was resolved by an explicit statutory carve-out.
  It's the corpus's only worked example of what resolution actually looks like
  — a legislature patching the conflict, not an engineer.

---

## H. Retention and logging

### H1. EU data retention mandates vs. minimization
- Member states keep re-legislating retention regimes the CJEU keeps striking
  (Digital Rights Ireland, Tele2, La Quadrature). Structural, cyclical.
### H2. PCI DSS 10.x / SOC2 logging vs. deletion rights over IPs and access
  records
- Legitimate interest usually carries this, but the tension is permanent.
### H3. FRCP 37(e) litigation hold vs. ephemeral messaging
- Auto-delete defaults are a security control and a spoliation risk
  simultaneously. Sanctions have landed (Google Chat retention; Uber's Wickr
  use).

---

# The taxonomy

Seven shapes. This is the actual output of the corpus.

| # | Shape | Cases | Truly unresolvable? | Whose problem? |
|---|---|---|---|---|
| 1 | **Mandate–mutation** — law requires a state change the security property forbids | A1–A4 | Yes for A3, A4 | Architect |
| 2 | **Sovereign contradiction** — two authorities, opposite commands, one artifact | A2, B1, B2 | Yes | Nobody. Unowned. |
| 3 | **Locality vs. emergent placement** — law presumes location; system computes it at runtime | C1 | No, but costly | Architect |
| 4 | **Deliberate blindness** — law requires knowledge the architecture exists to prevent | D1–D3 | **Yes** | Architect |
| 5 | **Trust-root monopoly vs. plurality** — security from one root; law mandates many | B2, E1–E4 | Yes, pending plural attestation | Architect |
| 6 | **Verification vs. minimization** — proving an attribute requires collecting more than the attribute | F1, F2 | No — tech gap | Researcher |
| 7 | **Binary vs. continuum** — legal category is a threshold on a shifting continuous property | G1–G5 | Yes, but by category error | Legislator |

## What the corpus actually shows

Three findings, in descending confidence.

**1. These are not one phenomenon.** The strongest result, and it kills the
"Synthecology" framing outright. Shape 2 has no architectural content at all —
it's a pure conflict of laws that engineers get handed because they hold the
data. Shape 7 is a drafting error: the statute quantizes something continuous.
Shape 6 is a research gap that will close. Only shapes 1, 4, and 5 are
genuinely architectural, and only those three deserve the name.

**2. Shape 4 is the one nobody owns.** Mandate–mutation (shape 1) is
well-covered in the blockchain/GDPR literature. Trust-root plurality (shape 5)
is live in antitrust and platform-regulation work. But "the law requires the
operator to know what the architecture was built to prevent it from knowing"
has no literature under a single name, and it's the shape that recurs hardest
as E2EE and confidential computing spread. That's where a paper goes.

**3. Only one case in 23 shows a real resolution,** and it's G5 — a legislative
carve-out. Zero cases were resolved by engineering. Weak evidence, small N, but
directionally it says the resolution mechanism for this class is statutory, not
technical, which inverts how these get staffed inside companies.

## Kill criteria

If, at 40 cases, the shapes stop consolidating — say you're at 15+ shapes with
one or two cases each — this is a list, not a taxonomy. Kill it. Current
trajectory is the opposite (23 cases collapsed to 7 shapes, and 3 of those 7
are arguably out of scope), so keep going.

## Rejected — failed the inclusion test

- **Cookie consent vs. functional requirements.** Solvable with effort.
- **Accessibility vs. visual design.** Design constraint, not incompatibility.
- **Encryption export controls.** Historical, and a policy choice, not a
  structural conflict.
- **Latency SLAs vs. consent checks.** Engineering cost.
- **HIPAA vs. cloud hosting.** Solved by BAAs a decade ago.

## Next 17 cases — where to look

Financial market structure (MiFID II best execution vs. dark pool opacity);
medical device firmware (MDR recertification vs. security patch cadence —
likely a strong shape-5 case); automotive (UNECE R155/R156 vs. right to
repair); telecom (CALEA lawful intercept vs. 5G SUPI concealment — probable
shape 4); ad tech (TCF consent vs. real-time bidding broadcast); DSA researcher
data access vs. platform security posture.
