import { LegalCaseFAQ } from '../components/public/PublicFAQSection';

export interface LawCategory {
  id: string;
  labelTagalog: string;
  sublabelEnglish: string;
  descriptionTagalog: string;
}

export const LAW_CATEGORY_TABS = [
  {
    id: 'CORE_15',
    labelTagalog: '15 Pangunahing Kaso (Main 15 Cases)',
    sublabelEnglish: 'Original 15 Core Cases',
    descriptionTagalog: 'Ang 15 pangunahing kaso (Estafa, Theft, Swindling, Robbery, Qualified Theft, Libel, Cyber Libel, Criminal, Civil, Homicide, Attempted Homicide, Alarm & Scandal, Physical Injury, Damage to Property, at Murder).',
  },
  {
    id: 'ALL',
    labelTagalog: 'Lahat ng Kaso sa Pilipinas',
    sublabelEnglish: 'Complete Philippine Law Directory',
    descriptionTagalog: 'Kompletong listahan ng lahat ng kasong Kriminal, Sibil, VAWC, Cybercrime, at Special Laws sa Pilipinas.',
  },
  {
    id: 'CIVIL_CRIMINAL_BARANGAY',
    labelTagalog: 'Civil vs. Criminal at Barangay vs. Pulis',
    sublabelEnglish: 'Jurisdiction & Legal Classification Rules',
    descriptionTagalog: 'Opisyal na batayan sa batas kung kailan Sibil o Kriminal ang kaso, at kailan kailangang dumaan sa Barangay Lupon (RA 7160) o diretso na sa Pulis at Piskalya.',
  },
  {
    id: 'VAWC_WCPD',
    labelTagalog: 'VAWC, Kababaihan at Bata (WCPD)',
    sublabelEnglish: 'RA 9262, RA 7610, Rape, Safe Spaces',
    descriptionTagalog: 'Mga kasong hawak ng Women and Children Protection Desk (WCPD) para sa proteksyon ng kababaihan at menor de edad.',
  },
  {
    id: 'PERSONS_LIBERTY_HONOR',
    labelTagalog: 'Buhay, Pananakot at Puri (RPC)',
    sublabelEnglish: 'Threats, Coercion, Vexation, Slander, Parricide',
    descriptionTagalog: 'Mga krimen laban sa buhay, kalayaan, seguridad, at dangal sa ilalim ng Revised Penal Code.',
  },
  {
    id: 'PROPERTY_CHECKS_TRAFFIC',
    labelTagalog: 'Tseke (BP 22), Sasakyan at Ari-arian',
    sublabelEnglish: 'BP 22, Carnapping, Fencing, Arson, Traffic',
    descriptionTagalog: 'Mga kaso sa tumalbog na tseke, nakaw na sasakyan, pagbili ng nakaw na gamit, sunog, at aksidente sa kalsada.',
  },
  {
    id: 'CYBER_SPECIAL_LAWS',
    labelTagalog: 'Cybercrime, Scam at Special Laws',
    sublabelEnglish: 'RA 10175, RA 12010, Firearms, Drugs, Perjury',
    descriptionTagalog: 'Online scam, voyeurism, hacking, illegal firearms, droga, pamemeke ng dokumento, at pagsisinungaling sa sinumpaang salaysay.',
  },
] as const;

export type LawCategoryId = (typeof LAW_CATEGORY_TABS)[number]['id'];

