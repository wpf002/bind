/**
 * Model-drafted cases (claude-opus-5-5, 2026-10-31). They publish under the corpus-wide owner
 * sign-off in signoff.ts, which records that no case-by-case human check was done.
 * N23-N24 (claude-fable-5-1, 2026-11-06) publish under the second sign-off in signoff.ts.
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
 * "WhatsApp v Union of India, Delhi HC, 2021" cites the Ministry's press release; the court's case-status record was read on 2026-11-06.
 * The N23-N24 labels were read by claude-fable-5-1 on 2026-11-06.
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
  "WhatsApp v Union of India, Delhi HC, 2021": {
    status: "verified",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1721915",
    publisher: "Press Information Bureau, Government of India (Ministry of Electronics & IT)",
    quote: "WhatsApp's challenge, at the very last moment, and despite having sufficient time and opportunity available during consultation process and after the rules were enacted, to the Intermediary Guidelines is an unfortunate attempt to prevent the same from coming into effect.",
    provision: "MeitY press release of 26 May 2021 answering W.P.(C) 7284/2021",
    note: "The Ministry's release answers WhatsApp's petition against rule 4(2) and doesn't give the case number. The Delhi High Court's case-status record for W.P.(C) 7284/2021, WHATSAPP LLC VS. UNION OF INDIA, was read on 2026-11-06: pending, Court No. 1, last listed 11/08/2026, next date 17/11/2026, no judgments. That record is at https://delhihighcourt.nic.in/app/get-case-type-status behind a CAPTCHA, which the owner entered, and its result URLs are session-bound, so the cited URL is the release. Filing and notice dates (May 2021, 27 Aug 2021) come from LiveLaw and Bar & Bench.",
    verifiedBy: "claude-fable-5-1", verifiedAt: "2026-11-06",
  },
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
  "NPPA Notice 国新出发〔2021〕14号, items 1-2": v("nb_cnNppa2021"),
  "Regulations on the Protection of Minors in Cyberspace, Art. 46": v("nb_cnMinors46"),
  "PIPL Art. 6, Art. 13(1)(3)": v("nb_cnPipl6"),
  "Measures for the National Network Identity Authentication Public Service (MPS Order No. 173), Arts. 2, 7": {
    status: "verified",
    url: "https://www.cac.gov.cn/2025-05/23/c_1749711107835487.htm",
    publisher: "国家互联网信息办公室 (Cyberspace Administration of China)",
    quote: "互联网平台接入公共服务后，用户选择使用网号、网证登记、核验真实身份信息并通过验证的，互联网平台不得要求用户另行提供明文身份信息，法律、行政法规另有规定或者用户同意提供的除外。",
    provision: "Arts. 2, 7",
    note: "Working translation of Art. 7 para 2: once a platform has connected to the public service, if a user chooses to register and verify real identity with a network number or network credential and passes, the platform must not require the user to provide plaintext identity information as well, unless laws or administrative regulations provide otherwise or the user agrees. Art. 2 defines the network number as \"与自然人身份信息相对应，由字母和数字组成、不含明文身份信息的网络身份符号\" (an identifier of letters and digits that corresponds to a natural person's identity information and contains no plaintext identity information). Art. 7 para 1 says platforms connect \"按照自愿原则\" (on a voluntary basis). Ministry of Public Security Order No. 173, issued with five other bodies, in force 15 July 2025.",
    verifiedBy: "claude-fable-5-1", verifiedAt: "2026-11-06",
  },
  "Federal Law No. 194-FZ of 07.07.2025, kremlin.ru": v("nb_ru194fz"),
  "Law No. 2300-1 Art. 4(4.1)-(4.2), consolidated text via КонсультантПлюс": v("nb_ruZpp42"),
  "Government Decree No. 1867 of 18.11.2020, device list item 1": {
    status: "verified",
    url: "https://www.consultant.ru/document/cons_doc_LAW_455948/707abba3c19e4abd272abf78857085e101af14ee/",
    publisher: "КонсультантПлюс (commercial legal database)",
    quote: "Оборудование беспроводной связи для бытового использования, персональные электронные вычислительные машины, имеющие сенсорный экран, обладающие двумя и более функциями, с предварительно установленными на них программами для электронных вычислительных машин, имеющие возможность установки таких программ из магазинов приложений для операционных систем, на основе которых функционирует такое оборудование (смартфоны, планшетные компьютеры).",
    provision: "List of technically complex goods, item 1",
    note: "Working translation: consumer wireless communication equipment and personal computers with a touchscreen and two or more functions, with pre-installed programs, able to install such programs from app stores for the operating systems they run on (smartphones, tablet computers). Items 2 and 3 cover desktop and laptop computers and smart TVs. Decree edition of 26.08.2023; list as amended by Decree No. 2098 of 30.11.2021. Not the official publication.",
    verifiedBy: "claude-fable-5-1", verifiedAt: "2026-11-06",
  },
};
