import type { SeedCase } from "../corpus";
import { SIGNOFF_NOTE } from "../signoff";
import type { Verification } from "../verifications";

// Drafts batch A: finance, health and medical devices, automotive, ICS, energy.
// Drafted by claude-opus-5-5; owner sign-off in ../signoff.ts. Refs run N1-N8, N19-N20: three required
// leads (all fail the inclusion test) plus seven passing replacements.

const BY = "claude-opus-5-5";
const AT = "2026-10-31";
const eurlex = (celex: string) => `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`;
const CELLAR = "EUR-Lex (text fetched via Publications Office cellar)";

export const draftInstruments: Record<
  string,
  { regime: string; instrument: string; shortName: string; provision: string; mandate: string; jurisdiction: string }
> = {
  // N1
  na_mifid27: {
    regime: "MiFID II",
    instrument: "Directive 2014/65/EU on markets in financial instruments",
    shortName: "MiFID II Art. 27",
    provision: "Art. 27(1), 27(5)",
    mandate: "Take all sufficient steps to obtain the best possible result for client orders.",
    jurisdiction: "EU",
  },
  na_mifir4: {
    regime: "MiFIR",
    instrument: "Regulation (EU) No 600/2014 on markets in financial instruments",
    shortName: "MiFIR Art. 4 waivers",
    provision: "Art. 4(1)",
    mandate: "Competent authorities may waive pre-trade transparency for reference price, negotiated and large-in-scale orders.",
    jurisdiction: "EU",
  },
  // N2
  na_mdr120: {
    regime: "EU MDR",
    instrument: "Regulation (EU) 2017/745 on medical devices",
    shortName: "MDR Art. 120(3)",
    provision: "Art. 120(3) (original text, before amendment by Regulation (EU) 2023/607)",
    mandate: "Legacy-certified devices stay on the market only if there are no significant changes in design and intended purpose.",
    jurisdiction: "EU",
  },
  na_mdrAnnexI17: {
    regime: "EU MDR",
    instrument: "Regulation (EU) 2017/745 on medical devices",
    shortName: "MDR Annex I 17.2",
    provision: "Annex I, Section 17.2",
    mandate: "Device software must be developed to the state of the art, including information security.",
    jurisdiction: "EU",
  },
  na_mdcg2020_3: {
    regime: "EU MDR guidance",
    instrument: "MDCG 2020-3 Rev.1, Guidance on significant changes under Article 120 MDR (May 2023)",
    shortName: "MDCG 2020-3",
    provision: "Software changes, Chart C, non-significant change examples",
    mandate: "Lists security updates as an example of a non-significant software change.",
    jurisdiction: "EU",
  },
  // N3
  na_r155: {
    regime: "UNECE WP.29",
    instrument: "UN Regulation No 155 (cybersecurity and cybersecurity management system)",
    shortName: "UN R155",
    provision: "Para. 7.3.4",
    mandate: "Manufacturer must protect the vehicle type against risks identified in its risk assessment.",
    jurisdiction: "INT",
  },
  na_r156: {
    regime: "UNECE WP.29",
    instrument: "UN Regulation No 156 (software update and software update management system)",
    shortName: "UN R156",
    provision: "Para. 7.2.1.2.3",
    mandate: "Manufacturer must protect RXSWINs and software versions on a vehicle against unauthorised modification.",
    jurisdiction: "INT",
  },
  na_tvr61: {
    regime: "EU vehicle type-approval",
    instrument: "Regulation (EU) 2018/858 on approval and market surveillance of motor vehicles",
    shortName: "2018/858 Art. 61",
    provision: "Art. 61(1)",
    mandate: "Unrestricted, standardised, non-discriminatory access to OBD and RMI for independent operators, including a secure remote facility for security-system operations.",
    jurisdiction: "EU",
  },
  na_sermi: {
    regime: "EU vehicle type-approval",
    instrument: "Commission Delegated Regulation (EU) 2021/1244 (SERMI scheme)",
    shortName: "SERMI",
    provision: "Annex, Appendix (approval and authorisation of independent operators)",
    mandate: "Accredited approval of independent operators and their employees for access to security-related RMI.",
    jurisdiction: "EU",
  },
  // N4
  na_ieepa1702: {
    regime: "US sanctions",
    instrument: "International Emergency Economic Powers Act, 50 U.S.C. § 1702",
    shortName: "IEEPA § 1702",
    provision: "50 U.S.C. § 1702(a)(1)(B)",
    mandate: "President may block transactions involving any property in which a foreign national has any interest.",
    jurisdiction: "US",
  },
  na_vanLoon: {
    regime: "US case law",
    instrument: "Van Loon v. Department of the Treasury, No. 23-50669 (5th Cir. 2024)",
    shortName: "Van Loon",
    provision: "Opinion, Nov. 26, 2024",
    mandate: "Immutable smart contracts are not property and cannot be blocked under IEEPA.",
    jurisdiction: "US",
  },
  na_tornadoDelist: {
    regime: "US sanctions",
    instrument: "US Treasury press release sb0057, Tornado Cash delisting (Mar. 21, 2025)",
    shortName: "Tornado Cash delisting",
    provision: "Press release sb0057",
    mandate: "Treasury removed Tornado Cash from the SDN List.",
    jurisdiction: "US",
  },
  na_genius4a5: {
    regime: "US payment stablecoins",
    instrument: "GENIUS Act, S. 1582 (119th Cong.), enrolled",
    shortName: "GENIUS § 4(a)(5)",
    provision: "§ 4(a)(5)(A)(iv)",
    mandate: "Issuers must have technical capability to block, freeze and reject impermissible transactions.",
    jurisdiction: "US",
  },
  // N5
  na_blocking5: {
    regime: "EU Blocking Statute",
    instrument: "Council Regulation (EC) No 2271/96, with Annex as replaced by Delegated Regulation (EU) 2018/1100",
    shortName: "Blocking Statute Art. 5",
    provision: "Art. 5, first paragraph; Annex (ITSR Act 2012)",
    mandate: "EU persons must not comply with listed US sanctions laws, absent authorisation under Arts 7 and 8.",
    jurisdiction: "EU",
  },
  na_ofac560215: {
    regime: "US sanctions",
    instrument: "Iranian Transactions and Sanctions Regulations, 31 CFR part 560",
    shortName: "31 CFR 560.215",
    provision: "31 CFR 560.215(a)",
    mandate: "Foreign entities owned or controlled by US persons must not transact with the Government of Iran or persons under its jurisdiction.",
    jurisdiction: "US",
  },
  na_bankMelli: {
    regime: "EU case law",
    instrument: "CJEU C-124/20 Bank Melli Iran v Telekom Deutschland (Grand Chamber, 2021)",
    shortName: "Bank Melli",
    provision: "Ruling, point 1",
    mandate: "Art. 5 bars compliance even without a foreign order directing compliance.",
    jurisdiction: "EU",
  },
  // N6
  na_bsa5318k3: {
    regime: "US Bank Secrecy Act",
    instrument: "31 U.S.C. § 5318(k)(3)",
    shortName: "BSA foreign bank subpoena",
    provision: "31 U.S.C. § 5318(k)(3)(A)(i), (iv)(II)",
    mandate: "Foreign banks with US correspondent accounts must produce requested records, including records held abroad.",
    jurisdiction: "US",
  },
  na_cnDsl36: {
    regime: "China Data Security Law",
    instrument: "Data Security Law of the People's Republic of China (2021)",
    shortName: "DSL Art. 36",
    provision: "Art. 36",
    mandate: "No provision of data stored in China to foreign judicial or law enforcement bodies without Chinese approval.",
    jurisdiction: "CN",
  },
  // N7
  na_micaRec22: {
    regime: "MiCA",
    instrument: "Regulation (EU) 2023/1114 on markets in crypto-assets",
    shortName: "MiCA recital 22",
    provision: "Recital 22",
    mandate: "Crypto-asset services provided in a fully decentralised manner without any intermediary are out of scope.",
    jurisdiction: "EU",
  },
  na_mica142: {
    regime: "MiCA",
    instrument: "Regulation (EU) 2023/1114 on markets in crypto-assets",
    shortName: "MiCA Art. 142",
    provision: "Art. 142(2)(a)",
    mandate: "Commission report on decentralised finance and the feasibility of regulating it.",
    jurisdiction: "EU",
  },
  // N8
  na_calCiv56101c: {
    regime: "California CMIA",
    instrument: "California Civil Code § 56.101 (as amended by AB 352 and AB 3281)",
    shortName: "Civ. Code § 56.101(c)",
    provision: "§ 56.101(c)(1)(A)-(D)",
    mandate: "Segregate and geo-restrict medical information related to gender affirming care, abortion and contraception.",
    jurisdiction: "US",
  },
  na_onc171103: {
    regime: "ONC information blocking",
    instrument: "45 CFR part 171",
    shortName: "45 CFR 171.103",
    provision: "45 CFR 171.103(a)",
    mandate: "Practices likely to interfere with access, exchange or use of EHI are information blocking, except as required by law or excepted.",
    jurisdiction: "US",
  },
  // N19
  na_gsr6_4: {
    regime: "EU General Safety Regulation",
    instrument: "Regulation (EU) 2019/2144 on type-approval requirements for motor vehicles (General Safety Regulation)",
    shortName: "GSR Art. 6(4)",
    provision: "Art. 6(4)(a)-(c)",
    mandate: "Event data recorders must record pre-crash data with high accuracy, cannot be deactivated, and the data must be anonymised.",
    jurisdiction: "EU",
  },
  na_gsr6_5: {
    regime: "EU General Safety Regulation",
    instrument: "Regulation (EU) 2019/2144 on type-approval requirements for motor vehicles (General Safety Regulation)",
    shortName: "GSR Art. 6(5)",
    provision: "Art. 6(5)",
    mandate: "EDR must not be capable of storing information that could identify the vehicle, its owner or holder.",
    jurisdiction: "EU",
  },
  na_gsrRec14: {
    regime: "EU General Safety Regulation",
    instrument: "Regulation (EU) 2019/2144 on type-approval requirements for motor vehicles (General Safety Regulation)",
    shortName: "GSR recital 14",
    provision: "Recital 14",
    mandate: "Processing of personal data in EDRs must comply with GDPR.",
    jurisdiction: "EU",
  },
  // N20
  na_mica49: {
    regime: "MiCA",
    instrument: "Regulation (EU) 2023/1114 on markets in crypto-assets",
    shortName: "MiCA Art. 49",
    provision: "Art. 49(4)",
    mandate: "E-money token issuers must redeem at par, at any time, on holder request.",
    jurisdiction: "EU",
  },
  na_genius3b2: {
    regime: "US payment stablecoins",
    instrument: "GENIUS Act, S. 1582 (119th Cong.), enrolled",
    shortName: "GENIUS § 3(b)(2)",
    provision: "§ 3(b)(2); § 2(16) (lawful order)",
    mandate: "Foreign issuers' stablecoins may be made available in the US only if the issuer can and will comply with any lawful order, including freeze and burn orders.",
    jurisdiction: "US",
  },
};

