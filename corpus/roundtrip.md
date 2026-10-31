### A1. GDPR Art. 17 erasure vs. append-only ledgers
- **Legal:** GDPR Art. 17
- **Architectural:** Immutability is the security property of a distributed ledger. Mutation is the attack it's designed to prevent.
- **Incompatibility:** Erasure requires the operation the threat model forbids.
- **Current papering-over:** Off-chain storage: Off-chain storage with on-chain hash pointers. Crypto-shredding: Destroy the key, leave the ciphertext. CNIL's 2018 guidance treated key destruction as a possible route. I don't believe the EDPB has ever endorsed it, which leaves it legally untested.
- **Resolvable?** resolvable_costly. Partially, but only by moving personal data out of the architecture, i.e. by not using the property you adopted the ledger for.
- **Sources:** EDPB position on crypto-shredding: ⚠ in source: no EDPB endorsement is believed to exist. Confirm.

### A2. Erasure/deletion rights vs. mandatory retention
- **Legal:** GDPR Art. 17; CCPA Deletion; SEC 17a-4; FRCP 37(e) (Litigation hold.)
- **Architectural:** WORM media and immutable backup snapshots are physically/cryptographically non-erasable by design.
- **Incompatibility:** Two legal regimes command opposite state changes on the same bytes. The architecture didn't cause this and can't fix it.
- **Current papering-over:** Deletion debt: Scope backups out of deletion; delete on restore ("deletion debt"). Put beyond use: ICO's "put beyond use" position.
- **Resolvable?** unresolvable. No. Not an engineering problem.

### A3. Erasure vs. transparency logs
- **Legal:** GDPR Art. 17
- **Architectural:** Certificate Transparency logs are append-only Merkle trees; their entire security value is that entries cannot be removed retroactively.
- **Incompatibility:** A mis-issued certificate with personal data in the SAN field is permanently public, by design, and the design is the point.
- **Note:** Current papering-over: none. The tension is acknowledged and tolerated.
- **Resolvable?** unresolvable. No.

### A4. Erasure vs. trained model weights
- **Legal:** GDPR Art. 17; FTC Deletion orders
- **Architectural:** Memorization means the weights may constitute a copy. Machine unlearning is approximate and, critically, not verifiable by the data subject or regulator.
- **Incompatibility:** The law wants a proof of absence. The architecture can only offer a probabilistic reduction.
- **Current papering-over:** Algorithmic disgorgement: The FTC's algorithmic disgorgement remedy (Everalbum, Kurbo/WW) orders destruction of the model, not the data. That's a regulator conceding the point rather than solving it. The most interesting datum in this section.
- **Resolvable?** unresolvable. No, absent verifiable unlearning.

### B1. Schrems II transfer restrictions vs. CLOUD Act production orders
- **Legal:** Schrems II Transfer restrictions; CLOUD Act Production orders
- **Incompatibility:** EU law forbids the transfer; US law compels production; same data, same provider.
- **Note:** Architectural: irrelevant. Encryption doesn't help when the compelled party holds the keys. This is a legal conflict that merely surfaces in architecture. Engineers get handed it anyway.
- **Resolvable?** unresolvable. No. This is a legal conflict that merely surfaces in architecture.

### B2. eIDAS 2.0 QWAC trust-root mandate vs. root program distrust authority
- **Legal:** eIDAS 2.0 QWAC trust-root mandate
- **Architectural:** The Web PKI's only real security mechanism is the ability to distrust a misbehaving CA quickly.
- **Incompatibility:** A trust root you cannot remove is not a trust decision.
- **Resolvable?** unresolvable. No. Mozilla/Google's public objections were the tell.
- **Sources:** eIDAS 2.0, QWAC trust-root mandate: ⚠ in source: least confident on the specific provision.

### C1. Data localization vs. anycast + global load balancing
- **Legal:** 242-FZ Localization; PIPL/CSL Localization; RBI Payments localization
- **Architectural:** Placement under anycast routing and opportunistic cache fill is an emergent runtime property of BGP and traffic, not a configured fact. Global failover, latency.
- **Incompatibility:** The law asks a question the system cannot answer without giving up the property (global failover, latency) it was built for.
- **Current papering-over:** Pinned regions: In-country pinned regions with degraded performance and separate operational stacks. Degraded performance and separate operational stacks.
- **Resolvable?** resolvable_costly. Yes, expensively, by abandoning the architecture. So it fails the strict inclusion test and sits here as a boundary case.

### D1. E2EE vs. Art. 33/34 breach notification
- **Legal:** GDPR Art. 33/34
- **Architectural:** A zero-knowledge operator holds ciphertext and cannot inspect what leaked.
- **Incompatibility:** The law requires the operator to know something the architecture was specifically built to prevent it from knowing.
- **Resolvable?** unresolvable. No. Either the operator can inspect user data or it can't.

### D2. UK Online Safety Act s.121 scanning notices vs. E2EE
- **Legal:** UK OSA s.121
- **Architectural:** The architecture exists to preclude detection capability.
- **Incompatibility:** Same shape, different direction: the law requires detection capability that the architecture exists to preclude.
- **Note:** Deferred in practice ("when technically feasible"), which is a legislature admitting the incompatibility without repealing the clause.
- **Resolvable?** unresolvable
- **Sources:** Online Safety Act, s.121: ⚠ in source: least confident on the specific provision.

### D3. Exposure notification: DP-3T/GAEN vs. epidemiological need
- **Legal:** Public Health Linkage data (Legal/institutional.)
- **Architectural:** The decentralized design deliberately withheld it.
- **Incompatibility:** The decentralized design deliberately withheld the linkage data public health authorities needed.
- **Note:** The clearest case where the architecture won and the requirement went unmet. Useful control case.
- **Resolvable?** unresolvable