export const EXTRA_PHILIPPINE_CASES: LegalCaseFAQ[] = [
  // ============================================================================
  // CATEGORY: CIVIL_CRIMINAL_BARANGAY (Master Rules by the Book of PH Law)
  // ============================================================================
  {
    id: 'kailan-civil-vs-criminal',
    number: 16,
    category: 'CIVIL_CRIMINAL_BARANGAY',
    caseName: 'When is a Case Civil vs. Criminal?',
    tagalogTitle: 'Kailan Nagiging Kasong Sibil o Kasong Kriminal?',
    displayLabel: 'Civil vs. Criminal Case (Paano Malalaman kung Sibil o Kriminal?)',
    legalBasis: '1987 Constitution (Art. III Sec. 20), Revised Penal Code (Art. 3 & Art. 100), & Civil Code of the Philippines (Art. 1156–1162)',
    civilVsCriminalRuleTagalog:
      'KRIMINAL kung may nilabag na batas na may parusang KULONG (hal. may panloloko/deceit sa simula, pagnanakaw, pananakit, o pananakot). SIBIL kung simpleng hindi pagtupad sa kontrata o simpleng utang na walang panloloko (walang kulong, bayad-pera o danyos lamang).',
    jurisdictionAndBarangayRule:
      'Ang CRIMINAL CASE ay iniimbestigahan ng Pulisya (PNP) at inihahain sa Piskalya (Office of the Prosecutor). Ang CIVIL CASE ay dumadaan sa Barangay Lupon at inihahain diretso sa Korte Sibil (MTC Small Claims / RTC).',
    penaltyAndBail: 'Sa Criminal Case: Pagkakakulong + Multa + Civil Liability. Sa Civil Case: Pagbabayad lamang ng utang, interes, at danyos (Walang pagkakakulong).',
    shortDefinitionTagalog:
      'Sa batas ng Pilipinas, nagiging CRIMINAL CASE lamang ang isang gawain kung may tahasang batas (Revised Penal Code o Special Law) na nagpapataw ng parusang pagkakakulong dito ("Nullum crimen, nulla poena sine lege"). Kung ito ay usapin lamang ng hindi nabayarang utang, lupa, o kontrata na walang panlilinlang, ito ay CIVIL CASE.',
    fullTruthTagalog: [
      '1. UTANG SA PERA vs. ESTAFA: Kung nanghiram ng pera nang maayos (Simple Loan / Mutuum sa ilalim ng Art. 1953 Civil Code) at nangakong magbabayad ngunit hindi nakabayad, ito ay CIVIL CASE (Small Claims sa MTC). Walang nakukulong sa simpleng utang (Art. III Sec. 20, Constitution). NGUNIT nagiging CRIMINAL CASE (Estafa o BP 22) kung: (a) Nag-isyu ng tsekeng tumalbog (BP 22); (b) Gumamit ng pekeng pangalan o pekeng dokumento bago makuha ang pera (Art. 315 Par. 2); o (c) Ipinagkatiwala ang pera/alahas para ibenta (on commission) o para sa tiyak na layunin ngunit nilustay (Art. 315 Par. 1).',
      '2. AWAY SA LUPA O RENTA vs. KRIMEN: Ang alitan sa sukat o hangganan ng lupa (Boundary Dispute), mana, o hindi pagbabayad ng upa sa bahay (Ejectment / Unlawful Detainer) ay CIVIL CASE. Nagiging CRIMINAL CASE lamang kung gumamit ng dahas o pananakot upang agawin ang lupa (Usurpation of Real Rights - Art. 312 RPC) o kung binenta ang lupa gamit ang pekeng titulo (Swindling / Falsification).',
      '3. BREACH OF CONTRACT vs. ESTAFA: Kung ang kontratista ay nagsimulang gumawa ng proyekto ngunit naubusan ng pondo o nagkaroon ng aberya, ito ay CIVIL CASE (Breach of Contract). Nagiging CRIMINAL CASE (Estafa) lamang kung sa simula pa lang ay pekeng kontratista siya at tumakas agad matapos makuha ang downpayment.',
    ],
    elementsToProveTagalog: [
      'Upang maging Criminal Case: Kailangang mapatunayan ang "Criminal Intent" (Dolo / Malisya) o "Criminal Negligence" (Culpa) at lahat ng elemento ng batas na nilabag.',
      'Upang maging Civil Case: Kailangang mapatunayan ang obligasyon mula sa kontrata, batas, o quasi-delict sa pamamagitan ng Preponderance of Evidence.',
    ],
    evidenceAndStepsTagalog: [
      'Dalhin sa Duty Investigator ng pinakamalapit na istasyon ng pulisya (Local Police Station) ang iyong mga dokumento upang masuri kung may elemento ng krimen (para sa Piskalya) o kung ito ay dapat idulog sa Barangay Lupon at Small Claims Court.',
    ],
    importantLawNoteTagalog:
      'Sa ilalim ng Art. 100 ng Revised Penal Code, kapag nagsampa ka ng Criminal Case, awtomatikong kasama na roon ang Civil Action para mabawi ang pera o danyos.',
  },
  {
    id: 'barangay-vs-diretsong-pulis',
    number: 17,
    category: 'CIVIL_CRIMINAL_BARANGAY',
    caseName: 'Barangay Jurisdiction vs. Direct to Police & Prosecutor',
    tagalogTitle: 'Kailan sa Barangay Lupon Muna at Kailan Diretso sa Pulis at Piskalya?',
    displayLabel: 'Barangay Jurisdiction vs. Direct Filing (RA 7160 Katarungang Pambarangay)',
    legalBasis: 'Sections 399–422, Republic Act No. 7160 (Local Government Code of 1991) & Supreme Court Administrative Circular No. 14-93',
    civilVsCriminalRuleTagalog:
      'Sakop ng Barangay Lupon ang LAHAT ng Civil Disputes at mga magagaang Criminal Offenses na ang parusa ay HINDI lalampas sa 1 taong pagkakakulong o ₱5,000 multa, basta nakatira sa iisang bayan o lungsod ang magkabilang panig.',
    jurisdictionAndBarangayRule:
      'MANDATORY PRE-CONDITION SA BARANGAY: Hindi tatanggapin ng Piskalya o Korte ang magaan na kaso ng magkababayan kung walang Certificate to File Action (CFA) mula sa Barangay Lupon. DIRETSO SA PULIS AT PISKALYA kung may Exemption sa ilalim ng Sec. 408 at Sec. 412 ng RA 7160.',
    penaltyAndBail: 'Ang paglabag sa mandatory Barangay Conciliation ay dahilan upang ma-dismiss ang kaso dahil sa "Prematurity / Failure to Comply with a Condition Precedent".',
    shortDefinitionTagalog:
      'Itinatakda ng RA 7160 (Katarungang Pambarangay Law) kung aling mga reklamo ang kailangang pagharapin muna sa Punong Barangay at Lupong Tagapamayapa bago maisampa sa Piskalya o Korte, at aling mga mabibigat na kaso ang DIRETSO na sa Pulisya.',
    fullTruthTagalog: [
      'A. MGA KASONG KAILANGANG DUMAAN MUNA SA BARANGAY (Kung parehong nakatira sa Bauan ang Complainant at Respondent):',
      '1. Slight Physical Injuries (Art. 266 RPC — gamutan na 1 hanggang 9 na araw, maliban kung VAWC o Child Abuse).',
      '2. Unjust Vexation (Art. 287 RPC — pang-iinis o pambubuwisit).',
      '3. Light Threats & Other Light Threats (Art. 283 & 285 RPC).',
      '4. Simple Oral Defamation / Slight Slander (Art. 358 RPC) at Intriguing Against Honor (Art. 364 RPC).',
      '5. Malicious Mischief (Art. 327 RPC) at Simple Theft kung saan ang halaga ng pinsala ay nasa pinakamababang antas na may parusang hindi hihigit sa 1 taon.',
      '6. Lahat ng Civil Cases (utangan, upa, boundary ng lupa) sa pagitan ng magkababayan.',
      'B. MGA KASONG DIRETSO NA SA PULIS AT PISKALYA (Exempted sa Barangay ayon sa Sec. 408 & 412 ng RA 7160):',
      '1. Mga krimen na may parusang HIGIT SA 1 TAON NA PAGKAKAKULONG o HIGIT SA ₱5,000 MULTA (hal. Murder, Homicide, Attempted Homicide, Robbery, Qualified Theft, Estafa, Less Serious at Serious Physical Injuries, Grave Threats, Grave Coercion, Libel, Cyber Libel, Carnapping, BP 22).',
      '2. Lahat ng kaso ng VAWC (RA 9262) at Child Abuse (RA 7610) — Mahigpit na ipinagbabawal ng batas ang pakikipag-areglo sa Barangay para sa VAWC.',
      '3. Kapag ang Complainant at Respondent ay nakatira sa MAGKAIBANG bayan o lungsod (hal. taga-Bauan ang isa at taga-Batangas City ang kabila, maliban kung magkadikit ang barangay).',
      '4. Kapag ang suspek ay NAHULI SA AKTO (Warrantless Arrest / Inquest) at nakakulong sa istasyon ng pulisya.',
      '5. Kapag ang isa sa partido ay ang Gobyerno o Korporasyon/Kompanya (Juridical Person).',
    ],
    elementsToProveTagalog: [
      'Kung dumaan sa Barangay at hindi nagkasundo matapos ang Mediation (Punong Barangay) at Conciliation (Pangkat ng Tagapagkasundo), maglalabas ang Lupon Secretary na pinagtibay ng Lupon Chairman ng "Certificate to File Action" (CFA).',
    ],
    evidenceAndStepsTagalog: [
      'Kahit sakop ng Barangay ang kaso, maaari ka pa ring magpa-blotter sa pinakamalapit na istasyon ng pulisya (Local Police Station) para sa opisyal na record at kumuha ng Medico-Legal Certificate sa ospital.',
      'Kung sakop ng Barangay, dalhin ang Certificate to File Action (CFA) sa pinakamalapit na istasyon ng pulisya upang maisampa na sa Piskalya o MTC.',
    ],
    importantLawNoteTagalog:
      'Ang pagsasampa ng reklamo sa Barangay ay nagpapahinto (interrupts) sa takbo ng Prescription Period ng krimen nang hanggang 60 araw sa ilalim ng Sec. 410(c) ng RA 7160.',
  },

  // ============================================================================
  // CATEGORY: VAWC_WCPD (Women & Children Protection Desk Cases)
  // ============================================================================
  {
    id: 'vawc-ra-9262',
    number: 18,
    category: 'VAWC_WCPD',
    caseName: 'VAWC — Violence Against Women and Their Children',
    tagalogTitle: 'Pang-aabuso sa Babae at Anak — Pisikal, Emosyonal, at Sustento',
    displayLabel: 'VAWC — RA 9262 (Pang-aabuso sa Asawa, Kinakasama, Ex, o Anak)',
    legalBasis: 'Republic Act No. 9262 (Anti-Violence Against Women and Their Children Act of 2004)',
    civilVsCriminalRuleTagalog:
      'KRIMINAL NA KASO (Public Crime) na may kasamang kagyat na Protection Orders (BPO, TPO, PPO) at Civil/Financial Support.',
    jurisdictionAndBarangayRule:
      'DIRETSO SA PULIS (WCPD Desk ng Pinakamalapit na Istasyon ng Pulisya) AT PISKALYA / FAMILY COURT. Bawal pilitin ng Barangay na mag-areglo sa VAWC (ang Barangay ay para lamang sa pagbibigay ng agarang Barangay Protection Order o BPO).',
    penaltyAndBail: 'Prision Correccional hanggang Prision Mayor (hanggang 12 taon o 20 taon) at multa mula ₱100,000 hanggang ₱300,000, bukod sa mandatory psychological counseling.',
    shortDefinitionTagalog:
      'Ang VAWC (RA 9262) ay anumang uri ng pananakit o pang-aabuso—Physical, Sexual, Psychological (emosyonal/pagtataksil), o Economic (pagkakait ng sustento)—na ginawa ng asawa, dating asawa, live-in partner, boyfriend/ex-boyfriend, o ama ng anak laban sa babae o sa kanyang anak.',
    fullTruthTagalog: [
      'Sa ilalim ng RA 9262, hindi kailangang kasal ang babae sa lalaki upang makapagsampa ng kasong VAWC. Sakop nito ang:',
      '1. Physical Violence: Pananakit sa katawan (kahit isang beses lang o kahit ilang araw lang ang gamutan).',
      '2. Psychological Violence: Pananakot, pamamahiya, stalking, paninira ng gamit, o pagkakaroon ng kabit/infidelity na nagdulot ng matinding "mental or emotional anguish" sa babae o sa anak.',
      '3. Economic Abuse: Sadyang hindi pagbibigay o pagkakait ng legal na pinansyal na sustento (deprivation of financial support) sa asawa o anak, o pagbabawal sa babae na magtrabaho.',
      '4. Sexual Violence: Pamimilit sa sekswal na gawain o pambabastos.',
    ],
    elementsToProveTagalog: [
      'Ang biktima ay isang babae at/o ang kanyang anak (lehitimo man o hindi).',
      'May relasyon o dating relasyon sa suspek (asawa, live-in, dating karelasyon/dating relationship, o may anak silang dalawa).',
      'Gumawa ang suspek ng Physical, Sexual, Psychological, o Economic Abuse.',
    ],
    evidenceAndStepsTagalog: [
      'Lumapit sa Women and Children Protection Desk (WCPD) ng pinakamalapit na istasyon ng pulisya (Local Police Station).',
      'Medico-Legal Certificate (kung pisikal o sekswal na pananakit) o Psychological Evaluation / testimonya ng emotional anguish.',
      'Marriage Certificate o Birth Certificate ng anak (patunay ng relasyon at obligasyon sa sustento).',
      'Screenshots ng pagbabanta, panlalait, o ebidensya ng pagtataksil at hindi pagbibigay ng sustento.',
    ],
    importantLawNoteTagalog:
      'Ang VAWC ay isang "Public Crime" (Sec. 25, RA 9262) at ang Psychological/Economic Abuse ay maaaring ituring na "Continuing Crime" ayon sa Korte Suprema.',
  },
  {
    id: 'child-abuse-ra-7610',
    number: 19,
    category: 'VAWC_WCPD',
    caseName: 'Child Abuse & Exploitation',
    tagalogTitle: 'Pang-aabuso at Pananakit sa Bata o Menor de Edad',
    displayLabel: 'Child Abuse — RA 7610 (Pang-aabuso o Pananakit sa Menor de Edad)',
    legalBasis: 'Republic Act No. 7610 (Special Protection of Children Against Abuse, Exploitation and Discrimination Act)',
    civilVsCriminalRuleTagalog:
      'KRIMINAL NA KASO (Public Crime). Hindi ito simpleng Slight Physical Injuries o Unjust Vexation kapag menor de edad (wala pang 18 taong gulang) ang biktima.',
    jurisdictionAndBarangayRule:
      'DIRETSO SA PULIS (WCPD Desk ng Pinakamalapit na Istasyon ng Pulisya) AT PISKALYA. Hindi puwedeng aregluhin sa Barangay.',
    penaltyAndBail: 'Prision Mayor hanggang Reclusion Perpetua depende sa uri ng pang-aabuso. Mas mataas ang parusa kaysa sa ordinaryong krimen sa Revised Penal Code.',
    shortDefinitionTagalog:
      'Ang RA 7610 ay nagbibigay ng espesyal na proteksyon sa lahat ng batang wala pang 18 taong gulang laban sa pisikal, sikolohikal, at sekswal na pang-aabuso, kalupitan (cruelty), at anumang gawaing nagpapababa sa dignidad ng bata.',
    fullTruthTagalog: [
      'Sa ilalim ng Section 10(a) ng RA 7610, ang sinumang matanda na mananakit, mananakot, o magpapahiya sa isang menor de edad sa paraang bumababa ang dignidad ng bata (debases, degrades, or demeans the intrinsic worth and dignity of a child as a human being) ay mananagot sa Child Abuse na may parusang Prision Mayor.',
      'Kahit sinumang mamamayan na nakakita o nakakaalam ng pang-aabuso sa bata ay maaaring mag-report nito sa WCPD ng pinakamalapit na istasyon ng pulisya o sa LGU Social Welfare Office (MSWDO/CSWDO).',
    ],
    elementsToProveTagalog: [
      'Ang biktima ay menor de edad (under 18 years old, o lampas 18 ngunit may kapansanan sa pag-iisip na hindi kayang protektahan ang sarili).',
      'May ginawang pisikal, emosyonal, o sekswal na pang-aabuso o pagmamalupit ang suspek.',
    ],
    evidenceAndStepsTagalog: [
      'Birth Certificate ng bata (patunay ng edad).',
      'Medico-Legal Certificate mula sa WCPU / Ospital.',
      'Sinumpaang Salaysay ng bata (sa tulong ng WCPD Officer at Social Worker) at ng magulang/testigo.',
    ],
    importantLawNoteTagalog:
      'Mahigpit na ipinagbabawal sa batas ang pagsasapubliko ng pangalan at mukha ng menor de edad na biktima.',
  },
  {
    id: 'rape-ra-8353-11648',
    number: 20,
    category: 'VAWC_WCPD',
    caseName: 'Rape & Statutory Rape',
    tagalogTitle: 'Panggagahasa at Sekswal na Pag-atake',
    displayLabel: 'Rape & Statutory Rape (Panggagahasa — Art. 266-A RPC & RA 11648)',
    legalBasis: 'Articles 266-A to 266-D, Revised Penal Code (RA 8353 Anti-Rape Law of 1997 & RA 11648 Raising the Age of Sexual Consent to 16)',
    civilVsCriminalRuleTagalog: 'KRIMINAL NA KASO (Public Crime Against Persons).',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS (WCPD Desk ng Pinakamalapit na Istasyon ng Pulisya) AT PISKALYA / REGIONAL TRIAL COURT.',
    penaltyAndBail: 'Reclusion Perpetua (Non-Bailable / Walang Piyansa kapag malakas ang ebidensya) para sa Rape by Carnal Knowledge; Prision Mayor hanggang Reclusion Temporal para sa Rape by Sexual Assault.',
    shortDefinitionTagalog:
      'Ang Rape ay panggagahasa sa pamamagitan ng puwersa, pananakot, o kapag walang malay ang biktima, O pakikipagtalik sa sinumang batang WALA PANG 16 TAONG GULANG (Statutory Rape sa ilalim ng RA 11648) kahit pa may pagpayag ang bata.',
    fullTruthTagalog: [
      '1. Rape by Carnal Knowledge (Art. 266-A Par. 1): Panggagahasa sa pamamagitan ng dahas, pananakot, panlilinlang, o habang walang malay/tulog ang biktima.',
      '2. Statutory Rape (RA 11648): Sa bagong batas, itinaas na sa 16 TAONG GULANG ang age of sexual consent sa Pilipinas. Ang pakikipagtalik sa batang wala pang 16 anyos ay awtomatikong STATUTORY RAPE kahit walang dahas na ginamit.',
      '3. Rape by Sexual Assault (Art. 266-A Par. 2): Pagpasok ng daliri o anumang bagay sa maselang bahagi ng katawan ng biktima (kahit lalaki o babae ang biktima).',
    ],
    elementsToProveTagalog: [
      'May nangyaring carnal knowledge o sexual assault.',
      'Ginawa ito sa pamamagitan ng puwersa/pananakot, O habang walang malay ang biktima, O ang biktima ay wala pang 16 taong gulang.',
    ],
    evidenceAndStepsTagalog: [
      'Agarang pagdulog sa WCPD ng pinakamalapit na istasyon ng pulisya (huwag munang labhan ang damit na suot kung kapangyayari pa lamang para sa forensic/medico-legal examination).',
      'Medico-Legal Examination Report.',
      'Birth Certificate ng biktima (lalo na kung menor de edad).',
    ],
    importantLawNoteTagalog:
      'Sa ilalim ng RA 8353, kahit mag-asawa ay maaaring makasuhan ng Marital Rape kung pinuwersa ang asawa.',
  },
  {
    id: 'safe-spaces-acts-of-lasciviousness',
    number: 21,
    category: 'VAWC_WCPD',
    caseName: 'Acts of Lasciviousness & Safe Spaces Act',
    tagalogTitle: 'Panghihipo, Pambabastos sa Daan o Online (Bawal Bastos Law)',
    displayLabel: 'Acts of Lasciviousness & Bawal Bastos Law (Panghihipo at Pambabastos)',
    legalBasis: 'Article 336, Revised Penal Code (Acts of Lasciviousness) & Republic Act No. 11313 (Safe Spaces Act / Bawal Bastos Law)',
    civilVsCriminalRuleTagalog: 'KRIMINAL NA KASO.',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS (WCPD Desk ng Pinakamalapit na Istasyon ng Pulisya) AT PISKALYA (Lalo na kung may panghihipo o kung menor de edad ang biktima).',
    penaltyAndBail: 'Prision Correccional (sa Art. 336 RPC) o Prision Mayor (kung ang biktima ay menor de edad sa ilalim ng RA 7610 Sec. 5[b]); multa at pagkakakulong sa ilalim ng RA 11313.',
    shortDefinitionTagalog:
      'Ang Acts of Lasciviousness (Art. 336 RPC) ay malaswang panghihipo o paghalik nang puwersahan o walang pahintulot. Ang Safe Spaces Act (RA 11313) naman ay nagpaparusa sa catcalling, wolf-whistling, stalking, at pambabastos sa kalsada, opisina, paaralan, o social media.',
    fullTruthTagalog: [
      '1. Acts of Lasciviousness (Art. 336 RPC): Paghawak o panghihipo sa pribadong bahagi ng katawan ng biktima nang may pagnanasa (lewd design) sa pamamagitan ng puwersa, pananakot, o biglaang pag-atake.',
      '2. Safe Spaces Act / Bawal Bastos Law (RA 11313): Sakop nito ang Gender-Based Sexual Harassment sa pampublikong lugar (kalsada, jeep, tricycle, palengke), online (pagpapadala ng malalaswang litrato o mensahe nang walang pahintulot), at sa lugar ng trabaho o paaralan.',
    ],
    elementsToProveTagalog: [
      'Para sa Acts of Lasciviousness: May ginawang malaswang paghawak/paghalik (lewd design) nang walang pahintulot o may puwersa/pananakot.',
      'Para sa RA 11313: May ginawang hindi kanais-nais na sekswal na gawain, salita, o mensahe sa pampublikong lugar o online.',
    ],
    evidenceAndStepsTagalog: [
      'Sinumpaang Salaysay ng biktima at ng mga nakasaksi.',
      'CCTV footage o screenshots/screen recordings (kung online sexual harassment).',
    ],
    importantLawNoteTagalog:
      'Kung ang biktima ng panghihipo ay menor de edad (under 18), ang parusa ay tumataas sa Reclusion Temporal sa ilalim ng RA 7610.',
  },
  {
    id: 'adultery-concubinage',
    number: 22,
    category: 'VAWC_WCPD',
    caseName: 'Adultery & Concubinage',
    tagalogTitle: 'Pakikiapid at Pagkakaroon ng Kabit ng Kasal na Asawa',
    displayLabel: 'Adultery & Concubinage (Kaso sa Pangangaliwa / Kabit — Art. 333 & 334 RPC)',
    legalBasis: 'Article 333 (Adultery), Article 334 (Concubinage), & Article 344, Revised Penal Code; kaugnay din ng RA 9262 (Psychological Violence)',
    civilVsCriminalRuleTagalog:
      'KRIMINAL NA KASO (Private Crime sa ilalim ng Art. 344 RPC kung saan tanging ang pinagtaksilang legal na asawa lamang ang maaaring magsampa at kailangang isama sa demanda ang parehong asawa at ang kalaguyo).',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA.',
    penaltyAndBail: 'Prision Correccional (Adultery at Concubinage); Destierro para sa concubine. Kung kinasuhan sa ilalim ng RA 9262 (Psychological Violence), Prision Mayor.',
    shortDefinitionTagalog:
      'Ang Adultery (Art. 333) ay ginagawa ng kasal na babae na nakipagtalik sa lalaking hindi niya asawa. Ang Concubinage (Art. 334) ay ginagawa ng kasal na lalaki na: (1) nagpatira ng kabit sa conjugal home, (2) nakipagtalik sa ilalim ng scandalous circumstances, o (3) nagsama sila ng kabit sa ibang bahay.',
    fullTruthTagalog: [
      'Sa ilalim ng Article 344 ng Revised Penal Code, ang Adultery at Concubinage ay "Private Crimes":',
      '1. Tanging ang legal na asawa (offended spouse) lamang ang puwedeng magsampa ng reklamo.',
      '2. Kailangang parehong idemanda ang taksil na asawa AT ang kanyang kabit (kung buhay pa pareho).',
      '3. Hindi na puwedeng magsampa kung nagbigay na ng kapatawaran o pahintulot (consent or pardon) ang asawa.',
      'PAALALA SA RA 9262 (VAWC): Kung ang lalaki ang nangaliwa o nagkaroon ng kabit at nagdulot ito ng matinding emotional anguish sa kanyang asawa o anak, mas madalas na sinasampa ang RA 9262 (Psychological Violence) dahil ito ay Public Crime at mas mabigat ang parusa.',
    ],
    elementsToProveTagalog: [
      'PSA Marriage Certificate na nagpapatunay na legal na kasal.',
      'Ebidensya ng pakikiapid, pagsasama sa iisang bubong, o pagkakaroon ng anak sa labas habang kasal.',
    ],
    evidenceAndStepsTagalog: [
      'PSA Marriage Certificate.',
      'PSA Birth Certificate ng anak ng asawa sa kalaguyo (kung mayroon), mga litrato, mensahe, at testigo ng kanilang pagsasama.',
    ],
    importantLawNoteTagalog:
      'Huwag basta papasok nang puwersahan sa pribadong silid nang walang kasamang pulis upang maiwasan ang kasong Trespass to Dwelling o paglabag sa karapatan.',
  },

  // ============================================================================
  // CATEGORY: PERSONS_LIBERTY_HONOR (Threats, Coercion, Vexation, Slander, Parricide)
  // ============================================================================
  {
    id: 'grave-threats-coercion-vexation',
    number: 23,
    category: 'PERSONS_LIBERTY_HONOR',
    caseName: 'Grave Threats, Grave Coercion & Unjust Vexation',
    tagalogTitle: 'Pagbabanta sa Buhay, Pamimilit, at Pambubuwisit',
    displayLabel: 'Grave Threats, Coercion & Unjust Vexation (Pagbabanta at Pamimilit)',
    legalBasis: 'Articles 282–283 (Grave/Light Threats), Article 286 (Grave Coercion), at Article 287 (Unjust Vexation), Revised Penal Code',
    civilVsCriminalRuleTagalog: 'KRIMINAL NA KASO.',
    jurisdictionAndBarangayRule:
      'Ang GRAVE THREATS at GRAVE COERCION ay DIRETSO sa Pulis at Piskalya. Ang LIGHT THREATS at UNJUST VEXATION sa pagitan ng magkababayan ay DUMADAAN MUNA SA BARANGAY LUPON.',
    penaltyAndBail: 'Mula Arresto Menor (Unjust Vexation) hanggang Prision Mayor (Grave Threats na may kondisyon/extortion). Bailable.',
    shortDefinitionTagalog:
      'Ang Grave Threats (Art. 282) ay pagbabanta na gagawan ng krimen ang isang tao o pamilya nito (hal. "Papatayin kita!" o "Susunugin ko ang bahay mo!"). Ang Grave Coercion (Art. 286) ay puwersahang pagpigil o pamimilit sa isang tao na gawin ang isang bagay labag sa kanyang kalooban. Ang Unjust Vexation (Art. 287) ay sadyang pang-iinis, pang-iistorbo, o pagpapahiya na nagdulot ng pagkabalisa.',
    fullTruthTagalog: [
      '1. GRAVE THREATS (Art. 282 RPC): Pagbabanta ng isang krimen (gaya ng pagpatay, pananakit, o pagsunog). Mas mabigat ang parusa kung humingi ng pera o kondisyon ang nagbanta (Extortion / Blackmail). Kung sinabi lang ang banta sa gitna ng matinding galit (in the heat of anger) at hindi na tinuloy, ito ay "Other Light Threats" (Art. 285 RPC).',
      '2. GRAVE COERCION (Art. 286 RPC): Paggamit ng dahas o pananakot nang walang awtoridad ng batas upang pigilan ang isang tao sa paggawa ng legal na bagay o pilitin siyang gawin ang ayaw niya (hal. sapilitang pagkuha ng gamit bilang bayad-utang o pagkandado sa nangungupahan nang walang utos ng korte).',
      '3. UNJUST VEXATION (Art. 287 Par. 2 RPC): Anumang gawain ng tao na bagama’t walang pisikal na sugat ay sadyang nagdulot ng pagkayamot, kahihiyan, o distress sa isang inosenteng tao.',
    ],
    elementsToProveTagalog: [
      'Para sa Threats: Ang binitawang salita o mensahe ng pagbabanta at ang kalagayan kung paano ito sinabi.',
      'Para sa Coercion: Ang paggamit ng dahas o pananakot upang pilitin o pigilan ang biktima.',
    ],
    evidenceAndStepsTagalog: [
      'Sinumpaang Salaysay ng biktima at mga nakarinig/nakakita na testigo.',
      'Screenshots ng text/chat messages o CCTV/video recording.',
    ],
    importantLawNoteTagalog:
      'Kung ang pagbabanta ay ginawa gamit ang Facebook, Messenger, o text at humihingi ng pera, ito ay Grave Threats in relation to RA 10175 (Cybercrime) na mas mataas ang parusa.',
  },
  {
    id: 'oral-defamation-slander',
    number: 24,
    category: 'PERSONS_LIBERTY_HONOR',
    caseName: 'Oral Defamation (Slander) & Slander by Deed',
    tagalogTitle: 'Pasalitang Paninirang-Puri at Pamamahiya sa Gawa',
    displayLabel: 'Oral Defamation / Slander (Pasalitang Paninirang-Puri — Art. 358 & 359 RPC)',
    legalBasis: 'Article 358 (Oral Defamation / Slander) at Article 359 (Slander by Deed), Revised Penal Code (inamyendahan ng RA 10951)',
    civilVsCriminalRuleTagalog: 'KRIMINAL NA KASO.',
    jurisdictionAndBarangayRule:
      'Ang Simple/Slight Oral Defamation ay DUMADAAN MUNA SA BARANGAY LUPON. Ang Grave Oral Defamation (kung mabigat at seryoso ang paratang) ay maaaring umabot sa Piskalya matapos ang Barangay process kung magkababayan.',
    penaltyAndBail: 'Arresto Mayor in its maximum period to Prision Correccional in its minimum period (kung Grave Slander); Arresto Menor o multa (kung Slight Slander).',
    shortDefinitionTagalog:
      'Ang Oral Defamation o Slander (Art. 358) ay paninirang-puri na SINABI nang pasalita (sigaw, paratang ng krimen o kabastusan) sa harap ng ibang tao. Ang Slander by Deed (Art. 359) naman ay gawaing nagdulot ng matinding kahihiyan sa biktima sa harap ng publiko (hal. pananampal o pagbubuhos ng tubig/dumi sa harap ng maraming tao upang hiyain).',
    fullTruthTagalog: [
      '1. Grave vs. Slight Oral Defamation: Kung ang mga salitang binitawan ay sadyang mabigat, malisyoso, at nagpaparatang ng krimen o nakasisira nang husto sa reputasyon, ito ay GRAVE ORAL DEFAMATION. Kung nasabi lamang dahil sa bugso ng damdamin o mainit na sagutan, ito ay SLIGHT ORAL DEFAMATION.',
      '2. Slander by Deed (Art. 359): Anumang pisikal na aksyon (tulad ng pagsampal, pagdura, o paghubad sa damit sa harap ng tao) na ang pangunahing layunin ay ilagay sa kahihiyan (cast dishonor, discredit, or contempt) ang biktima.',
    ],
    elementsToProveTagalog: [
      'May sinabing mapanirang salita (Oral Defamation) o ginawang nakakahiyang aksyon (Slander by Deed).',
      'Narinig o nakita ito ng ibang tao (Third Person) maliban sa biktima at suspek.',
    ],
    evidenceAndStepsTagalog: [
      'Sinumpaang Salaysay ng mga testigo na nakarinig sa eksaktong mga salitang binitawan.',
      'Certificate to File Action (CFA) mula sa Barangay Lupon kung magkababayan.',
      'Tandaan: Maikli ang Prescription Period ng Oral Defamation (6 na buwan para sa Grave Slander; 2 buwan para sa Slight Slander sa ilalim ng Art. 90 RPC), kaya kailangang maaksyunan agad.',
    ],
    importantLawNoteTagalog:
      'Kapag nagsampa sa Barangay Lupon, humihinto (interrupted) ang bilang ng Prescription Period nang hanggang 60 araw.',
  },
  {
    id: 'trespass-parricide-illegal-detention',
    number: 25,
    category: 'PERSONS_LIBERTY_HONOR',
    caseName: 'Trespass to Dwelling, Parricide & Illegal Detention',
    tagalogTitle: 'Pagpasok sa Bahay Nang Walang Paalam, Parricide, at Kidnapping',
    displayLabel: 'Trespass to Dwelling, Parricide & Illegal Detention (Art. 280, 246, 267 RPC)',
    legalBasis: 'Article 280 (Qualified Trespass to Dwelling), Article 246 (Parricide), at Article 267–268 (Kidnapping and Serious/Slight Illegal Detention), Revised Penal Code',
    civilVsCriminalRuleTagalog: 'KRIMINAL NA KASO.',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA (Kung may dahas sa Trespass, at lahat ng kaso ng Parricide at Kidnapping/Illegal Detention).',
    penaltyAndBail: 'Trespass: Arresto Mayor hanggang Prision Correccional; Parricide at Kidnapping: Reclusion Perpetua (Non-Bailable).',
    shortDefinitionTagalog:
      'Sakop ng kategoryang ito ang: (1) TRESPASS TO DWELLING (Art. 280) — pagpasok sa tahanan ng iba labag sa kalooban ng may-bahay; (2) PARRICIDE (Art. 246) — pagpatay sa sariling ama, ina, anak, o legal na asawa; at (3) KIDNAPPING / ILLEGAL DETENTION (Art. 267) — sapilitang pagdukot o pagkulong sa isang tao.',
    fullTruthTagalog: [
      '1. Qualified Trespass to Dwelling (Art. 280 RPC): Pagpasok ng isang pribadong tao sa bahay ng iba nang labag sa kalooban ng nakatira (against the will of the occupant). Mas mabigat ang parusa kung gumamit ng dahas o pananakot sa pagpasok.',
      '2. Parricide (Art. 246 RPC): Sinumang pumatay sa kanyang sariling ama, ina, anak (lehitimo man o hindi), lolo/lola, o sa kanyang LEGAL NA ASAWA (legitimate spouse) ay mananagot sa Parricide na may parusang Reclusion Perpetua.',
      '3. Kidnapping and Serious Illegal Detention (Art. 267 RPC): Pagdukot o pagkulong sa isang tao at pagkakait ng kanyang kalayaan, lalo na kung humingi ng ransom, tumagal nang higit 3 araw, o kung ang biktima ay menor de edad o babae.',
    ],
    elementsToProveTagalog: [
      'Sa Trespass: Pumasok sa loob ng bahay nang may pagbabawal (express or implied prohibition) ng may-ari.',
      'Sa Parricide: Relasyon sa dugo (direct ascendant/descendant) o PSA Marriage Certificate (kung asawa).',
      'Sa Illegal Detention: Pagkakait ng kalayaan (deprivation of liberty) ng biktima.',
    ],
    evidenceAndStepsTagalog: [
      'Tumawag agad sa pinakamalapit na istasyon ng pulisya (Local Police Station) para sa agarang responde at pag-aresto.',
      'CCTV footage, litrato, at Sinumpaang Salaysay ng mga testigo.',
    ],
    importantLawNoteTagalog:
      'Hindi Trespass to Dwelling kung pumasok ang isang tao upang iligtas ang sarili o ibang tao sa matinding panganib o krimen (Art. 280 Par. 2).',
  },

  // ============================================================================
  // CATEGORY: PROPERTY_CHECKS_TRAFFIC (BP 22, Carnapping, Fencing, Arson, Traffic)
  // ============================================================================
  {
    id: 'bp-22-bouncing-checks',
    number: 26,
    category: 'PROPERTY_CHECKS_TRAFFIC',
    caseName: 'BP 22 — Bouncing Checks Law',
    tagalogTitle: 'Pag-isyu ng Tsekeng Tumalbog (DAIF / Account Closed)',
    displayLabel: 'BP 22 — Bouncing Checks Law (Tsekeng Tumalbog / Walang Pondo)',
    legalBasis: 'Batas Pambansa Bilang 22 (Bouncing Checks Law) & Supreme Court Administrative Circular No. 12-2000',
    civilVsCriminalRuleTagalog:
      'KRIMINAL AT SIBIL NA KASO. Kahit bayad sa dating utang ang tseke, krimen pa rin sa ilalim ng BP 22 ang pag-isyu ng tsekeng walang pondo.',
    jurisdictionAndBarangayRule:
      'DIRETSO SA PISKALYA / MUNICIPAL TRIAL COURT (Exempted sa Barangay Conciliation ayon sa desisyon ng Korte Suprema).',
    penaltyAndBail: 'Pagkakakulong na 30 araw hanggang 1 taon o multa na hanggang doble ng halaga ng tseke, o pareho, bukod sa pagbabayad ng buong halaga ng tseke at interes. Bailable.',
    shortDefinitionTagalog:
      'Ang BP 22 ay nagpaparusa sa sinumang nag-isyu ng tseke (bilang bayad sa utang, bilihin, o garantiya) na nang ideposito sa bangko ay tumalbog dahil sa kakulangan ng pondo (Drawn Against Insufficient Funds - DAIF) o dahil sarado na ang account (Account Closed).',
    fullTruthTagalog: [
      'Kaibahan ng BP 22 sa Estafa (Art. 315 Par. 2[d]):',
      '1. Sa BP 22, kahit ibinigay ang tseke bilang pambayad sa DATING UTANG (pre-existing obligation), krimen pa rin ito kapag tumalbog.',
      '2. Sa Estafa naman, kailangang ibinigay ang tseke KASABAY ng pagkuha ng pera o produkto (simultaneous obligation). Puwedeng sabay na isampa ang BP 22 at Estafa kung pasok sa parehong elemento!',
      'MAHALAGANG REKISITO SA BATAS: Upang manalo sa kasong BP 22, kailangang mapatunayan na nakatanggap ang nag-isyu ng tseke ng NAKASULAT NA "NOTICE OF DISHONOR" at nabigyan siya ng limang (5) banking days upang bayaran ang halaga ng tseke ngunit nabigo siyang magbayad.',
    ],
    elementsToProveTagalog: [
      'Nag-isyu ng tseke ang akusado.',
      'Tumalbog ang tseke sa bangko (DAIF o Account Closed).',
      'Nakatanggap ang akusado ng nakasulat na Notice of Dishonor (personal na tinanggap na may pirma o sa pamamagitan ng Registered Mail na may Registry Return Card).',
      'Lumipas ang 5 banking days matapos matanggap ang Notice of Dishonor at hindi pa rin binayaran ang tseke.',
    ],
    evidenceAndStepsTagalog: [
      'Orihinal na tumalbog na tseke na may tatak ng bangko (DAIF / Account Closed) at Return Check Advice.',
      'Kopya ng Demand Letter / Notice of Dishonor na may pirma ng tumanggap o Registry Receipt, Return Card, at Postmaster Certification.',
    ],
    importantLawNoteTagalog:
      'Huwag kalimutang ipadala at patunayang natanggap ng nag-isyu ng tseke ang Written Notice of Dishonor dahil madidismiss ang BP 22 kung verbal o text lang ang paniningil.',
  },
  {
    id: 'carnapping-fencing-arson',
    number: 27,
    category: 'PROPERTY_CHECKS_TRAFFIC',
    caseName: 'Carnapping, Anti-Fencing & Arson',
    tagalogTitle: 'Pagnanakaw ng Sasakyan/Motor, Pagbili ng Nakaw, at Panununog',
    displayLabel: 'Carnapping (RA 10883), Anti-Fencing (PD 1612) & Arson (PD 1613)',
    legalBasis: 'Republic Act No. 10883 (New Anti-Carnapping Act of 2016), Presidential Decree No. 1612 (Anti-Fencing Law), at PD 1613 / Art. 320 RPC (Destructive Arson)',
    civilVsCriminalRuleTagalog: 'MABIBIGAT NA KRIMINAL NA KASO.',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS (Pinakamalapit na Istasyon ng Pulisya / PNP HPG) AT PISKALYA / REGIONAL TRIAL COURT.',
    penaltyAndBail: 'Carnapping: 20 taon hanggang 30 taon (Non-Bailable kapag may dahas o malakas ang ebidensya); Anti-Fencing: hanggang 20 taon; Destructive Arson: Reclusion Perpetua.',
    shortDefinitionTagalog:
      'Sakop nito ang: (1) CARNAPPING (RA 10883) — pagnanakaw ng motorsiklo, kotse, o trak; (2) ANTI-FENCING (PD 1612) — pagbili, pagbebenta, o pagsasangla ng gamit na galing sa nakaw; at (3) ARSON (PD 1613) — sadyang pagsunog sa bahay, gusali, o ari-arian.',
    fullTruthTagalog: [
      '1. New Anti-Carnapping Act (RA 10883): Ang pagkuha ng anumang motor vehicle (kasama ang motorsiklo at kotse) nang walang paalam ng may-ari, o kahit hiniram/pinarentahan ngunit sadyang tinangay at hindi na ibinalik, ay mabigat na krimen na Carnapping (20 hanggang 30 taong pagkakakulong).',
      '2. Anti-Fencing Law (PD 1612): Sa ilalim ng Section 5 ng PD 1612, ang simpleng PAGKAKAROON (mere possession) ng gamit na galing sa Robbery o Theft (hal. nakaw na cellphone, laptop, o motor parts na binili nang mura at walang resibo) ay "Prima Facie Evidence" na ng Fencing at may sariling mabigat na parusang kulong!',
      '3. Arson (PD 1613 & Art. 320 RPC): Ang sadyang panununog ng tirahan o gusali ay isa sa pinakamabibigat na krimen sa Pilipinas.',
    ],
    elementsToProveTagalog: [
      'Sa Carnapping: OR/CR ng sasakyan at patunay na kinuha/tinangay ito nang walang pahintulot.',
      'Sa Anti-Fencing: Napatunayang nakaw ang gamit at binili/tinanggap ito ng suspek na alam o dapat alam niyang galing sa nakaw.',
    ],
    evidenceAndStepsTagalog: [
      'I-report agad sa pinakamalapit na istasyon ng pulisya (Local Police Station) at PNP Highway Patrol Group (HPG) upang mailagay sa National Alarm List ang plaka, engine number, at chassis number ng sasakyan.',
      'Magdala ng OR/CR, Deed of Sale, susi ng sasakyan, at CCTV footage.',
    ],
    importantLawNoteTagalog:
      'Babala sa publiko: Huwag bibili ng segunda-manong cellphone, alahas, o motorsiklo na kahina-hinalang mura at walang tunay na dokumento dahil maaari kang makulong sa Anti-Fencing Law (PD 1612).',
  },
  {
    id: 'traffic-accident-reckless-imprudence',
    number: 28,
    category: 'PROPERTY_CHECKS_TRAFFIC',
    caseName: 'Traffic Accident & Reckless Imprudence',
    tagalogTitle: 'Banggaan sa Kalsada at Kapabayaan sa Pagmamaneho (TAR)',
    displayLabel: 'Reckless Imprudence (Banggaan sa Kalsada — Art. 365 RPC & RA 4136)',
    legalBasis: 'Article 365, Revised Penal Code (Imprudence and Negligence), RA 4136 (Land Transportation Code), at RA 10586 (Anti-Drunk and Drugged Driving Act)',
    civilVsCriminalRuleTagalog:
      'KRIMINAL NA KASO (Quasi-Offense under Art. 365 RPC) na may kasamang Civil Liability ng driver at ng rehistradong may-ari ng sasakyan (Registered Owner Rule / Employer Subsidiary Liability under Art. 2180 Civil Code).',
    jurisdictionAndBarangayRule:
      'INIIMBESTIGAHAN NG TRAFFIC INVESTIGATOR NG PINAKAMALAPIT NA ISTASYON NG PULISYA para sa opisyal na Traffic Accident Report (TAR).',
    penaltyAndBail: 'Multa at/o pagkakakulong (Arresto Mayor hanggang Prision Correccional kung may namatay). Mas mataas ang parusa kung tumakas (Hit-and-Run) o lasing sa alak/droga (RA 10586).',
    shortDefinitionTagalog:
      'Ang Reckless Imprudence (Art. 365 RPC) ay ang kasong isinasampa kapag dahil sa kapabayaan, mabilis na patakbo, o paglabag sa batas-trapiko ay nakabangga at nagdulot ng pagkasira ng sasakyan (Damage to Property), pagkasugat (Physical Injuries), o pagkamatay (Homicide).',
    fullTruthTagalog: [
      'Sa ilalim ng Article 365 ng Revised Penal Code:',
      '1. Kung ang driver ay TUMAKAS at hindi tinulungan ang biktima (Hit-and-Run / Failing to lend on-the-spot assistance), tumataas nang ISANG ANTAS (one degree higher) ang kanyang parusang pagkakakulong.',
      '2. Sa ilalim ng "Registered Owner Rule" ng Korte Suprema at Art. 2180 ng Civil Code, hindi lang ang driver ang mananagot sa bayad-pinsala kundi pati ang rehistradong may-ari o operator ng sasakyan.',
      '3. Para sa Insurance Claim (Comprehensive o TPL), kailangang kumuha ng opisyal na Traffic Accident Report (TAR) mula sa pinakamalapit na istasyon ng pulisya.',
    ],
    elementsToProveTagalog: [
      'May aksidenteng nangyari na nagdulot ng pinsala sa ari-arian, sugat sa katawan, o pagkamatay.',
      'Nangyari ito dahil sa kawalan ng kaukulang pag-iingat (inexcusable lack of precaution) ng nakabanggang driver.',
    ],
    evidenceAndStepsTagalog: [
      'Driver’s License at OR/CR ng mga sangkot na sasakyan.',
      'Litrato ng eksaktong posisyon ng mga sasakyan sa kalsada bago igilid at dashcam/CCTV footage.',
      'Medico-Legal Certificate (kung may nasaktan) at Repair Estimate (para sa sasakyan).',
    ],
    importantLawNoteTagalog:
      'Kung nagkaayos ang magkabilang panig sa bayaran ng pagpapagawa, gagawa ng "Release, Waiver and Quitclaim / Affidavit of Desistance" na notarized.',
  },

  // ============================================================================
  // CATEGORY: CYBER_SPECIAL_LAWS (Cybercrime, Scam, Firearms, Drugs, Perjury)
  // ============================================================================
  {
    id: 'online-scam-afasa-voyeurism',
    number: 29,
    category: 'CYBER_SPECIAL_LAWS',
    caseName: 'Online Scam, GCash Fraud & Photo/Video Voyeurism',
    tagalogTitle: 'Online Scam, Money Mule (RA 12010), at Pagpapakalat ng Pribadong Video',
    displayLabel: 'Online Scam (RA 10175 / RA 12010 AFASA) & Voyeurism (RA 9995)',
    legalBasis: 'Republic Act No. 10175 (Cybercrime Prevention Act), Republic Act No. 12010 (Anti-Financial Account Scamming Act / AFASA), at Republic Act No. 9995 (Anti-Photo and Video Voyeurism Act)',
    civilVsCriminalRuleTagalog: 'MABIBIGAT NA KRIMINAL NA KASO.',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS (Pinakamalapit na Istasyon ng Pulisya / PNP Anti-Cybercrime Group) AT PISKALYA.',
    penaltyAndBail: 'Cyber-Estafa: Prision Mayor hanggang Reclusion Temporal (isang antas na mas mataas sa ilalim ng Sec. 6 ng RA 10175); RA 12010 Money Mule / Phishing: 6 hanggang 12 taong kulong; RA 9995 Voyeurism: 3 hanggang 7 taong kulong.',
    shortDefinitionTagalog:
      'Sakop nito ang: (1) CYBER-ESTAFA at PHISHING — panloloko sa online selling, investment scam, o GCash/Maya/Bank transfer; (2) RA 12010 (AFASA) — pagpapagamit o pagbebenta ng sariling bank/e-wallet account sa scammer (Money Mule); at (3) RA 9995 — pagpapakalat o pananakot na ikakalat ang pribadong litrato/video.',
    fullTruthTagalog: [
      '1. Cyber-Estafa (Art. 315 RPC in relation to Sec. 6, RA 10175): Kapag ginamit ang Facebook, Messenger, pekeng online shop, o GCash/Maya sa panloloko, tumataas nang ISANG ANTAS ang parusa.',
      '2. Anti-Financial Account Scamming Act (RA 12010): Sa ilalim ng bagong batas na ito, binigyan ng kapangyarihan ang mga bangko at e-wallet (gaya ng GCash at Maya) na pansamantalang i-hold ang disputed funds, at may parusang kulong na rin kahit ang may-ari ng account na nagpagamit bilang "Money Mule".',
      '3. Anti-Photo and Video Voyeurism Act (RA 9995): Krimen ang pagpapakalat, pag-upload, o pagbabanta na ikakalat ang pribadong larawan o video ng isang tao nang walang nakasulat na pahintulot, KAHIT pa pumayag ang biktima noong kinunan ang video.',
    ],
    elementsToProveTagalog: [
      'Screenshots ng buong pag-uusap, profile URL, at numero ng scammer.',
      'E-Wallet (GCash/Maya) o Bank Transaction Reference Number, petsa, at oras.',
    ],
    evidenceAndStepsTagalog: [
      'I-report agad sa GCash / Maya / Bank Help Center upang ma-flag ang account ng scammer.',
      'Mag-fill up sa Public Intake Form at kumuha ng opisyal na Police Blotter sa pinakamalapit na istasyon ng pulisya at koordinasyon sa PNP ACG.',
    ],
    importantLawNoteTagalog:
      'Huwag kailanman ibebenta o ipapahiram ang iyong verified GCash, Maya, o Bank Account sa ibang tao dahil ikaw mismo ay makakasuhan bilang "Money Mule" sa ilalim ng RA 12010.',
  },
  {
    id: 'perjury-falsification-false-testimony',
    number: 30,
    category: 'CYBER_SPECIAL_LAWS',
    caseName: 'Perjury & Falsification of Documents',
    tagalogTitle: 'Pagsisinungaling sa Sinumpaang Salaysay at Pamemeke ng Dokumento',
    displayLabel: 'Perjury (Art. 183 RPC / RA 11594) & Falsification of Documents (Art. 171–172)',
    legalBasis: 'Article 183 (Perjury, inamyendahan ng Republic Act No. 11594) at Articles 171–172 (Falsification of Public, Official, or Commercial Documents), Revised Penal Code',
    civilVsCriminalRuleTagalog: 'KRIMINAL NA KASO LABAN SA PUBLIC INTEREST AT PUBLIC FAITH.',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA.',
    penaltyAndBail: 'Perjury (RA 11594): Prision Mayor in its minimum to medium periods (6 na taon at 1 araw hanggang 10 taon); Falsification: Prision Correccional in its medium and maximum periods at multa.',
    shortDefinitionTagalog:
      'Ang Perjury (Art. 183) ay ang sadyang pagsisinungaling sa ilalim ng panunumpa (Sworn Statement / Affidavit). Ang Falsification (Art. 171–172) naman ay ang pamemeke ng pirma, petsa, o nilalaman ng opisyal na dokumento, titulo, ID, Deed of Sale, o kontrata.',
    fullTruthTagalog: [
      '1. Perjury (RA 11594): Sa bagong batas na nag-amyenda sa Art. 183 ng Revised Penal Code, itinaas ang parusa sa Perjury sa 6 hanggang 10 taon na pagkakakulong. Sinumang gagawa ng gawa-gawang reklamo o magsisinungaling sa kanyang Sinumpaang Salaysay ay mananagot sa mabigat na parusang ito.',
      '2. Falsification of Public or Private Documents (Art. 171 & 172 RPC): Kabilang dito ang paggaya sa pirma ng ibang tao (counterfeiting or imitating any handwriting or signature), pagpapalabas na pumirma sa harap ng notaryo ang isang taong hindi naman humarap (gaya ng patay na o nasa abroad), o paggamit ng pekeng dokumento.',
    ],
    elementsToProveTagalog: [
      'Para sa Perjury: Gumawa ng salaysay sa ilalim ng panunumpa (under oath before a competent officer) at sadyang nagsabi ng kasinungalingan sa mahalagang bagay (willful and deliberate assertion of falsehood).',
      'Para sa Falsification: Binago ang katotohanan o ginaya ang pirma sa isang dokumento.',
    ],
    evidenceAndStepsTagalog: [
      'Kopya ng Sinumpaang Salaysay o pinekeng dokumento.',
      'Specimen Signatures, NBI/PNP Questioned Document Examination, o Notarial Certification mula sa Korte.',
    ],
    importantLawNoteTagalog:
      'Kaya mahigpit na paalala ng Pulisya: Pawang BUONG KATOTOHANAN lamang ang isulat at sabihin sa Police Blotter at Sinumpaang Salaysay.',
  },
  {
    id: 'illegal-firearms-drugs-direct-assault',
    number: 31,
    category: 'CYBER_SPECIAL_LAWS',
    caseName: 'Illegal Firearms, Dangerous Drugs & Direct Assault',
    tagalogTitle: 'Hindi Lisensyadong Baril, Iligal na Droga, at Pananakit sa Awtoridad',
    displayLabel: 'Illegal Firearms (RA 10591), Drugs (RA 9165) & Direct Assault (Art. 148 RPC)',
    legalBasis: 'Republic Act No. 10591 (Comprehensive Firearms and Ammunition Regulation Act), Republic Act No. 9165 (Comprehensive Dangerous Drugs Act of 2002), at Articles 148 & 151 (Direct Assault / Resistance and Disobedience), Revised Penal Code',
    civilVsCriminalRuleTagalog: 'MABIBIGAT NA KRIMINAL NA KASO LABAN SA ESTADO AT PUBLIC ORDER.',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA (Walang Barangay Conciliation).',
    penaltyAndBail: 'RA 10591: Prision Mayor hanggang Reclusion Perpetua; RA 9165 (Pushing / Possession): 12 taon hanggang Life Imprisonment (Non-Bailable); Direct Assault: Prision Correccional.',
    shortDefinitionTagalog:
      'Sakop nito ang: (1) RA 10591 — pagdadala o pag-iingat ng baril at bala na walang LTOPF, Firearm Registration, at Permit to Carry (PTCFOR); (2) RA 9165 — pagbebenta, pagdadala, o paggamit ng iligal na droga; at (3) DIRECT ASSAULT (Art. 148 RPC) — pananakit o panlalaban sa pulis, guro, punong barangay, o tanod habang ginagampanan ang kanilang tungkulin.',
    fullTruthTagalog: [
      '1. RA 10591 (Illegal Possession of Firearms): Kahit expired na ang lisensya o nagdala ng lisensyadong baril sa labas ng bahay nang walang Permit to Carry Outside of Residence (PTCFOR), ito ay paglabag sa RA 10591. Kung ginamit ang hindi lisensyadong baril sa paggawa ng krimen (gaya ng Homicide, Murder, Robbery, o Grave Threats), lalong bumibigat ang kaso.',
      '2. Direct Assault (Art. 148 RPC): Ang pananakit o pagtutok ng armas sa isang Person in Authority (gaya ng Mayor, Punong Barangay, Guro, o Doktor/Nars habang nagtatrabaho sa ilalim ng batas) o Agent of a Person in Authority (Pulis o Barangay Tanod) habang nagpapatupad ng batas ay krimen na Direct Assault.',
    ],
    elementsToProveTagalog: [
      'Sa RA 10591: Nahulihan ng baril/bala at may Certification mula sa PNP Firearms and Explosives Office (FEO) na hindi siya lisensyadong humawak nito.',
      'Sa Direct Assault: Alam ng suspek na opisyal/pulis/tanod ang kanyang sinaktan habang ito ay nasa tungkulin.',
    ],
    evidenceAndStepsTagalog: [
      'Ipagbigay-alam agad sa pinakamalapit na istasyon ng pulisya (Local Police Station Hotline) o Emergency Hotline 911 para sa agarang police operation.',
    ],
    importantLawNoteTagalog:
      'Ang lahat ng tips o sumbong tungkol sa iligal na baril, droga, o wanted persons sa istasyon ng pulisya ay mahigpit na kumpidensyal.',
  },
];