export const draftVerifications: Record<string, Verification> = {
  na_mifid27: {
    status: "verified",
    url: eurlex("32014L0065"),
    publisher: CELLAR,
    quote:
      "Member States shall require that investment firms take all sufficient steps to obtain, when executing orders, the best possible result for their clients taking into account price, costs, speed, likelihood of execution and settlement, size, nature or any other consideration relevant to the execution of the order.",
    note: "Art. 27(1). Art. 27(5): the execution policy 'shall at least include those venues that enable the investment firm to obtain on a consistent basis the best possible result for the execution of client orders.' The duty is to take sufficient steps, judged as a process.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_mifir4: {
    status: "verified",
    url: eurlex("32014R0600"),
    publisher: CELLAR,
    quote:
      "Competent authorities shall be able to waive the obligation for market operators and investment firms operating a trading venue to make public the information referred to in Article 3(1) for:",
    note: "Art. 4(1). Waiver grounds include reference price systems, negotiated transactions and 'orders that are large in scale compared with normal market size'.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_mdr120: {
    status: "verified",
    url: eurlex("32017R0745"),
    publisher: CELLAR,
    quote:
      "may only be placed on the market or put into service provided that from the date of application of this Regulation it continues to comply with either of those Directives, and provided there are no significant changes in the design and intended purpose.",
    provision: "Art. 120(3) (original 2017 text)",
    note: "Quoted from the original text of Regulation 2017/745. Art. 120 was later amended by Regulation (EU) 2023/607; paragraph numbering in the consolidated text was not checked.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_mdrAnnexI17: {
    status: "verified",
    url: eurlex("32017R0745"),
    publisher: CELLAR,
    quote:
      "For devices that incorporate software or for software that are devices in themselves, the software shall be developed and manufactured in accordance with the state of the art taking into account the principles of development life cycle, risk management, including information security, verification and validation.",
    note: "Annex I, Section 17.2.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_mdcg2020_3: {
    status: "verified",
    url: "https://health.ec.europa.eu/document/download/800e8e87-d4eb-4cc5-b5ad-07a9146d7c90_en?filename=mdcg_2020-3_en_1.pdf",
    publisher: "European Commission, Medical Device Coordination Group",
    quote: "security update (e.g. cyber-security enhancements, longevity calculations);",
    note: "MDCG 2020-3 Rev.1 (May 2023), Software changes, Chart C, listed under 'Non-significant change: Examples'. Guidance, not binding law.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_r155: {
    status: "verified",
    url: eurlex("42021X0387"),
    publisher: CELLAR,
    quote:
      "The vehicle manufacturer shall protect the vehicle type against risks identified in the vehicle manufacturer’s risk assessment. Proportionate mitigations shall be implemented to protect the vehicle type.",
    note: "UN Regulation No 155 as published in OJ L 82 [2021/387], para. 7.3.4. Para. 7.3.5 also requires measures to secure dedicated environments for aftermarket software. unece.org blocked automated fetch; the OJ publication was used.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_r156: {
    status: "verified",
    url: eurlex("42021X0388"),
    publisher: CELLAR,
    quote:
      "The vehicle manufacturer shall protect the RXSWINs and/or software version(s) on a vehicle against unauthorised modification.",
    note: "UN Regulation No 156 as published in OJ [2021/388], para. 7.2.1.2.3. Para. 7.2.1.1: 'The authenticity and integrity of software updates shall be protected to reasonably prevent their compromise and reasonably prevent invalid updates.'",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_tvr61: {
    status: "verified",
    url: eurlex("32018R0858"),
    publisher: CELLAR,
    quote:
      "Manufacturers shall provide a standardised, secure and remote facility to enable independent repairers to complete operations that involve access to the vehicle security system.",
    note: "Art. 61(1), second subparagraph. First subparagraph requires 'unrestricted, standardised and non-discriminatory access to vehicle OBD information, diagnostic and other equipment, tools including the complete references, and available downloads, of the applicable software and vehicle repair and maintenance information.'",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_sermi: {
    status: "verified",
    url: eurlex("32021R1244"),
    publisher: CELLAR,
    quote:
      "This Appendix contains the requirements for the purposes of approval and authorisation of independent operators requiring access to security-related vehicle repair and maintenance information (RMI).",
    note: "Delegated Regulation 2021/1244, Annex. Recitals tie the scheme to the 2016 SERMI accreditation scheme and the Art. 66 Forum on Access to Vehicle Information.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_ieepa1702: {
    status: "verified",
    url: "https://www.law.cornell.edu/uscode/text/50/1702",
    publisher: "Cornell LII",
    quote:
      "investigate, block during the pendency of an investigation, regulate, direct and compel, nullify, void, prevent or prohibit, any acquisition, holding, withholding, use, transfer, withdrawal, transportation, importation or exportation of, or dealing in, or exercising any right, power, or privilege with respect to, or transactions involving, any property in which any foreign country or a national thereof has any interest by any person, or with respect to any property, subject to the jurisdiction of the United States",
    note: "50 U.S.C. § 1702(a)(1)(B).",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_vanLoon: {
    status: "verified",
    url: "https://www.ca5.uscourts.gov/opinions/pub/23/23-50669-CV0.pdf",
    publisher: "US Court of Appeals for the Fifth Circuit",
    quote: "The immutable smart contracts at issue in this appeal are not property because they are not capable of being owned.",
    note: "Opinion of Nov. 26, 2024. The court also notes the contracts 'remain available for anyone to use' even under sanctions.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_tornadoDelist: {
    status: "verified",
    url: "https://home.treasury.gov/news/press-releases/sb0057",
    publisher: "US Department of the Treasury",
    quote: "Based on the Administration's review of the novel legal and policy issues raised by use of financial sanctions",
    note: "Partial quote only; the full page could not be fetched in one piece. Release dated Mar. 21, 2025, announcing removal of Tornado Cash from the SDN List as a matter of discretion. Reports that sanctions on individuals were kept were not verified from the primary source.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_genius4a5: {
    status: "verified",
    url: "https://www.govinfo.gov/content/pkg/BILLS-119s1582enr/html/BILLS-119s1582enr.htm",
    publisher: "GovInfo (US Government Publishing Office)",
    quote:
      "technical capabilities, policies, and procedures to block, freeze, and reject specific or impermissible transactions that violate Federal or State laws, rules, or regulations;",
    note: "§ 4(a)(5)(A)(iv), enrolled bill text.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_blocking5: {
    status: "verified",
    url: eurlex("31996R2271"),
    publisher: CELLAR,
    quote:
      "No person referred to in Article 11 shall comply, whether directly or through a subsidiary or other intermediary person, actively or by deliberate omission, with any requirement or prohibition, including requests of foreign courts, based on or resulting, directly or indirectly, from the laws specified in the Annex or from actions based thereon or resulting therefrom.",
    note: "Art. 5, first paragraph. Art. 11 covers 'any legal person incorporated within the Community'. The Annex as replaced by Delegated Regulation 2018/1100 (CELEX 32018R1100) lists the Iran Threat Reduction and Syria Human Rights Act of 2012 and the ITSR, with the required compliance described as not to 'engage in any transaction directly or indirectly with the Government of Iran or any person subject to the jurisdiction of the Government of Iran prohibited by US law (applies to foreign subsidiaries owned or controlled by US persons)'.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_ofac560215: {
    status: "verified",
    url: "https://www.ecfr.gov/current/title-31/subtitle-B/chapter-V/part-560/subpart-B/section-560.215",
    publisher: "eCFR",
    quote:
      "Except as otherwise authorized pursuant to this part, an entity that is owned or controlled by a United States person and established or maintained outside the United States is prohibited from knowingly engaging in any transaction, directly or indirectly, with the Government of Iran or any person subject to the jurisdiction of the Government of Iran that would be prohibited pursuant to this part if engaged in by a United States person or in the United States.",
    note: "31 CFR 560.215(a).",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_bankMelli: {
    status: "verified",
    url: eurlex("62020CJ0124"),
    publisher: CELLAR,
    quote:
      "must be interpreted as prohibiting persons referred to in Article 11 of Regulation No 2271/96, as amended, from complying with the requirements or prohibitions laid down in the laws specified in the annex to that regulation, even in the absence of an order directing compliance issued by the administrative or judicial authorities of the third countries which adopted those laws.",
    note: "Ruling, point 1. Point 2: an EU person may terminate contracts with a listed person without giving reasons, but in civil proceedings bears the burden of showing it did not act to comply with the listed laws.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_bsa5318k3: {
    status: "verified",
    url: "https://www.law.cornell.edu/uscode/text/31/5318",
    publisher: "Cornell LII",
    quote:
      "An assertion that compliance with a subpoena described in clause (i) would conflict with a provision of foreign secrecy or confidentiality law shall not be a sole basis for quashing or modifying the subpoena.",
    note: "31 U.S.C. § 5318(k)(3)(A)(iv)(II). Clause (i) lets Treasury or the Attorney General subpoena 'any foreign bank that maintains a correspondent account in the United States' for records 'including records maintained outside of the United States'. Clause (ii): the bank 'shall produce all requested records'.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_cnDsl36: {
    status: "verified",
    url: "http://www.npc.gov.cn/englishnpc/c2759/c23934/202112/t20211209_385109.html",
    publisher: "National People's Congress (official English translation)",
    quote:
      "Without the approval of the competent authorities of the People's Republic of China, organizations or individuals in the People's Republic of China shall not provide data stored within the territory of the People's Republic of China to any overseas judicial or law enforcement body.",
    note: "Art. 36, second sentence. First sentence routes foreign requests through Chinese authorities under treaties or 'the principles of equality and reciprocity'.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_micaRec22: {
    status: "verified",
    url: eurlex("32023R1114"),
    publisher: CELLAR,
    quote:
      "Where crypto-asset services are provided in a fully decentralised manner without any intermediary, they should not fall within the scope of this Regulation.",
    note: "Recital 22. The preceding sentence keeps in scope services performed 'directly or indirectly' by persons 'including when part of such activities or services is performed in a decentralised manner'. The recital has no operative article counterpart.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_mica142: {
    status: "verified",
    url: eurlex("32023R1114"),
    publisher: CELLAR,
    quote:
      "an assessment of the development of decentralised-finance in markets in crypto-assets and of the appropriate regulatory treatment of decentralised crypto-asset systems without an issuer or crypto-asset service provider, including an assessment of the necessity and feasibility of regulating decentralised finance;",
    note: "Art. 142, report contents.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_calCiv56101c: {
    status: "verified",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=56.101",
    publisher: "California Legislative Information",
    quote:
      "Segregate medical information related to gender affirming care, abortion and abortion-related services, and contraception from the rest of the patient's record.",
    note: "§ 56.101(c)(1)(C). (c)(1)(B): 'Prevent the disclosure, access, transfer, transmission, or processing of medical information related to gender affirming care, abortion and abortion-related services, and contraception to persons and entities outside of this state in accordance to this part.' (c)(1)(D): automatically disable access to segregated information by individuals and entities in another state. (c)(4) excludes certain contractors, plans and providers. Amended by Stats. 2024, ch. 853 (AB 3281). Page text read via browser; site blocks automated fetch.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_onc171103: {
    status: "verified",
    url: "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-D/part-171/subpart-A/section-171.103",
    publisher: "eCFR",
    quote:
      "Information blocking means a practice that except as required by law or covered by an exception set forth in subparts B, C, or D of this part, is likely to interfere with access, exchange, or use of electronic health information",
    note: "45 CFR 171.103(a).",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_gsr6_4: {
    status: "verified",
    url: eurlex("32019R2144"),
    publisher: CELLAR,
    quote: "the data that they collect is anonymised and protected against manipulation and misuse",
    note: "Art. 6(4)(c)(ii). Art. 6(4)(a) requires recording 'the vehicle's speed, braking, position and tilt of the vehicle on the road, the state and rate of activation of all its safety systems' with 'high level of accuracy and ensured survivability of data'. Art. 6(4)(b): 'they cannot be deactivated'. Art. 6(4)(c)(iii) requires the data to identify vehicle type, variant and version.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_gsr6_5: {
    status: "verified",
    url: eurlex("32019R2144"),
    publisher: CELLAR,
    quote:
      "An event data recorder shall not be capable of recording and storing the last four digits of the vehicle indicator section of the vehicle identification number or any other information which could allow the individual vehicle itself, its owner or holder, to be identified.",
    note: "Art. 6(5). Recital 13 frames the goal as use 'without the possibility of identifying the owner or the holder of a particular vehicle on the basis of the stored data.'",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_gsrRec14: {
    status: "verified",
    url: eurlex("32019R2144"),
    publisher: CELLAR,
    quote:
      "Any processing of personal data, such as information about the driver processed in event data recorders ... should be carried out in accordance with ... Regulation (EU) 2016/679",
    note: "Recital 14, elided. The recital treats EDR content as personal data, which conflicts with the Art. 6(4)(c)(ii) claim that it is anonymised.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_mica49: {
    status: "verified",
    url: eurlex("32023R1114"),
    publisher: CELLAR,
    quote:
      "Upon request by a holder of an e-money token, the issuer of that e-money token shall redeem it, at any time and at par value, by paying in funds, other than electronic money, the monetary value of the e-money token held to the holder of the e-money token.",
    note: "Art. 49(4). Art. 49(2): 'Holders of e-money tokens shall have a claim against the issuers of those e-money tokens.' Art. 49 contains no exception for foreign freeze orders.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
  na_genius3b2: {
    status: "verified",
    url: "https://www.govinfo.gov/content/pkg/BILLS-119s1582enr/html/BILLS-119s1582enr.htm",
    publisher: "GovInfo (US Government Publishing Office)",
    quote:
      "It shall be unlawful for any digital asset service provider to offer, sell, or otherwise make available in the United States a payment stablecoin issued by a foreign payment stablecoin issuer unless the foreign payment stablecoin issuer has the technological capability to comply, and will comply, with the terms of any lawful order and any reciprocal arrangement pursuant to section 18.",
    note: "§ 3(b)(2). § 2(16) defines a lawful order to include one that 'requires a person to seize, freeze, burn, or prevent the transfer of payment stablecoins issued by the person'. § 18 allows a Treasury comparability determination for foreign regimes.",
    verifiedBy: BY,
    verifiedAt: AT,
  },
};

const R = `Drafted by claude-opus-5-5. ${SIGNOFF_NOTE}`;

export const draftCases: SeedCase[] = [
  {
    ref: "N1",
    title: "Best Execution vs. Dark Pools",
    statement:
      "MiFID II requires firms to seek the best possible result for client orders. Dark pools withhold the pre-trade prices a router would need to prove it found that result.",
    analysis:
      "Art. 27(1) is a process duty: take 'all sufficient steps'. It is judged ex post against the execution policy, not per order against an unseen book. MiFIR Art. 4 lets authorities waive pre-trade transparency, so the law itself expects venues the router cannot see. A firm satisfies both by routing to dark venues on IOIs or midpoint pegs, then proving outcomes with post-trade TCA. That costs money. It doesn't break either rule.",
    shapes: ["deliberate-blindness"],
    shapeRationale: `The firm must optimize over prices a permitted venue hides from it. ${R}`,
    resolvability: "resolvable_costly",
    resolution: "engineering",
    resolvedBy: "Smart order routing with post-trade transaction cost analysis against the execution policy.",
    inclusionVerdict: "fails",
    inclusionReasoning:
      "Art. 27 asks for sufficient steps, not the best price in every hidden book. Post-trade TCA plus a documented venue policy meets it, and regulators accept that approach.",
    instruments: [
      { key: "na_mifid27", role: "mandating" },
      { key: "na_mifir4", role: "context", note: "Dark trading is lawful through the pre-trade waivers." },
    ],
    property: {
      name: "Per-order best price",
      text: "For each order, the firm knows the best available price across all venues at execution time.",
      defeat: "Dark venues publish no pre-trade quotes, so the cross-venue best price is unknowable at decision time.",
    },
    paperingOvers: [
      {
        technique: "SOR with post-trade TCA",
        description: "Route to lit and dark venues by policy, then measure fills against post-trade benchmarks and adjust venue rankings.",
        standing: "endorsed_by_regulator",
        residual: "Per-order optimality is never proven. Only aggregate outcomes are.",
      },
    ],
  },
  {
    ref: "N2",
    title: "MDR Recertification vs. Patch Cadence",
    statement:
      "Legacy MDD devices stay on the EU market only without significant design changes. Security patches change the design. Annex I requires state-of-the-art information security.",
    analysis:
      "The lead assumes every patch triggers recertification. MDCG 2020-3 Rev.1 lists 'security update (e.g. cyber-security enhancements ...)' as a non-significant software change. A manufacturer can ship patches under the legacy certificate if the change doesn't alter intended purpose or add functions. The residual cost is change-control evidence per patch, which is ordinary QMS work.",
    shapes: ["mandate-mutation"],
    shapeRationale: `Security law requires mutation; transitional certification freezes the design. MDCG guidance carves patches out of 'significant'. ${R}`,
    resolvability: "resolvable_costly",
    resolvedBy: "MDCG 2020-3 Rev.1 classifies security updates as non-significant changes.",
    inclusionVerdict: "fails",
    inclusionReasoning:
      "Coordination-group guidance treats security updates as non-significant, so patching doesn't cost the legacy certificate. Patches that add features still do, but that is a choice.",
    instruments: [
      { key: "na_mdr120", role: "mandating" },
      { key: "na_mdrAnnexI17", role: "conflicting" },
      { key: "na_mdcg2020_3", role: "context", note: "Non-binding guidance that resolves the conflict for pure security updates." },
    ],
    property: {
      name: "Frozen certified design",
      text: "The device on the market matches the design assessed under the legacy certificate.",
      defeat: "Any code change, including a security fix, departs from the assessed design.",
    },
    paperingOvers: [
      {
        technique: "Non-significant change classification",
        description: "Document each security patch against MDCG 2020-3 Chart C and ship it without new conformity assessment.",
        standing: "endorsed_by_regulator",
        residual: "Patches that need new features or a changed OS architecture still fall outside the carve-out.",
      },
    ],
  },
  {
    ref: "N3",
    title: "Vehicle Cybersecurity vs. Independent Repair",
    statement:
      "UN R155 and R156 require manufacturers to protect vehicle software against unauthorised modification. EU type-approval law requires them to give independent repairers access to the vehicle security system.",
    analysis:
      "The two rules use the same trust root. Reg 2018/858 Art. 61(1) requires a 'standardised, secure and remote facility' for security-system operations, and Delegated Reg 2021/1244 sets up SERMI accreditation for independent operators and their staff. The repairer gets OEM-signed operations through an authenticated channel. That counts as authorised modification under R156. The cost is accreditation and OEM portal fees.",
    shapes: ["trust-root-plurality"],
    shapeRationale: `Two parties need write access to one signed software stack. SERMI makes the OEM the single root and authorises repairers beneath it. ${R}`,
    resolvability: "resolvable_costly",
    resolution: "legislative",
    resolvedBy: "Reg 2018/858 Art. 61 remote security facility plus SERMI accreditation (Delegated Reg 2021/1244).",
    inclusionVerdict: "fails",
    inclusionReasoning:
      "Accredited repairers get OEM-signed access, which satisfies both R156 integrity and Art. 61 access. Owner self-repair without accreditation remains blocked, but EU law doesn't mandate it for vehicles.",
    instruments: [
      { key: "na_r155", role: "mandating" },
      { key: "na_r156", role: "mandating" },
      { key: "na_tvr61", role: "conflicting" },
      { key: "na_sermi", role: "context", note: "Accreditation scheme that resolves the conflict for independent operators." },
    ],
    property: {
      name: "Single-signer firmware",
      text: "Only manufacturer-authorised parties can change security-relevant vehicle software.",
      defeat: "Independent repairers need to perform security-system operations.",
    },
    paperingOvers: [
      {
        technique: "SERMI-accredited remote access",
        description: "Independent operators are approved by accredited bodies and use the OEM's secure remote facility to run signed operations.",
        standing: "endorsed_by_regulator",
        residual: "Unaccredited owners and repairers have no path. Availability depends on OEM portal uptime and pricing.",
      },
    ],
  },
  {
    ref: "N4",
    title: "Sanctions Blocking vs. Immutable Contracts",
    statement:
      "IEEPA lets the US block property in which a sanctioned national has any interest. An immutable smart contract has no owner who can stop it, so no one can make it comply.",
    analysis:
      "OFAC listed Tornado Cash contract addresses in 2022. The Fifth Circuit held in Van Loon that the immutable contracts are not property and can't be blocked, noting they 'remain available for anyone to use' under sanctions. Treasury delisted Tornado Cash in March 2025. The GENIUS Act took the opposite route for stablecoins: issuers must build freeze and block capability, so they can't deploy immutable contracts. The law now requires mutability for one class of contract and can't reach another.",
    shapes: ["mandate-mutation", "deliberate-blindness"],
    shapeRationale: `Sanctions presume a controller who can stop a transfer. Immutable code has none. Secondary: the deployer can't see or screen counterparties. ${R}`,
    resolvability: "unresolvable",
    resolution: "judicial",
    resolvedBy: "Van Loon v. Department of the Treasury (5th Cir. 2024), followed by Treasury's March 2025 delisting.",
    inclusionVerdict: "passes",
    inclusionReasoning:
      "No engineer can add a block function to a deployed contract with no upgrade path. The court resolved it by narrowing the law's reach. The architecture didn't change.",
    instruments: [
      { key: "na_ieepa1702", role: "mandating" },
      { key: "na_vanLoon", role: "conflicting", note: "Holds immutable contracts are not property under IEEPA." },
      { key: "na_tornadoDelist", role: "context" },
      { key: "na_genius4a5", role: "context", note: "Legislative response for stablecoins: freeze capability is mandatory." },
    ],
    property: {
      name: "Immutability",
      text: "Deployed contract code and its state transitions cannot be changed or halted by any party.",
      defeat: "A blocking order requires someone able to stop the transaction.",
    },
    paperingOvers: [
      {
        technique: "Front-end and RPC screening",
        description: "Block sanctioned addresses at web interfaces, RPC providers and relayers.",
        standing: "untested",
        residual: "Anyone can call the contract directly. Screening covers convenience paths only.",
      },
      {
        technique: "Mandated admin keys",
        description: "Require freeze or pause functions in contracts at deployment, as GENIUS does for payment stablecoins.",
        standing: "endorsed_by_regulator",
        residual: "Applies only to new, regulated issuers. Existing immutable contracts stay out of reach.",
      },
    ],
  },
  {
    ref: "N5",
    title: "EU Blocking Statute vs. OFAC Iran Rules",
    statement:
      "An EU subsidiary of a US company must not deal with Iran under 31 CFR 560.215. The EU Blocking Statute forbids it from complying with that rule.",
    analysis:
      "Delegated Reg 2018/1100 lists the ITRSHRA and ITSR in the Blocking Statute Annex. Bank Melli held that Art. 5 applies even without a US order directing compliance. Refusing an Iranian counterparty because of US law breaches Art. 5. Dealing with it breaches 560.215. Bank Melli lets the subsidiary terminate without reasons but puts the burden on it in civil proceedings to show the motive wasn't US compliance. Its screening system logs the US list hit, which is the evidence.",
    shapes: ["sovereign-contradiction", "deliberate-blindness"],
    shapeRationale: `Two sovereigns give opposite orders to one entity on one transaction. Secondary: the screening log that proves US compliance is the record that proves EU breach. ${R}`,
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    inclusionReasoning:
      "Every action on the transaction violates one regime. Commission authorisation under Art. 5 second paragraph is discretionary and case by case, so it is not a technique an engineer can apply.",
    instruments: [
      { key: "na_ofac560215", role: "mandating" },
      { key: "na_blocking5", role: "conflicting" },
      { key: "na_bankMelli", role: "context" },
    ],
    property: {
      name: "Single compliance decision",
      text: "A transaction screening system returns one decision per counterparty that satisfies all applicable law.",
      defeat: "The same counterparty produces opposite required outcomes under US and EU law.",
    },
    paperingOvers: [
      {
        technique: "Art. 5 authorisation",
        description: "Apply to the Commission for authorisation to comply with the listed US law.",
        standing: "endorsed_by_regulator",
        residual: "Granted case by case. No standing authorisation for routine screening.",
      },
      {
        technique: "Commercial-reason exits",
        description: "Exit Iran-linked business under a documented risk appetite policy that doesn't cite US law.",
        standing: "litigated_unresolved",
        residual: "Bank Melli puts the burden on the EU entity. Screening logs keyed to SDN lists undercut the stated reason.",
      },
    ],
  },
  {
    ref: "N6",
    title: "US Correspondent Subpoenas vs. China Data Export",
    statement:
      "A foreign bank with a US correspondent account must produce records held abroad when Treasury subpoenas them. China's Data Security Law forbids giving data stored in China to foreign law enforcement without approval.",
    analysis:
      "§ 5318(k)(3)(A)(iv)(II) says a foreign secrecy conflict 'shall not be a sole basis' to quash. DSL Art. 36 routes foreign requests through Chinese authorities and bans direct provision without approval. A Chinese bank holding the records in China can't produce without approval and can't refuse without contempt or loss of the correspondent account. Data residency is the architecture the DSL demands, and it is what puts the records out of reach.",
    shapes: ["sovereign-contradiction"],
    shapeRationale: `Each statute anticipates the other and declines to yield. ${R}`,
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    inclusionReasoning:
      "No storage design satisfies both. Mirroring the data offshore breaches Chinese law. Keeping it onshore blocks production. Approval is a government decision, not a technique.",
    instruments: [
      { key: "na_bsa5318k3", role: "mandating" },
      { key: "na_cnDsl36", role: "conflicting" },
    ],
    property: {
      name: "Producible records",
      text: "A bank can produce any record it holds to any authority with jurisdiction over it.",
      defeat: "Production to one sovereign is a criminal or regulatory breach under the other.",
    },
    paperingOvers: [
      {
        technique: "Treaty or approval channel",
        description: "Route the request through MLAA channels or seek Chinese approval under DSL Art. 36.",
        standing: "untested",
        residual: "The BSA subpoena has its own deadline and does not wait for approval. Approval may be refused.",
      },
    ],
  },
  {
    ref: "N7",
    title: "MiCA Scope vs. Partial Decentralisation",
    statement:
      "MiCA excludes crypto-asset services provided 'in a fully decentralised manner without any intermediary'. Decentralisation is a continuum, and the text gives no test for where 'fully' starts.",
    analysis:
      "Recital 22 keeps services in scope when only part is decentralised. Real protocols mix immutable contracts, upgradeable proxies, admin multisigs, token-weighted governance with concentrated holders, and hosted front-ends. Each component moves the protocol along the scale. No article defines the threshold, and Art. 142 asks the Commission to assess the question later. A team can't design to the boundary because the boundary isn't defined.",
    shapes: ["binary-continuum"],
    shapeRationale: `An in-or-out scope rule is applied to a property that varies by degree and by component. ${R}`,
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    inclusionReasoning:
      "No engineering choice short of full immutability with no front-end can show the protocol is 'fully' decentralised. Even that is untested. The law sets a binary and supplies no measurement.",
    instruments: [
      { key: "na_micaRec22", role: "mandating" },
      { key: "na_mica142", role: "context", note: "Defers the DeFi question to a Commission report." },
    ],
    property: {
      name: "Measurable decentralisation",
      text: "A protocol can show which side of the MiCA scope line it is on.",
      defeat: "The line is a recital phrase with no operative definition or metric.",
    },
    paperingOvers: [
      {
        technique: "Progressive decentralisation",
        description: "Renounce admin keys, hand governance to token holders and let third parties host front-ends.",
        standing: "untested",
        residual: "Governance token concentration and front-end operators can still be called intermediaries.",
      },
    ],
  },
  {
    ref: "N8",
    title: "Sensitive Care Segregation vs. Clinical Records",
    statement:
      "California requires segregating and geo-restricting medical information 'related to' abortion, gender affirming care and contraception. Relatedness in a clinical record is a matter of inference, not a field.",
    analysis:
      "§ 56.101(c)(1) demands four capabilities: restricted access, no out-of-state disclosure, segregation from the rest of the record, and automatic disablement for out-of-state users. Misoprostol and methotrexate have other indications. An hCG lab, an ultrasound, a pharmacy refill, a problem-list entry or a free-text note can each be related or unrelated depending on context. A tagger has false negatives, which leak protected data out of state. It also has false positives, which hide clinically needed data from out-of-state treating clinicians. Federal information-blocking rules mostly defer to state law through the 'required by law' clause, so the hard part is classification.",
    shapes: ["binary-continuum", "sovereign-contradiction"],
    shapeRationale: `The statute draws a segregation boundary around a relation that is probabilistic and context-dependent. Secondary: state geo-restriction meets national data exchange. ${R}`,
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    inclusionReasoning:
      "No classifier can decide 'related to' with certainty from the record, and both error directions cause legal or clinical harm. Exclusions in (c)(4) narrow who is covered but not the classification problem.",
    instruments: [
      { key: "na_calCiv56101c", role: "mandating" },
      { key: "na_onc171103", role: "context", note: "Defers to state law, so federal conflict is limited." },
    ],
    property: {
      name: "Clean record partition",
      text: "Every record element is either sensitive-care information or not, and can be stored on one side of a boundary.",
      defeat: "Many elements are related only under some interpretations, and the same element serves other care.",
    },
    paperingOvers: [
      {
        technique: "Code-list tagging",
        description: "Tag encounters by diagnosis, procedure and medication code lists, then restrict tagged data by user location.",
        standing: "untested",
        residual: "Free text, multi-use drugs and labs escape the code lists. Over-tagging hides data from treating clinicians.",
      },
    ],
    sources: [{ label: "45 CFR 171.206 (Protecting Care Access exception)", note: "Named in analysis context only; text not quoted." }],
  },
  {
    ref: "N19",
    title: "EDR Anonymity vs. Crash Trace",
    statement:
      "The EU General Safety Regulation requires event data recorders that capture precise pre-crash data and can't be deactivated. It also requires that data to be 'anonymised' and unable to identify the vehicle.",
    analysis:
      "Art. 6(4)(a) requires speed, braking, position and safety-system activation at high accuracy. Art. 6(4)(c)(iii) requires the data to identify type, variant and version. Art. 6(5) forbids storing anything 'which could allow the individual vehicle itself, its owner or holder, to be identified'. The EDR sits in a specific car that is towed, inspected and linked to a police report. A precise crash trace from a known wreck identifies the driver. Recital 14 concedes the point by applying GDPR to 'information about the driver processed in event data recorders'. Removing the VIN digits doesn't make the trace anonymous.",
    shapes: ["binary-continuum", "verification-minimization"],
    shapeRationale: `The law labels data anonymous while requiring the precision and vehicle linkage that make it identifying. Secondary: accident analysis needs to tie the record to its vehicle, which Art. 6(5) forbids. ${R}`,
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    inclusionReasoning:
      "Any reduction in precision breaches Art. 6(4)(a). Any record precise enough to meet it, read from an identified wreck, is personal data. Recital 13 limits the claim to 'the stored data' alone, but that reading conflicts with recital 14 and with how EDR data is read in practice.",
    instruments: [
      { key: "na_gsr6_4", role: "mandating" },
      { key: "na_gsr6_5", role: "conflicting" },
      { key: "na_gsrRec14", role: "context", note: "Concedes EDR data is personal data." },
      { key: "gdprAnon", role: "context", note: "Anonymisation standard the 'anonymised' label is measured against." },
    ],
    property: {
      name: "Anonymous crash record",
      text: "The stored EDR data cannot be linked to a vehicle, owner or holder.",
      defeat: "The record is read from a physically identified vehicle and is precise enough to single out the event.",
    },
    paperingOvers: [
      {
        technique: "Identifier stripping",
        description: "Omit VIN serial digits and owner fields from the EDR record.",
        standing: "endorsed_by_regulator",
        residual: "Linkage comes from the physical vehicle and the incident, not from stored identifiers.",
      },
    ],
  },
  {
    ref: "N20",
    title: "Stablecoin Burn Orders vs. MiCA Redemption",
    statement:
      "A foreign stablecoin can be sold in the US only if its issuer will comply with any US lawful order to freeze or burn. MiCA requires an e-money token issuer to redeem at par, at any time, on the holder's request.",
    analysis:
      "Dual-market issuers run one fungible token contract with one blacklist. A US court or agency orders the issuer to freeze or burn tokens held by an EU holder who is not under EU sanctions. MiCA Art. 49(4) gives that holder a redemption right with no exception for foreign orders. Paying out defeats the US order. Refusing breaches MiCA. If the order rests on a law in the Blocking Statute Annex, compliance also breaches EU law directly. Splitting into per-jurisdiction tokens breaks fungibility, which is the product.",
    shapes: ["sovereign-contradiction", "mandate-mutation"],
    shapeRationale: `One issuer, one token, two sovereigns with opposite instructions on the same balance. Secondary: GENIUS requires a global mutability control that MiCA redemption rights don't recognise. ${R}`,
    resolvability: "unresolvable",
    inclusionVerdict: "passes",
    inclusionReasoning:
      "No contract design honours a freeze for US purposes and a par redemption for EU purposes on the same token. A § 18 comparability determination or reciprocal arrangement could resolve it legislatively. None exists today.",
    instruments: [
      { key: "na_genius3b2", role: "mandating" },
      { key: "na_mica49", role: "conflicting" },
      { key: "na_genius4a5", role: "context" },
      { key: "na_blocking5", role: "context", note: "Applies when the order rests on an Annex-listed law." },
    ],
    property: {
      name: "Fungible cross-border token",
      text: "One token is redeemable and transferable on the same terms in every market it is sold in.",
      defeat: "The US requires a freeze or burn the EU redemption right overrides.",
    },
    paperingOvers: [
      {
        technique: "Per-jurisdiction token split",
        description: "Issue separate tokens for EU and US markets with separate contracts and reserves.",
        standing: "untested",
        residual: "Tokens stop being fungible across markets, and holders can bridge or swap between them.",
      },
    ],
  },
];