### E1. Right to repair vs. parts pairing / attested firmware
- **Legal:** EU R2R Directive 2024/1799; US States Right to repair
- **Architectural:** Secure boot and component attestation work by rejecting unattested parts.
- **Incompatibility:** Secure boot and component attestation work by rejecting unattested parts. Repair requires installing exactly those.
- **Resolvable?** unresolvable. No, not without a plural attestation model that doesn't currently exist.
- **Sources:** Directive (EU) 2024/1799, Directive 2024/1799: ⚠ in source: least confident on the specific provision.

### E2. DMA Art. 6(4) sideloading vs. single-root iOS distribution model
- **Legal:** DMA Art. 6(4)
- **Architectural:** Single-root iOS distribution model.
- **Incompatibility:** DMA Art. 6(4) sideloading vs. single-root iOS distribution model.
- **Resolvable?** unresolvable

### E3. DMA Art. 7 messaging interoperability vs. E2EE guarantees
- **Legal:** DMA Art. 7
- **Architectural:** E2EE guarantees.
- **Incompatibility:** You cannot verify the security properties of a bridged counterparty's implementation. Interop degrades the guarantee to "as strong as the weakest bridge."
- **Resolvable?** unresolvable

### E4. Client attestation (Play Integrity, WEI) vs. accessibility and interoperability obligations
- **Legal:** A11y/Interop Unspecified
- **Architectural:** Attestation excludes modified clients.
- **Incompatibility:** Attestation excludes modified clients. Assistive tooling and interoperable clients are modified clients.
- **Resolvable?** unresolvable

### F1. Age verification mandates vs. GDPR Art. 5(1)(c)
- **Legal:** Age Verification Unspecified; GDPR Art. 5(1)(c)
- **Incompatibility:** Verifying age requires collecting identity evidence; minimization forbids collecting more than necessary for the purpose.
- **Resolvable?** tech_gap. Yes, in principle: ZK age attestation. Not deployed at scale. This is a technology gap, not a true incompatibility, and belongs in a different bucket than D.

### F2. FATF Travel Rule vs. self-hosted wallets
- **Legal:** FATF Travel Rule
- **Architectural:** A self-hosted wallet has no institution to attach it to and no counterparty to receive it.
- **Incompatibility:** The rule requires originator/beneficiary information to accompany the transfer. A self-hosted wallet has no institution to attach it to and no counterparty to receive it.
- **Resolvable?** unresolvable. No, for self-hosted endpoints specifically.

### G1. "Anonymous" as a binary vs. re-identifiability as a continuum
- **Legal:** GDPR Anonymous data
- **Incompatibility:** GDPR treats anonymized data as out of scope. Re-identifiability is a function of dataset sparsity plus available auxiliary data, and auxiliary data grows monotonically over time.
- **Note:** Consequence: a dataset can become personal data years later without anyone touching it. No engineering action at time T fixes this.
- **Resolvable?** unresolvable

### G2. Art. 16 rectification vs. probabilistic inference
- **Legal:** GDPR Art. 16; CJEU C-634/21; CJEU Nowak
- **Incompatibility:** You cannot "correct" a credit score or a propensity estimate. It isn't true or false the way a stored field is.
- **Note:** Live in SCHUFA (C-634/21) and Nowak.
- **Resolvable?** unresolvable

### G3. Art. 15 / Art. 22 explainability vs. model opacity + trade secret
- **Legal:** GDPR Art. 15; GDPR Art. 22; Trade Secret Unspecified
- **Incompatibility:** Post-hoc attributions (SHAP, LIME) are approximations of the decision, not the logic. The law asks for the logic; the architecture has weights.
- **Resolvable?** unresolvable

### G4. Differential privacy budget vs. statutory accuracy
- **Legal:** Title 13 Confidentiality; PL 94-171 Redistricting data; Alabama v. Commerce Litigation
- **Incompatibility:** The privacy budget is a dial with no setting that satisfies both statutes.
- **Note:** 2020 US Census: Title 13 confidentiality vs. PL 94-171 redistricting accuracy. Litigated (Alabama v. Commerce).
- **Resolvable?** unresolvable

### G5. AI Act Art. 10(5) bias testing vs. GDPR Art. 9
- **Legal:** AI Act Art. 10(5); GDPR Art. 9
- **Incompatibility:** Testing for bias against protected classes requires processing special-category data that Art. 9 prohibits.
- **Note:** It was resolved by an explicit statutory carve-out. It's the corpus's only worked example of what resolution actually looks like: a legislature patching the conflict, not an engineer.
- **Resolvable?** unresolvable
- **Sources:** AI Act, Art. 10(5): ⚠ in source: least confident on the specific provision.

### H1. EU data retention mandates vs. minimization
- **Legal:** EU Retention Retention mandates; GDPR Art. 5(1)(c); CJEU Retention rulings
- **Incompatibility:** Member states keep re-legislating retention regimes the CJEU keeps striking (Digital Rights Ireland, Tele2, La Quadrature). Structural, cyclical.
- **Resolvable?** unresolvable

### H2. PCI DSS 10.x / SOC2 logging vs. deletion rights over IPs and access records
- **Legal:** PCI DSS 10.x; SOC 2 Logging; GDPR Art. 17
- **Incompatibility:** Legitimate interest usually carries this, but the tension is permanent.
- **Resolvable?** unresolvable

### H3. FRCP 37(e) litigation hold vs. ephemeral messaging
- **Legal:** FRCP 37(e)
- **Architectural:** Auto-delete defaults are a security control.
- **Incompatibility:** Auto-delete defaults are a security control and a spoliation risk simultaneously.
- **Note:** Sanctions have landed (Google Chat retention; Uber's Wickr use).
- **Resolvable?** unresolvable
