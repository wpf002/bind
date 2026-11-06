# Review

Two things need Will's approval. Nothing here is recorded as approved yet.

## Reviews awaiting countersign

Each review was written by claude-opus-5-5 and sits in `packages/db/prisma/corpus.ts`.

| Ref | Finding | Effect on the case |
|---|---|---|
| A1 | EDPB Guidelines 02/2025 (draft) say encrypted data stays personal data, so key destruction isn't erasure. Final text not yet checked. | Strengthens it |
| D2 | "When technically feasible" isn't in OSA s.121. It's a ministerial assurance (HL Deb 6 Sept 2023, col 458). The analysis calls it the legislature's admission, and it's the Government's. | Analysis wording |
| D3 | No binding mandate found. Commission Recommendation (EU) 2020/518 is non-binding and asks for aggregated data. | Fails |
| E1 | Directive 2024/1799 Art. 5(6) exempts techniques "justified by legitimate and objective factors". The US laws carry no such exemption. | Passes |
| F2 | The Travel Rule binds VASPs and financial institutions only, and the data needn't travel on-chain. | Fails |
| H2 | SOC 2 doesn't require logging IPs, and PCI DSS is contractual. | Fails |

## Reasoning that differs from the approved drafts

| Ref | Approved | Written |
|---|---|---|
| D1 | "Boundary case. The conflict returns only if a regulator demands detail the architecture never had." | "Kept as a boundary case: the conflict returns only if a regulator demands detail the architecture never had." |
| E1 | Ended at "Budget doesn't change that." | Adds: "A plural attestation model would replace the architecture, not satisfy it. Directive 2024/1799 Art. 5(6) may exempt security-justified pairing in the EU; the US state laws have no such exemption." |
| N21 | "Provider exits from India are press-reported, not verified." | "Several providers reportedly removed Indian servers in 2022; press-reported, not verified." Also "keeping them" for "retaining them". |
| N22 | "(resolved by known technique). Rated resolvable at cost. Boundary case." | ", a known technique. Rated resolvable at cost and kept as a boundary case." |

## Still open after approval

| Item | Why |
|---|---|
| WhatsApp v. Union of India, reported as W.P.(C) 7284/2021 | Only secondary reports found. The Delhi HC case-status portal needs a CAPTCHA. N13 carries the one unverified citation. |
