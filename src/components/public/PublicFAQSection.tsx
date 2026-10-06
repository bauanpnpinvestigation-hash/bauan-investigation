import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  Scale,
  ShieldCheck,
  FileText,
  Gavel,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  ArrowUpRight,
  ArrowLeft,
  Lock,
  X,
  BookOpen,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { BackgroundWatermark } from '../common/BackgroundWatermark';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { PublicFooter } from './PublicFooter';
import { 
  EXTRA_PHILIPPINE_CASES, 
  LAW_CATEGORY_TABS, 
  LawCategoryId 
} from '../../data/extraPhilippineCases';

export interface LegalCaseFAQ {
  id: string;
  number: number;
  category?: string;
  caseName: string;
  tagalogTitle: string;
  displayLabel: string; // e.g. "Estafa (Panloloko sa Pera o Pagtitiwala)"
  legalBasis: string;
  civilVsCriminalRuleTagalog?: string;
  jurisdictionAndBarangayRule: string;
  penaltyAndBail: string;
  shortDefinitionTagalog: string;
  fullTruthTagalog: string[];
  elementsToProveTagalog: string[];
  evidenceAndStepsTagalog: string[];
  importantLawNoteTagalog: string;
}

export const LEGAL_CASES_FAQ: LegalCaseFAQ[] = [
  {
    id: 'estafa',
    number: 1,
    caseName: 'Estafa',
    tagalogTitle: 'Panloloko sa Pera o Paglustay ng Ipinagkatiwala',
    displayLabel: 'Estafa (Panloloko sa Pera o Paglustay ng Ipinagkatiwala)',
    legalBasis: 'Article 315, Revised Penal Code (inamyendahan ng Republic Act No. 10951)',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA (Exempted sa Barangay Lupon dahil ang parusa ay lampas 1 taong pagkakakulong).',
    penaltyAndBail: 'May piyansa (Bailable) depende sa halaga ng naloko, ngunit nagiging Non-Bailable (Syndicated Estafa sa ilalim ng PD 1689) kung ginawa ng 5 o higit pang tao laban sa publiko.',
    shortDefinitionTagalog:
      'Ang Estafa ay krimen kung saan nakuha ang iyong pera, alahas, o ari-arian dahil sa (1) PAGLUSTAY ng ipinagkatiwala (Abuse of Confidence) o (2) PANLOLOKO at paggamit ng kasinungalingan (Deceit / False Pretenses) na nagdulot ng pinsala sa biktima.',
    fullTruthTagalog: [
      'Sa ilalim ng Article 315 ng Revised Penal Code, may tatlong pangunahing paraan ng paggawa ng Estafa:',
      '1. Estafa with Unfaithfulness or Abuse of Confidence (Art. 315 Par. 1): Ipinagkatiwala mo ang pera o gamit upang ibenta (on commission), ingatan (in deposit), o pangasiwaan (for administration) na may obligasyong ibalik ang mismong gamit o ang pinagbentahan, ngunit itinakbo o ginastos ito ng suspek para sa sarili (Misappropriation / Conversion).',
      '2. Estafa by Means of False Pretenses or Fraudulent Acts (Art. 315 Par. 2): Bago o kasabay ng pagbibigay mo ng pera, nagpanggap ang suspek na may pekeng pangalan, pekeng kapangyarihan, pekeng negosyo, o pekeng ari-arian upang malinlang kang magbigay ng pera.',
      '3. Estafa through Postdating a Check (Art. 315 Par. 2[d]): Nagbigay ng tseke bilang kabayaran sa biniling gamit o hiniram na pera sa mismong oras ng transaksyon (simultaneous obligation) kahit alam niyang walang pondo sa bangko.',
      'MAHALAGANG KATOTOHANAN SA BATAS: Ang simpleng pangungutang ng pera na hindi nabayaran (Simple Loan / Mutuum) kung saan walang panlilinlang noong hiniram at wala ring kasunduang ibebenta ang gamit ay HINDI Estafa kundi Civil Case lamang.',
    ],
    elementsToProveTagalog: [
      'May panlilinlang (deceit) bago o habang kinukuha ang pera, O may tinanggap na pera/gamit sa ilalim ng tiwala (in trust / on commission) na nilustay.',
      'Nagtiwala ang biktima dahil sa panlilinlang o kasunduang iyon kaya ibinigay ang pera o gamit.',
      'Nagkaroon ng aktwal na pinsala o pagkalugi (damage or prejudice capable of pecuniary estimation) sa biktima.',
      'May pormal na Demand (paniningil o paghingi ng soli) kung ang kaso ay Estafa sa ilalim ng Abuse of Confidence.',
    ],
    evidenceAndStepsTagalog: [
      'Magdala ng Written Agreement, Acknowledgment Receipt, Trust Receipt, o Kasulatan na pirmado ng inirereklamo.',
      'Magdala ng kopya ng Demand Letter na may patunay na natanggap ng inirereklamo.',
      'I-print ang mga screenshots ng chat, text messages, at bank/GCash transfer receipts.',
      'Mag-fill up sa Public Intake Form at lumapit sa Duty Investigator ng pinakamalapit na istasyon ng pulisya (Local Police Station) para sa Sinumpaang Salaysay (Complaint-Affidavit).',
    ],
    importantLawNoteTagalog:
      'Tandaan: Kung ang pera ay inutang nang maayos at tumubo ng interes, nagiging "Simple Loan" ito at hindi na Estafa. Kumonsulta sa Imbestigador upang masuri ang iyong mga dokumento.',
  },
  {
    id: 'theft',
    number: 2,
    caseName: 'Theft',
    tagalogTitle: 'Simpleng Pagnanakaw / Kupit / Salisi',
    displayLabel: 'Theft (Simpleng Pagnanakaw / Kupit / Salisi)',
    legalBasis: 'Articles 308 & 309, Revised Penal Code (inamyendahan ng Republic Act No. 10951)',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA (Kung ang halaga o parusa ay lampas sa saklaw ng Barangay o kung nahuli sa akto ang suspek).',
    penaltyAndBail: 'Ang haba ng pagkakakulong ay nakabatay sa halaga (value) ng ninakaw na gamit sa ilalim ng RA 10951. Ito ay Bailable (may piyansa).',
    shortDefinitionTagalog:
      'Ang Theft ay ang pagkuha ng personal na pag-aari (personal property) ng ibang tao nang walang pahintulot ng may-ari, may layuning makinabang (intent to gain), at WALANG ginamit na dahas/pananakot sa tao o puwersang pagsira sa pinto, bintana, o pader.',
    fullTruthTagalog: [
      'Sa ilalim ng Article 308 ng Revised Penal Code, nagaganap ang Theft kapag kinuha ang gamit ng iba (gaya ng cellphone, wallet, pera, paninda, o kagamitan) nang palihim o habang nakalingat ang may-ari (salisi, dukot, o shoplifting).',
      'Sakop din ng Theft sa ilalim ng Art. 308 ang:',
      '1. Sinumang nakapulot ng nawawalang gamit (lost property) at hindi ito isinauli sa may-ari o sa pulisya/awtoridad kahit alam o puwedeng malaman kung sino ang may-ari.',
      '2. Sinumang pumasok sa bakuran o lupain ng iba nang walang paalam upang manguha ng bunga, pananim, o kahoy.',
    ],
    elementsToProveTagalog: [
      'May pagkuha (taking) ng personal na gamit o pera.',
      'Ang gamit ay pag-aari ng ibang tao.',
      'Ginawa ang pagkuha nang may layuning makinabang (Intent to Gain / Animus Lucrandi).',
      'Ginawa ito nang walang pahintulot (without consent) ng may-ari.',
      'Walang ginamit na dahas o pananakot sa tao at walang puwersang pagsira sa pinto/bintana ng gusali.',
    ],
    evidenceAndStepsTagalog: [
      'Kopya ng CCTV footage (kung mayroon) o litrato ng pinangyarihan.',
      'Resibo o patunay ng pagmamay-ari at halaga ng ninakaw na gamit.',
      'Salaysay ng nakakita (Eyewitness Affidavit) o ng humuli sa suspek.',
    ],
    importantLawNoteTagalog:
      'Kung ang suspek ay nahuli sa akto (hal. shoplifting o salisi), dalhin agad sa pinakamalapit na istasyon ng pulisya (Local Police Station) para sa Inquest Proceedings sa loob ng takdang oras ng batas.',
  },
  {
    id: 'swindling',
    number: 3,
    caseName: 'Swindling',
    tagalogTitle: 'Iba Pang Uri ng Panlilinlang at Panloloko',
    displayLabel: 'Swindling (Iba Pang Uri ng Panlilinlang at Panloloko)',
    legalBasis: 'Articles 315, 316 (Other Forms of Swindling), 317 (Swindling a Minor) & 318 (Other Deceits), Revised Penal Code',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA (Maliban sa Art. 318 Other Deceits na maliit ang halaga at magkababayan ang sangkot).',
    penaltyAndBail: 'May katumbas na parusang pagkakakulong (Arresto Mayor hanggang Prision Mayor) at multa batay sa halaga ng pinsala. May piyansa (Bailable).',
    shortDefinitionTagalog:
      'Ang Swindling ay ang legal na katawagan sa Ingles ng Estafa at mga kaugnay na panlilinlang sa ilalim ng Articles 316–318 ng Revised Penal Code, kabilang ang pagbebenta ng lupang hindi sa kanya, pagsasangla ng ari-arian nang may panloloko, at iba pang mapanlinlang na gawain.',
    fullTruthTagalog: [
      'Bukod sa pangunahing Estafa (Art. 315), partikular na pinaparusahan ng batas bilang Swindling ang mga sumusunod:',
      '1. Article 316 (Other Forms of Swindling): Pagpapanggap na may-ari ng isang lupa o bahay (real property) at pagbebenta o pagsasangla nito kahit hindi siya ang tunay na may-ari; o pagbebenta ng ari-arian bilang "malaya sa sanla" (free from encumbrance) kahit nakasanla na pala sa iba.',
      '2. Article 317 (Swindling a Minor): Pananamantala sa kawalang-muwang ng isang menor de edad upang papirmahin ito sa dokumento ng pagkakautang o paglilipat ng ari-arian.',
      '3. Article 318 (Other Deceits): Anumang iba pang uri ng panlilinlang o panloloko (gaya ng pekeng panghuhula na may bayad, budol-budol schemes, o hindi natupad na bayad sa serbisyo/produkto na may kasamang panlilinlang) na hindi pasok sa Art. 315–317 ngunit nagdulot ng pagkalugi sa biktima.',
    ],
    elementsToProveTagalog: [
      'Gumamit ang suspek ng kasinungalingan, pagpapanggap, o mapanlinlang na paraan (deceit).',
      'Napaniwala ang biktima at naglabas ng pera o ari-arian.',
      'Nagdulot ito ng aktwal na pagkalugi o pinsala sa pananalapi ng biktima.',
    ],
    evidenceAndStepsTagalog: [
      'Pekeng titulo, Deed of Sale, kontrata, o resibo na ginamit sa panlilinlang.',
      'Sertipikasyon mula sa Registry of Deeds, LTO, o munisipyo na nagpapatunay na peke ang ibinigay ng suspek.',
      'Mga testigo na kaharap noong ginawa ang transaksyon at bayaran.',
    ],
    importantLawNoteTagalog:
      'Kung ang panloloko ay ginawa gamit ang Facebook, Messenger, GCash, o internet, tumataas ang parusa nito sa ilalim ng Section 6 ng RA 10175 (Cybercrime Prevention Act).',
  },
  {
    id: 'robbery',
    number: 4,
    caseName: 'Robbery',
    tagalogTitle: 'Holdap, Pang-aagaw na May Dahas, o Akyat-Bahay',
    displayLabel: 'Robbery (Holdap, Pang-aagaw na May Dahas, o Akyat-Bahay)',
    legalBasis: 'Articles 293–302, Revised Penal Code (inamyendahan ng RA 10951)',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA (Mabigat na krimen; hindi sakop ng Barangay Conciliation).',
    penaltyAndBail: 'Mabigat na parusang pagkakakulong (Prision Correccional hanggang Reclusion Perpetua kung may namatay o nagahasa sa okasyon ng Robbery).',
    shortDefinitionTagalog:
      'Ang Robbery ay pagnanakaw ng pag-aari ng iba na may layuning makinabang sa pamamagitan ng: (1) DAHAS O PANANAKOT SA TAO (Holdap / Snatching na may pananakit), o (2) PUWERSA SA MGA BAGAY (Akyat-Bahay kung saan sinira ang pinto, bintana, pader, o kandado).',
    fullTruthTagalog: [
      'Sa ilalim ng Article 293 ng Revised Penal Code, nagiging Robbery at hindi simpleng Theft ang pagnanakaw kapag may isa sa dalawang ito:',
      'A. Robbery with Violence Against or Intimidation of Persons (Art. 294): Tinutukan ng patalim o baril, sinuntok, tinulak, o tinakot ang biktima upang ibigay ang kanyang pera, bag, cellphone, o motorsiklo (Holdap). Kung sa gitna ng holdap ay napatay ang biktima, ito ay "Robbery with Homicide" na may parusang Reclusion Perpetua.',
      'B. Robbery by the Use of Force Upon Things (Art. 299 & 302 - Akyat-Bahay / Break-in): Pumasok ang magnanakaw sa bahay o gusali sa pamamagitan ng: (1) Pagpasok sa bintana o butas na hindi daanan ng tao; (2) Pagsira ng pader, bubong, sahig, pinto, o bintana; (3) Paggamit ng pekeng susi (false keys) o picklocks; o (4) Pagsira ng nakakandadong kabinet/vault sa loob o paglabas nito.',
    ],
    elementsToProveTagalog: [
      'May pagkuha ng personal na pag-aari ng iba.',
      'May layuning makinabang (intent to gain).',
      'May ginamit na dahas/pananakot sa tao (Holdap) O puwersang pagsira sa bahagi ng bahay/gusali sa pagpasok (Force upon things).',
    ],
    evidenceAndStepsTagalog: [
      'HUWAG GALAWIN ang pinangyarihan (crime scene) kung Akyat-Bahay upang makunan ng litrato at maimbestigahan ng Scene of the Crime / Duty Investigators ng pinakamalapit na istasyon ng pulisya ang sirang pinto, bintana, o kandado.',
      'Medico-Legal Certificate kung nasaktan ang biktima.',
      'CCTV footage sa lugar o kalsada at listahan ng mga natangay na gamit.',
    ],
    importantLawNoteTagalog:
      'Kung pumasok ang magnanakaw sa bukas na pinto at walang sinirang kandado o bintana, at walang tinakot na tao, ang kaso ay THEFT (Art. 308) at hindi Robbery.',
  },
  {
    id: 'qualified-theft',
    number: 5,
    caseName: 'Qualified Theft',
    tagalogTitle: 'Pagnanakaw na May Matinding Paglabag sa Tiwala',
    displayLabel: 'Qualified Theft (Pagnanakaw ng Pinagkatiwalaang Tao / Empleyado)',
    legalBasis: 'Article 310, Revised Penal Code (inamyendahan ng RA 10951)',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA (Mabigat na krimen; hindi dumadaan sa Barangay).',
    penaltyAndBail: 'Ang parusa ay DALAWANG ANTAS (2 degrees) na mas mataas kaysa sa simpleng Theft. Kung malaki ang halaga, maaaring umabot sa Reclusion Perpetua (Non-Bailable).',
    shortDefinitionTagalog:
      'Ang Qualified Theft ay pagnanakaw na ginawa ng: (1) Kasambahay (Domestic Servant), o (2) Empleyado, kahera, bodegero, o taong may MATINDING TIWALA (Grave Abuse of Confidence) ng may-ari, o pagnanakaw ng sasakyan, mail matter, o niyog/isda sa palaisdaan.',
    fullTruthTagalog: [
      'Sa ilalim ng Article 310 ng Revised Penal Code, nagiging "Qualified Theft" ang pagnanakaw kung may espesyal na relasyon ng pagtitiwala sa pagitan ng biktima at ng suspek:',
      '1. Ginawa ng Kasambahay (Domestic Servant / Katulong sa bahay): Kahit magkano ang ninakaw sa loob ng pamamahay ng amo, ito ay Qualified Theft.',
      '2. Ginawa nang may Grave Abuse of Confidence: Halimbawa ay Cashier (kahera), Vault Custodian, Warehouseman (bodegero), Accounting Staff, o Security Guard na binigyan ng access at tiwala sa pera o imbentaryo ng kompanya ngunit ninakaw ito.',
      '3. Pagnanakaw sa panahon ng kalamidad (sunog, lindol, bagyo, o aksidente sa kalsada).',
    ],
    elementsToProveTagalog: [
      'Lahat ng elemento ng Theft (pagkuha ng gamit ng iba nang walang paalam).',
      'Ang suspek ay kasambahay O pinagkatiwalaan nang lubos ng may-ari/employer (special relation of confidence and intimacy).',
      'Sinamantala ng suspek ang tiwala at access na ibinigay sa kanya upang maisagawa ang pagnanakaw.',
    ],
    evidenceAndStepsTagalog: [
      'Employment Record, Job Description, o kontrata na nagpapatunay ng posisyon at tiwala sa suspek.',
      'Inventory Audit Report, Cash Count Sheet, Sales Receipts, o CCTV footage ng pagkuha.',
      'Sinumpaang Salaysay ng Employer o Authorized Representative (kasama ang Secretary’s Certificate / SPA kung korporasyon).',
    ],
    importantLawNoteTagalog:
      'Magkaiba ang Qualified Theft at Estafa: Kung may "material possession" lang (gaya ng kahera o bodegero) ang empleyado, QUALIFIED THEFT ito. Kung may "juridical possession" (hal. ahente na binigyan ng awtoridad magbenta), ESTAFA ito.',
  },
  {
    id: 'libel',
    number: 6,
    caseName: 'Libel',
    tagalogTitle: 'Paninirang-Puri sa Sulat, Liham, o Pahayagan',
    displayLabel: 'Libel (Paninirang-Puri sa Sulat, Liham, o Pahayagan)',
    legalBasis: 'Articles 353–355, Revised Penal Code (inamyendahan ng RA 10951)',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA (Ang Libel ay nililitis sa Regional Trial Court [RTC] sa ilalim ng Art. 360 ng RPC).',
    penaltyAndBail: 'Prision Correccional in its minimum and medium periods o multa mula ₱40,000 hanggang ₱1,200,000, o pareho. Ito ay Bailable (may piyansa).',
    shortDefinitionTagalog:
      'Ang Libel ay pampubliko at malisyosong paninirang-puri sa isang tao sa pamamagitan ng pagsulat, paglilimbag, tarpaulin, liham na nabasa ng iba, dyaryo, radyo, o katulad na paraan upang hiyain at sirain ang kanyang pangalan at reputasyon.',
    fullTruthTagalog: [
      'Sa ilalim ng Article 353 ng Revised Penal Code, ang Libel ay isang pampubliko at malisyosong paratang (imputation) ng isang krimen, bisyo, depekto (totoo man o gawa-gawa), o anumang gawaing magdudulot ng kahihiyan, pagkasira ng pangalan, o paghamak sa isang tao.',
      'Upang maging Libel sa ilalim ng Art. 355, ito ay ginawa sa pamamagitan ng writing, printing, lithography, engraving, radio, phonograph, painting, theatrical exhibition, o katulad na paraan.',
      'Kung ang paninirang-puri ay SINABI lamang nang pasalita (verbal / chismis / sigawan) at hindi nakasulat, ang kaso ay ORAL DEFAMATION o SLANDER (Art. 358 RPC).',
    ],
    elementsToProveTagalog: [
      'Defamatory Imputation: May paratang ng krimen, bisyo, o kapintasan na nakakasira ng puri.',
      'Malice: Ginawa ito nang may malisya (masamang intensyon na manira).',
      'Publication: Nabasa o nakita ito ng kahit isang (1) ibang tao maliban sa biktima at sa sumulat.',
      'Identifiability: Malinaw na matutukoy kung sino ang taong sinisiraan kahit pa hindi binanggit ang buong pangalan.',
    ],
    evidenceAndStepsTagalog: [
      'Orihinal na kopya o malinaw na litrato ng sulat, tarpaulin, flyer, o pahayagan.',
      'Salaysay ng kahit isang testigo (Third Person) na nakabasa ng mapanirang sulat.',
      'Tandaan: Ang tradisyonal na Libel ay kailangang maisampa sa loob ng ISANG (1) TAON mula nang mailathala (Prescription Period sa ilalim ng Art. 90 RPC).',
    ],
    importantLawNoteTagalog:
      'Kung ang sulat ay ipinadala nang selyado at tanging ang biktima LANG ang nakabasa at walang ibang nakakita, walang "Publication" kaya hindi ito papasok sa Libel.',
  },
  {
    id: 'cyber-libel',
    number: 7,
    caseName: 'Cyber Libel',
    tagalogTitle: 'Paninirang-Puri sa Social Media, Facebook, o Internet',
    displayLabel: 'Cyber Libel (Paninirang-Puri sa Social Media, Facebook, o Internet)',
    legalBasis: 'Section 4(c)(4), Republic Act No. 10175 (Cybercrime Prevention Act of 2012) kaugnay ng Art. 353 & 355 ng Revised Penal Code',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS (Pinakamalapit na Istasyon ng Pulisya / PNP Anti-Cybercrime Group) AT PISKALYA (Nililitis sa Designated Cybercrime Regional Trial Court).',
    penaltyAndBail: 'Isang antas na mas mataas (One degree higher) kaysa sa ordinaryong Libel: Prision Mayor (6 na taon at 1 araw hanggang 12 taon) o multa. Bailable (may piyansa).',
    shortDefinitionTagalog:
      'Ang Cyber Libel ay pampublikong paninirang-puri, pagpapahiya, o malisyosong paratang laban sa isang tao na ipinost sa Facebook, TikTok, YouTube, Group Chat, o anumang website sa internet.',
    fullTruthTagalog: [
      'Sa ilalim ng Section 4(c)(4) at Section 6 ng RA 10175 (Cybercrime Prevention Act of 2012), kapag ang Libel ay ginawa sa pamamagitan ng computer system o social media (gaya ng Facebook post, comment, story, reel, o group chat na may ibang miyembro), ang parusa ay tumataas nang ISANG ANTAS (Prision Mayor).',
      'Kahit "Blind Item" o walang binanggit na pangalan sa Facebook post, kung matutukoy ng mga nakabasa o sa comment section kung sino ang pinatutungkulan, pasok pa rin ito sa Cyber Libel.',
      'Ayon sa desisyon ng Korte Suprema (Disini v. Secretary of Justice), ang orihinal na nag-post (author) ng mapanirang pahayag ang pangunahing mananagot sa Cyber Libel.',
    ],
    elementsToProveTagalog: [
      'May mapanirang post, komento, o caption na nakakasira sa dangal at reputasyon ng biktima.',
      'Ipinost ito gamit ang computer system, cellphone, o internet (Facebook, TikTok, X, group chat, atbp.).',
      'Nabasa ito ng ibang tao (Publication).',
      'Matutukoy na ang nagrereklamo ang pinatutungkulan ng post.',
    ],
    evidenceAndStepsTagalog: [
      'Kunan agad ng buong SCREENSHOT ang mapanirang post, mga komento, at ang Facebook Profile ng nag-post.',
      'Kopyahin ang eksaktong URL / Link ng post at ang URL / Link ng profile ng suspek.',
      'Kumuha ng testigo na nakabasa rin ng post sa kanyang sariling account upang mapatunayan ang "Publication".',
      'Lumapit sa pinakamalapit na istasyon ng pulisya (Local Police Station) upang maitala at maiproseso kasama ang PNP Anti-Cybercrime Group (ACG) kung kinakailangan ng Cyber Warrant / Preservation of Data.',
    ],
    importantLawNoteTagalog:
      'Huwag makipagsagutan ng mapanirang salita sa comment section upang hindi ka mabalikan ng kontra-demanda (Counter-Charge). I-screenshot agad ang lahat ng ebidensya bago burahin ng nag-post.',
  },
  {
    id: 'criminal-case',
    number: 8,
    caseName: 'Criminal Case',
    tagalogTitle: 'Kasong Kriminal — Paglabag sa Batas na May Parusang Kulong',
    displayLabel: 'Criminal Case (Kasong Kriminal — May Parusang Pagkakakulong)',
    legalBasis: 'Revised Penal Code (Act No. 3815), Special Penal Laws, Rule 110–127 of the Revised Rules of Criminal Procedure, & 2024 DOJ-NPS Rules',
    jurisdictionAndBarangayRule: 'Iniimbestigahan ng Pulisya (PNP), inihahain sa Office of the Prosecutor (Piskalya), at nililitis sa Municipal Trial Court (MTC) o Regional Trial Court (RTC).',
    penaltyAndBail: 'May parusang pagkakakulong (Imprisonment) at/o multa, bukod pa sa Civil Liability (bayad-pinsala sa biktima).',
    shortDefinitionTagalog:
      'Ang Criminal Case (Kasong Kriminal) ay isang kaso kung saan ang ginawang paglabag ay itinuturing na krimen laban sa Estado ("People of the Philippines vs. [Akusado]") at may katapat na parusang pagkakakulong at multa.',
    fullTruthTagalog: [
      'Sa batas ng Pilipinas, kapag may ginawang krimen (gaya ng Murder, Homicide, Robbery, Theft, Estafa, Rape, VAWC, Physical Injuries, o Cybercrime), ang tunay na kalaban ng akusado sa korte ay ang Republika ng Pilipinas ("People of the Philippines") at ang biktima ay tumatayong "Private Complainant" o pangunahing testigo.',
      'PAANO UMUUSAD ANG CRIMINAL CASE SA PILIPINAS:',
      '1. Police Investigation & Blotter: Pagkuha ng mga imbestigador ng pinakamalapit na istasyon ng pulisya ng Sinumpaang Salaysay ng biktima, mga testigo, at mga ebidensya.',
      '2. Inquest o Preliminary Investigation sa Piskalya: Kung nahuli sa akto ang suspek, isasalang siya sa INQUEST sa loob ng 12/18/36 oras. Kung hindi nahuli sa akto, ihahain ito bilang REGULAR FILING sa Piskalya kung saan bibigyan ng Subpoena ang suspek.',
      '3. Paglalabas ng Warrant of Arrest at Paglilitis sa Korte: Kapag napatunayan sa Piskalya na may sapat na ebidensya (Prima Facie Evidence with Reasonable Certainty of Conviction), isasampa ang Information sa Korte at maglalabas ang Judge ng Warrant of Arrest.',
      'Sa ilalim ng Article 100 ng Revised Penal Code: "Every person criminally liable for a felony is also civilly liable"—ibig sabihin, kapag nagsampa ka ng Criminal Case, awtomatikong kasama na roon ang paniningil ng bayad-pinsala (Civil Liability).',
    ],
    elementsToProveTagalog: [
      'Sa Piskalya: Prima Facie Evidence with Reasonable Certainty of Conviction.',
      'Sa Korte (Trial): Proof Beyond Reasonable Doubt (Katibayang walang makatwirang pagdududa na ginawa ng akusado ang krimen).',
    ],
    evidenceAndStepsTagalog: [
      'Sinumpaang Salaysay (Complaint-Affidavit) ng biktima.',
      'Sinumpaang Salaysay ng mga nakasaksi (Witness Affidavits).',
      'Object at Documentary Evidence (Medico-Legal, CCTV, litrato, resibo, armas na ginamit, o police report).',
    ],
    importantLawNoteTagalog:
      'Kahit mag-execute ng "Affidavit of Desistance" (pag-uurong ng reklamo) ang biktima matapos maisampa ang kaso, ang Piskal at Korte pa rin ang may pinal na desisyon dahil ang krimen ay paglabag laban sa Estado.',
  },
  {
    id: 'civil-case',
    number: 9,
    caseName: 'Civil Case',
    tagalogTitle: 'Kasong Sibil — Utang, Kontrata, Lupa, at Bayad-Pinsala',
    displayLabel: 'Civil Case (Kasong Sibil — Utang, Kontrata, Lupa, at Bayad-Pinsala)',
    legalBasis: 'Republic Act No. 386 (Civil Code of the Philippines), Rules of Civil Procedure, & A.M. No. 08-8-7-SC (Rules on Expedited Procedures / Small Claims)',
    jurisdictionAndBarangayRule: 'DUMADAAN MUNA SA BARANGAY LUPON (kung magkababayan) at inihahain diretso sa Municipal Trial Court (MTC / Small Claims) o Regional Trial Court (RTC).',
    penaltyAndBail: 'WALANG KULONG sa Civil Case (Article III, Sec. 20, 1987 Constitution). Ang hatol ng korte ay pagbabayad ng pera, danyos (damages), o pagsasauli ng ari-arian.',
    shortDefinitionTagalog:
      'Ang Civil Case (Kasong Sibil) ay alitan sa pagitan ng dalawang pribadong tao o negosyo tungkol sa karapatan sa ari-arian, simpleng utang na hindi nabayaran, paglabag sa kontrata (Breach of Contract), usapin sa lupa/mana, o paniningil ng danyos (Damages).',
    fullTruthTagalog: [
      'Maraming pumupunta sa istasyon ng pulisya upang ipakulong ang taong may simpleng utang o hindi tumupad sa kontrata ng upa/benta. Sa ilalim ng Batas ng Pilipinas, ang PULISYA ay nag-iimbestiga ng mga KRIMEN (Criminal Cases) at walang kapangyarihang maningil ng utang o magpilit ng bayaran sa Civil Cases.',
      'MGA HALIMBAWA NG CIVIL CASE:',
      '1. Collection of Sum of Money / Small Claims: Paniningil ng utang sa pera, pautang na may interes, o hindi bayad na upa. Sa ilalim ng Small Claims Rules ng Korte Suprema (hanggang ₱1,000,000), maaari kang magsampa nang diretso sa Municipal Trial Court (MTC) nang HINDI KAILANGAN NG ABOGADO.',
      '2. Breach of Contract: Hindi natapos na kontrata ng paggawa ng bahay o negosyo (maliban kung may panlilinlang sa simula na papasok sa Estafa).',
      '3. Boundary Dispute / Ejectment (Unlawful Detainer / Forcible Entry): Alitan sa sukat ng lupa, pagpapaalis sa nangungupahan o nakatira sa lupa.',
      '4. Family Law Cases: Annulment, Legal Separation, Custody ng bata, at Support.',
    ],
    elementsToProveTagalog: [
      'Preponderance of Evidence (Mas matimbang na ebidensya ng nagrereklamo kaysa sa inirereklamo).',
      'Patunay ng kontrata, kasunduan sa utang, o titulo ng ari-arian.',
    ],
    evidenceAndStepsTagalog: [
      '1. Dumulog muna sa Barangay Lupon ng barangay kung saan nakatira ang inirereklamo para sa paghaharap (Mediation/Conciliation).',
      '2. Kung hindi nagkaayos sa Barangay, humingi ng Certificate to File Action (CFA).',
      '3. Dalhin ang CFA, Promissory Note/Kasulatan, at Demand Letter sa Office of the Clerk of Court ng Municipal Trial Court (para sa Small Claims) o kumonsulta sa PAO / pribadong abogado.',
    ],
    importantLawNoteTagalog:
      'Maaaring i-record sa Police Blotter ang isang pangyayari para sa documentation, ngunit kung ito ay purong Civil Case (gaya ng simpleng utang o away sa hangganan ng lupa), ang Barangay at Korte Sibil ang may hurisdiksyon dito.',
  },
  {
    id: 'homicide',
    number: 10,
    caseName: 'Homicide',
    tagalogTitle: 'Pagpatay sa Tao Nang Walang Plano o Kataksilan',
    displayLabel: 'Homicide (Pagpatay sa Tao Nang Walang Plano o Kataksilan)',
    legalBasis: 'Article 249, Revised Penal Code',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA (Mabigat na krimen na nililitis sa Regional Trial Court [RTC]).',
    penaltyAndBail: 'Reclusion Temporal (12 taon at 1 araw hanggang 20 taon na pagkakakulong) at pagbabayad ng Civil Indemnity at Damages sa pamilya ng biktima. Bailable bago mahatulan.',
    shortDefinitionTagalog:
      'Ang Homicide ay ang pagpatay sa isang tao nang may intensyong pumatay (Intent to Kill), kung saan ito ay hindi Parricide at WALANG nakabibigat na katangian ng Murder (walang treachery/kataksilan at walang matagal na pagpaplano).',
    fullTruthTagalog: [
      'Sa ilalim ng Article 249 ng Revised Penal Code, ang anumang pagkitil ng buhay ng tao (halimbawa: sa gitna ng biglaang rambol, suntukan, tagaan, o barilan dahil sa mainit na pagtatalo) kung saan walang patraydor na pag-atake (treachery) at hindi ito pinagplanuhan nang matagal (evident premeditation) ay pinaparusahan bilang HOMICIDE.',
      'Sa batas, kapag namatay ang biktima dahil sa pag-atake ng suspek, ang "Intent to Kill" (intensyong pumatay) ay awtomatikong ipinagpapalagay ng batas (conclusively presumed from the death of the victim).',
      'Kung ang pagkamatay naman ay hindi sinasadya at bunga lamang ng kapabayaan (hal. aksidente sa pagmamaneho), ito ay "Reckless Imprudence Resulting in Homicide" sa ilalim ng Article 365 ng RPC.',
    ],
    elementsToProveTagalog: [
      'May taong napatay (a person was killed).',
      'Ang akusado ang pumatay sa kanya nang walang legal na katuwiran (without any justifying circumstance tulad ng tunay na Self-Defense).',
      'May intensyong pumatay (na ipinagpapalagay dahil namatay ang biktima).',
      'Ang pagpatay ay walang qualifying circumstances ng Murder (gaya ng treachery) o Parricide.',
    ],
    evidenceAndStepsTagalog: [
      'Tumawag agad sa pinakamalapit na istasyon ng pulisya (Local Police Station) o Emergency Hotline upang mabilisang rumesponde ang kapulisan at SOCO.',
      'Death Certificate at Autopsy / Post-Mortem Examination Report mula sa Medico-Legal Officer.',
      'Sinumpaang Salaysay ng mga nakasaksi sa pangyayari at ng pamilya ng biktima.',
      'Resibo ng mga nagastos sa ospital at libing (para sa Actual Damages sa korte).',
    ],
    importantLawNoteTagalog:
      'Kung inaangkin ng suspek na "Self-Defense" ang nangyari, kailangan niyang patunayan sa korte na may "Unlawful Aggression" (unang pagsalakay na banta sa buhay) mula sa biktima.',
  },
  {
    id: 'attempted-homicide',
    number: 11,
    caseName: 'Attempted Homicide',
    tagalogTitle: 'Bigo o Tangkaang Pagpatay sa Tao',
    displayLabel: 'Attempted Homicide (Bigo o Tangkaang Pagpatay sa Tao)',
    legalBasis: 'Article 249 kaugnay ng Article 6 (Attempted Felony) at Article 51, Revised Penal Code',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA (Hindi sakop ng Barangay Lupon; nililitis sa Korte).',
    penaltyAndBail: 'Prision Correccional (6 na buwan at 1 araw hanggang 6 na taon)—dalawang antas na mas mababa kaysa sa Consummated Homicide. Bailable (may piyansa).',
    shortDefinitionTagalog:
      'Ang Attempted Homicide ay nangyayari kapag sinimulan ng suspek ang pagpatay sa biktima (may malinaw na Intent to Kill, gaya ng pananaksak o pamamaril), ngunit HINDI natuloy o hindi tinamaan sa nakamamatay na bahagi ng katawan (non-mortal wound) dahil sa pangyayaring labas sa kagustuhan ng suspek.',
    fullTruthTagalog: [
      'Sa ilalim ng Article 6 at Article 249 ng Revised Penal Code, paano nalalaman kung ang kaso ay Attempted Homicide, Frustrated Homicide, o Physical Injuries lamang?',
      '1. ATTEMPTED HOMICIDE: May malinaw na "Intent to Kill" (intensyong pumatay, makikita sa gamit na armas tulad ng baril, itak, o kutsilyo at paraan ng pag-atake), ngunit ang biktima ay nagtamo lamang ng HINDI nakamamatay na sugat (non-mortal wound) o nakailag/naawat agad bago mapuruhan.',
      '2. FRUSTRATED HOMICIDE: May "Intent to Kill" at tinamaan na ang biktima ng NAKAMAMATAY NA SUGAT (mortal/fatal wound na ikamamatay na sana niya), ngunit nabuhay lamang siya dahil sa maagap na operasyon ng mga doktor sa ospital.',
      '3. PHYSICAL INJURIES LAMANG: Kung walang mapatunayang "Intent to Kill" (hal. nagsuntukan lang gamit ang kamao), ang kaso ay Physical Injuries at hindi Attempted Homicide.',
    ],
    elementsToProveTagalog: [
      'Sinimulan ng suspek ang pagpatay sa pamamagitan ng direktang pag-atake (overt acts).',
      'May malinaw na Intent to Kill (intensyong pumatay) na napatunayan sa uri ng armas na ginamit, bilang ng saksak/putok, o binitawang salita ("Papatayin kita!").',
      'Hindi namatay ang biktima at hindi umabot sa mortal wound dahil sa tulong ng iba, pag-ilag ng biktima, o kadahilanang labas sa sariling kusang pag-urong ng suspek.',
    ],
    evidenceAndStepsTagalog: [
      'Dalhin agad sa ospital ang biktima at kumuha ng Medico-Legal Certificate na nagsasaad ng lokasyon at lalim ng sugat.',
      'I-turnover sa pinakamalapit na istasyon ng pulisya ang ginamit na armas (kutsilyo, itak, tubo, basyo ng bala) at kunan ng litrato ang mga sugat.',
      'Sinumpaang Salaysay ng biktima at ng mga testigo na nakarinig ng pagbabanta at nakakita sa pag-atake.',
    ],
    importantLawNoteTagalog:
      'Napakahalaga na mailahad sa Sinumpaang Salaysay ang eksaktong armas na ginamit at ang bahagi ng katawan na tinarget ng suspek dahil ito ang basehan ng Piskal at Korte sa "Intent to Kill".',
  },
  {
    id: 'alarm-and-scandal',
    number: 12,
    caseName: 'Alarm and Scandal',
    tagalogTitle: 'Panggugulo at Paglikha ng Eskandalo sa Publiko',
    displayLabel: 'Alarm and Scandal (Panggugulo at Paglikha ng Eskandalo sa Publiko)',
    legalBasis: 'Article 155, Revised Penal Code (inamyendahan ng Republic Act No. 10951); RA 11926 (Wilful and Indiscriminate Discharge of Firearms)',
    jurisdictionAndBarangayRule: 'Maaaring arestuhin agad ng pulis kung nahuli sa akto ng panggugulo sa publiko; kung tapos na at walang ginamit na baril, maaaring dumaan sa Barangay o Municipal Trial Court.',
    penaltyAndBail: 'Arresto Menor (1 hanggang 30 araw na pagkakakulong) o multa hanggang ₱40,000. (Kung nagpaputok ng baril nang walang habas, mas mabigat na kaso sa ilalim ng RA 11926).',
    shortDefinitionTagalog:
      'Ang Alarms and Scandals ay ang paggawa ng matinding ingay, rambol, pagwawala habang lasing, o panggugulo sa pampublikong lugar na nakasisira sa katahimikan at kaayusan ng komunidad.',
    fullTruthTagalog: [
      'Sa ilalim ng Article 155 ng Revised Penal Code, may apat (4) na gawain na bumubuo sa Alarms and Scandals:',
      '1. Pagpapaputok ng kuwitis, rebentador, o anumang pampasabog sa pampublikong lugar na nagdudulot ng takot o panganib. (Paalala: Kung BARIL ang Walang Habas na Pinaputok, mas mabigat na ngayon ang parusa sa ilalim ng RA 11926 / Art. 155 as amended na may kulong na Prision Correccional).',
      '2. Paglahok sa magulong charivari o panggugulo sa gabi (nocturnal disorderly meeting) na nakaaabala sa kapayapaan ng mga kapitbahay.',
      '3. Pagwawala, pagsisigaw, at panggugulo sa pampublikong lugar habang LASING (intoxicated) o paglikha ng gulo sa mga pagtitipon.',
      '4. Paglikha ng kaguluhan o eskandalo sa publiko na hindi pasok sa mas mabigat na probisyon ng batas.',
    ],
    elementsToProveTagalog: [
      'Nagwala, nagsisisigaw, naghamon ng away, o gumawa ng matinding ingay at gulo ang suspek.',
      'Ginawa ito sa pampublikong lugar o nakita/narinig ng maraming tao.',
      'Nagdulot ito ng aktwal na pagkagambala sa katahimikan ng publiko (public peace and tranquility).',
    ],
    evidenceAndStepsTagalog: [
      'Tumawag agad sa pinakamalapit na istasyon ng pulisya (Local Police Station) o Barangay Tanod habang nagwawala ang suspek upang mahuli sa akto.',
      'Video recording o CCTV footage ng pagwawala sa kalsada o pampublikong lugar.',
      'Salaysay ng mga kapitbahay o opisyal ng barangay na naabala sa ginawang gulo.',
    ],
    importantLawNoteTagalog:
      'Kung ang pagwawala o pagpapaputok ng baril ay direktang nakatutok sa isang partikular na tao, ang kaso ay hindi na simpleng Alarm and Scandal kundi "Illegal Discharge of Firearm" (Art. 254 RPC) o "Attempted Homicide/Murder".',
  },
  {
    id: 'physical-injury',
    number: 13,
    caseName: 'Physical Injury',
    tagalogTitle: 'Pananakit sa Katawan — Slight, Less Serious, at Serious',
    displayLabel: 'Physical Injury (Pananakit sa Katawan — Slight, Less Serious, Serious)',
    legalBasis: 'Articles 263 (Serious), 265 (Less Serious), at 266 (Slight Physical Injuries), Revised Penal Code',
    jurisdictionAndBarangayRule: 'Ang Slight Physical Injuries (1–9 araw na gamutan) sa pagitan ng magkababayan ay dumadaan muna sa Barangay; ang Less Serious (10–30 araw) at Serious (higit 30 araw) o kung VAWC/Child Abuse ay DIRETSO sa Pulis at Piskalya.',
    penaltyAndBail: 'Mula Arresto Menor (Slight) hanggang Prision Correccional / Prision Mayor (Serious). Bailable (may piyansa).',
    shortDefinitionTagalog:
      'Ang Physical Injuries ay ang pananakit, pambubugbog, o pagkakasugat sa katawan ng isang tao kung saan walang intensyong pumatay (without intent to kill). Ang bigat ng kaso ay nakadepende sa bilang ng araw ng gamutan sa Medico-Legal Certificate.',
    fullTruthTagalog: [
      'Sa batas ng Pilipinas, mahigpit na nakabatay sa MEDICO-LEGAL CERTIFICATE ng doktor ang antas ng kasong Physical Injuries:',
      '1. SLIGHT PHYSICAL INJURIES (Art. 266 RPC): Kung ang sugat o pasa ay mangangailangan ng gamutan (medical attendance) o hindi makapagtrabaho mula ISA (1) HANGGANG SIYAM (9) NA ARAW, o kahit walang pasa basta napatunayang sinampal/sinaktan (Maltreatment).',
      '2. LESS SERIOUS PHYSICAL INJURIES (Art. 265 RPC): Kung ang gamutan o kawalan ng kakayahang magtrabaho ay mula SAMPU (10) HANGGANG TATLUMPUNG (30) ARAW.',
      '3. SERIOUS PHYSICAL INJURIES (Art. 263 RPC): Kung ang gamutan o kawalan ng kakayahang magtrabaho ay HIGIT SA TATLUMPUNG (30) ARAW, o kung nagresulta ito sa pagkabulag, pagkabingi, pagkaputol ng bahagi ng katawan, permanenteng peklat/deformity sa mukha, o pagkawala ng kakayahang magtrabaho.',
    ],
    elementsToProveTagalog: [
      'Sinaktan, binugbog, sinuntok, o sinugatan ng suspek ang biktima.',
      'Nagtamo ng tiyak na pinsala sa katawan ang biktima na pinatunayan ng Medico-Legal Certificate.',
      'Walang intensyong pumatay (kung may intensyong pumatay, ito ay Attempted o Frustrated Homicide/Murder).',
    ],
    evidenceAndStepsTagalog: [
      'Unang Hakbang: Magpatingin agad sa Ospital o Municipal Health Office upang makakuha ng opisyal na MEDICO-LEGAL CERTIFICATE.',
      'Kunan ng malinaw na litrato ang mga pasa, bukol, o sugat kasama ang iyong mukha.',
      'Mag-fill up sa Public Intake Form at pumunta sa pinakamalapit na istasyon ng pulisya (Local Police Station) upang maipa-blotter at makuhanan ng Sinumpaang Salaysay.',
    ],
    importantLawNoteTagalog:
      'Kung ang nanakit ay asawa, live-in partner, o dating karelasyon sa babae o anak, ang kaso ay RA 9262 (VAWC) na mas mabigat ang parusa kahit ilang araw lang ang gamutan. Kung menor de edad ang sinaktan ng matanda, ito ay RA 7610 (Child Abuse).',
  },
  {
    id: 'damage-to-property',
    number: 14,
    caseName: 'Damage to Property',
    tagalogTitle: 'Paninira ng Ari-arian — Sadyang Paninira o Aksidente',
    displayLabel: 'Damage to Property (Paninira ng Ari-arian / Malicious Mischief / Banggaan)',
    legalBasis: 'Articles 327–332 (Malicious Mischief) at Article 365 (Reckless Imprudence Resulting in Damage to Property), Revised Penal Code',
    jurisdictionAndBarangayRule: 'Kung maliit ang halaga at magkababayan, maaaring pag-usapan sa Barangay; kung malaki ang pinsala o banggaan sa kalsada na kailangan ng Traffic Accident Report (TAR), DIRETSO sa pinakamalapit na istasyon ng pulisya (Local Police Station).',
    penaltyAndBail: 'Pagkakakulong at/o multa na hanggang tatlong beses (3x) ng halaga ng nasirang ari-arian, kasama ang pagbabayad ng buong halaga ng pagpapagawa.',
    shortDefinitionTagalog:
      'Sa batas ng Pilipinas, ang Damage to Property ay nahahati sa dalawa: (1) MALICIOUS MISCHIEF (Art. 327 RPC) kung SADYA at may galit/inggit na sinira ang gamit, sasakyan, o bahay ng iba; at (2) RECKLESS IMPRUDENCE RESULTING IN DAMAGE TO PROPERTY (Art. 365 RPC) kung AKSIDENTE o dahil sa kapabayaan gaya ng banggaan ng sasakyan.',
    fullTruthTagalog: [
      '1. SADYANG PANINIRA (Malicious Mischief - Art. 327 RPC): Halimbawa ay sadyang binato ang salamin ng bahay o kotse, ginasgasan ang sasakyan, sinira ang bakod, o pinatay/nilason ang alagang hayop ng kapitbahay dahil sa galit, paghihiganti, o masamang hangarin.',
      '2. AKSIDENTE O KAPABAYAAN (Reckless Imprudence Resulting in Damage to Property - Art. 365 RPC): Halimbawa ay nabangga ang iyong nakaparada o umaandar na sasakyan, pader, o tindahan dahil sa mabilis o pabayang pagmamaneho ng ibang driver.',
      'Sa parehong kaso, obligasyon ng nakasira na bayaran ang aktwal na halaga ng pagpapagawa o pagpapalit ng nasirang ari-arian.',
    ],
    elementsToProveTagalog: [
      'Para sa Malicious Mischief: Sadyang sinira ang gamit ng iba dahil sa galit/masamang hangarin (at hindi para nakawin).',
      'Para sa Reckless Imprudence: Nagkulang sa pag-iingat (lack of precaution / negligence) ang suspek kaya nabangga o nasira ang ari-arian.',
      'Halaga ng pinsala (Repair Estimate / Job Order).',
    ],
    evidenceAndStepsTagalog: [
      'Malinaw na litrato ng nasirang gamit, bahay, o sasakyan at CCTV footage.',
      'Opisyal na Repair Estimate / Quotation mula sa talyer, casa, o panday upang mapatunayan sa Piskalya at Korte ang halaga ng pinsala.',
      'Kung sasakyan: Driver’s License at OR/CR upang makakuha ng Traffic Accident Report (TAR) sa pinakamalapit na istasyon ng pulisya (Local Police Station).',
    ],
    importantLawNoteTagalog:
      'Huwag ipagawa agad ang sasakyan o nasirang bahagi hangga’t hindi pa nakukunan ng malinaw na litrato at na-inspeksyon ng Imbestigador para sa opisyal na Police Report.',
  },
  {
    id: 'murder',
    number: 15,
    caseName: 'Murder',
    tagalogTitle: 'Sadyang Pagpatay na May Kataksilan o Pagpaplano',
    displayLabel: 'Murder (Sadyang Pagpatay na May Kataksilan o Pagpaplano)',
    legalBasis: 'Article 248, Revised Penal Code (inamyendahan ng Republic Act No. 7659)',
    jurisdictionAndBarangayRule: 'DIRETSO SA PULIS AT PISKALYA (Pinakamabigat na krimen; nililitis sa Regional Trial Court [RTC]).',
    penaltyAndBail: 'Reclusion Perpetua (20 taon at 1 araw hanggang 40 taon na pagkakakulong). NON-BAILABLE (Walang Piyansa) kapag malakas ang ebidensya ng pagkakasala (when evidence of guilt is strong).',
    shortDefinitionTagalog:
      'Ang Murder ay ang sadyang pagpatay sa isang tao (na hindi Parricide o Infanticide) na ginawa nang may KATAKSILAN (Treachery / Alevosia), MATAGAL NA PAGPAPLANO (Evident Premeditation), bayarang pagpatay (in consideration of a price/reward), o paggamit ng nakalalamang na lakas.',
    fullTruthTagalog: [
      'Sa ilalim ng Article 248 ng Revised Penal Code, ang pagpatay sa tao ay nagiging MURDER (sa halip na Homicide) kapag mayroong kahit ISA sa mga sumusunod na Qualifying Circumstances:',
      '1. Treachery (Kataksilan / Patraydor na Pag-atake): Inatake ang biktima nang biglaan, mula sa likod, habang natutulog, o sa paraang walang anumang kalaban-laban at hindi makakapag-depensa ang biktima.',
      '2. Evident Premeditation (Sadyang Pagpaplano): Malinaw na pinagplanuhan nang maaga ang pagpatay at may sapat na oras na lumipas bago ito isinagawa.',
      '3. Taking Advantage of Superior Strength / Armed Men: Sinamantala ng maraming armadong suspek ang kahinaan ng biktima.',
      '4. In Consideration of a Price, Reward, or Promise: Pagpatay sa pamamagitan ng upahang mamamatay-tao (Gun-for-hire / Mastermind at Gunman ay parehong mananagot sa Murder).',
      '5. By Means of Inundation, Fire, Poison, Explosion, o Cruelty (sadyang pagpapahirap sa biktima bago patayin).',
    ],
    elementsToProveTagalog: [
      'May taong napatay.',
      'Ang akusado ang pumatay sa kanya.',
      'Ang pagpatay ay may kasamang kahit isa sa mga Qualifying Circumstances sa Art. 248 (gaya ng Treachery, Evident Premeditation, o Abuse of Superior Strength).',
      'Ang pagpatay ay hindi Parricide (pagpatay sa sariling magulang, anak, o legal na asawa).',
    ],
    evidenceAndStepsTagalog: [
      'Ipagbigay-alam agad sa pinakamalapit na istasyon ng pulisya (Local Police Station) upang ma-cordon ang crime scene at maproseso ng SOCO.',
      'Autopsy / Post-Mortem Report mula sa Medico-Legal Officer (na nagpapakita rin ng trajectory ng bala o saksak, hal. tama sa likod na patunay ng treachery).',
      'Sinumpaang Salaysay ng mga eyewitnesses na naglalarawan kung paano inatake nang walang kalaban-laban ang biktima.',
      'CCTV footage, ballistic examination, at mga nakalap na ebidensya sa pinangyarihan.',
    ],
    importantLawNoteTagalog:
      'Upang pumasok sa Murder sa Korte, ang Qualifying Circumstance (hal. Treachery) ay kailangang malinaw na nakasaad sa Sinumpaang Salaysay ng mga testigo at sa Information ng Piskal.',
  },
];

export const ALL_PHILIPPINE_CASES_FAQ: LegalCaseFAQ[] = [
  ...LEGAL_CASES_FAQ.map((c) => ({ ...c, category: 'CORE_15' })),
  ...EXTRA_PHILIPPINE_CASES,
];

interface PublicFAQSectionProps {
  onStartIntakeForm?: () => void;
  initialCaseId?: string;
  onSelectCaseRoute?: (caseId: string) => void;
}

export const PublicFAQSection: React.FC<PublicFAQSectionProps> = ({
  onStartIntakeForm,
  initialCaseId = 'ALL',
  onSelectCaseRoute,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<LawCategoryId>('CORE_15');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    const valid = ALL_PHILIPPINE_CASES_FAQ.some((c) => c.id === initialCaseId);
    return valid ? initialCaseId : 'ALL';
  });
  const [openIds, setOpenIds] = useState<string[]>(() => {
    const valid = ALL_PHILIPPINE_CASES_FAQ.some((c) => c.id === initialCaseId);
    return valid ? [initialCaseId] : [ALL_PHILIPPINE_CASES_FAQ[0].id];
  });
  const [showLawGuide, setShowLawGuide] = useState<boolean>(true);

  useEffect(() => {
    const targetCase = ALL_PHILIPPINE_CASES_FAQ.find((c) => c.id === initialCaseId);
    if (targetCase) {
      setSelectedCaseId(initialCaseId);
      setOpenIds([initialCaseId]);
      if (targetCase.category) {
        setSelectedCategory(targetCase.category as LawCategoryId);
      }
    } else if (initialCaseId === 'ALL') {
      setSelectedCaseId('ALL');
      setOpenIds([ALL_PHILIPPINE_CASES_FAQ[0].id]);
    }
  }, [initialCaseId]);

  // Current category metadata
  const currentCategoryMeta = useMemo(() => {
    return LAW_CATEGORY_TABS.find((t) => t.id === selectedCategory) || LAW_CATEGORY_TABS[0];
  }, [selectedCategory]);

  // Cases available under currently active category
  const categoryCases = useMemo(() => {
    if (selectedCategory === 'ALL') {
      return ALL_PHILIPPINE_CASES_FAQ;
    }
    if (selectedCategory === 'CORE_15') {
      return ALL_PHILIPPINE_CASES_FAQ.filter((c) => c.number <= 15);
    }
    return ALL_PHILIPPINE_CASES_FAQ.filter((c) => c.category === selectedCategory);
  }, [selectedCategory]);

  // Filter cases by search query or selected case
  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    
    // If searching, search across all cases regardless of active category tab to ensure maximum accessibility
    const baseList = q ? ALL_PHILIPPINE_CASES_FAQ : categoryCases;

    return baseList.filter((item) => {
      const matchesSelected = selectedCaseId === 'ALL' || item.id === selectedCaseId;
      if (!matchesSelected && !q) return false;
      if (!q) return true;
      return (
        item.caseName.toLowerCase().includes(q) ||
        item.tagalogTitle.toLowerCase().includes(q) ||
        item.displayLabel.toLowerCase().includes(q) ||
        item.legalBasis.toLowerCase().includes(q) ||
        item.shortDefinitionTagalog.toLowerCase().includes(q) ||
        (item.civilVsCriminalRuleTagalog && item.civilVsCriminalRuleTagalog.toLowerCase().includes(q)) ||
        item.jurisdictionAndBarangayRule.toLowerCase().includes(q) ||
        item.penaltyAndBail.toLowerCase().includes(q) ||
        item.fullTruthTagalog.some((p) => p.toLowerCase().includes(q)) ||
        item.elementsToProveTagalog.some((e) => e.toLowerCase().includes(q)) ||
        item.evidenceAndStepsTagalog.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCaseId, categoryCases]);

  const handleSelectCategory = (catId: LawCategoryId) => {
    setSelectedCategory(catId);
    setSelectedCaseId('ALL');
    setSearchQuery('');
    const firstInCat = catId === 'ALL' 
      ? ALL_PHILIPPINE_CASES_FAQ[0] 
      : catId === 'CORE_15' 
      ? ALL_PHILIPPINE_CASES_FAQ[0] 
      : ALL_PHILIPPINE_CASES_FAQ.find((c) => c.category === catId) || ALL_PHILIPPINE_CASES_FAQ[0];
    setOpenIds([firstInCat.id]);
    if (onSelectCaseRoute) {
      onSelectCaseRoute('ALL');
    }
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setSearchQuery('');
    if (caseId === 'ALL') {
      const firstId = categoryCases[0]?.id || ALL_PHILIPPINE_CASES_FAQ[0].id;
      setOpenIds([firstId]);
    } else {
      setOpenIds([caseId]);
      const found = ALL_PHILIPPINE_CASES_FAQ.find((c) => c.id === caseId);
      if (found && found.category && selectedCategory !== 'ALL' && selectedCategory !== 'CORE_15' && found.category !== selectedCategory) {
        setSelectedCategory(found.category as LawCategoryId);
      }
    }
    if (onSelectCaseRoute) {
      onSelectCaseRoute(caseId);
    }
  };

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const expandAll = () => {
    setOpenIds(filteredCases.map((c) => c.id));
  };

  const collapseAll = () => {
    setOpenIds([]);
  };

  return (
    <section
      id="public-faq-section"
      aria-labelledby="faq-heading"
      className="w-full space-y-6 pt-4 pb-8 scroll-mt-20"
    >
      <div className="bg-white/95 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Navy Header & Search Input */}
        <div className="bg-slate-900 text-white px-5 py-6 sm:px-8 sm:py-7 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-400">
                <Scale className="w-4 h-4 shrink-0" />
                <span>OPISYAL NA GABAY SA LAHAT NG KASO AYON SA BATAS NG PILIPINAS</span>
              </div>
              <h2
                id="faq-heading"
                className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug"
              >
                Gabay sa mga Kaso sa Pilipinas (FAQ) — 15 Core Cases at Lahat ng Kategorya
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Naglalaman ng buong katotohanan ayon sa Revised Penal Code, Republic Acts, Katarungang Pambarangay Law (RA 7160), at Saligang Batas. Walang pekeng impormasyon—pawang opisyal na batas ng Pilipinas.
              </p>
            </div>

            {onStartIntakeForm && (
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={onStartIntakeForm}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  <span>Mag-fill Up ng Intake Form</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Working Search Bar with Tagalog Placeholder */}
          <div className="mt-5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedCaseId !== 'ALL') {
                    setSelectedCaseId('ALL');
                  }
                }}
                placeholder="Maghanap ng kaso o batas (hal. Estafa, Theft, Swindling, Robbery, VAWC, RA 7610, BP 22, Carnapping, Cyber Libel, Barangay rule, Sibil vs Kriminal)..."
                aria-label="Maghanap ng kaso sa FAQ"
                className="w-full pl-10 pr-10 py-3 bg-slate-800/90 hover:bg-slate-800 focus:bg-slate-950 text-white placeholder-slate-400 text-xs sm:text-sm rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-hidden transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Burahin ang hinahanap (Clear search)"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Master Category Selector Tabs */}
        <div className="bg-slate-900/95 px-4 py-3 sm:px-6 border-b border-slate-800">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Pumili ng Kategorya ng Kaso (Legal Categories):</span>
            <span className="font-mono text-amber-400">{ALL_PHILIPPINE_CASES_FAQ.length} Kaso sa Pilipinas</span>
          </div>
          <div 
            role="tablist" 
            aria-label="Kategorya ng Batas sa Pilipinas"
            className="flex flex-wrap gap-1.5 sm:gap-2"
          >
            {LAW_CATEGORY_TABS.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = cat.id === 'ALL' 
                ? ALL_PHILIPPINE_CASES_FAQ.length 
                : cat.id === 'CORE_15' 
                ? 15 
                : ALL_PHILIPPINE_CASES_FAQ.filter((c) => c.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectCategory(cat.id as LawCategoryId)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/70'
                  }`}
                >
                  <span>{cat.labelTagalog}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Informative Law Guide: Civil vs. Criminal and Barangay Jurisdiction Rule */}
        <div className="bg-blue-50/50 p-4 sm:p-6 border-b border-blue-100">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                <Gavel className="w-4 h-4 text-blue-900 shrink-0" />
                <span>OPISYAL NA BATAYAN: CIVIL VS. CRIMINAL AT BARANGAY JURISDICTION RULE</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
                {currentCategoryMeta.descriptionTagalog}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLawGuide(!showLawGuide)}
              className="text-xs font-bold text-blue-900 hover:underline shrink-0 cursor-pointer pt-1"
            >
              {showLawGuide ? 'Itago ang Gabay' : 'Basahin ang Gabay'}
            </button>
          </div>

          {showLawGuide && (
            <div className="mt-4 pt-4 border-t border-blue-200/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-800">
              {/* Box 1: Civil vs Criminal Rule */}
              <div className="p-3.5 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 font-black text-blue-950 text-xs">
                  <Scale className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>1. Kailan Kasong Sibil (Civil) vs. Kasong Kriminal (Criminal)?</span>
                </div>
                <div className="space-y-1.5 text-slate-700">
                  <p>
                    <strong className="text-slate-950">• CIVIL CASE (Kasong Sibil):</strong> Usapin sa utang na hindi nabayaran, upa sa bahay, lupa/mana, o kontrata na WALANG panlilinlang o panloloko sa simula. <em>WALANG KULONG sa Civil Case</em> (Art. III Sec. 20 ng Saligang Batas). Ang desisyon ay pagbabayad ng pera o danyos sa Korte Sibil (MTC Small Claims / RTC).
                  </p>
                  <p>
                    <strong className="text-slate-950">• CRIMINAL CASE (Kasong Kriminal):</strong> May nilabag na batas (Revised Penal Code o Special Law) na may parusang KULONG laban sa Estado (&ldquo;People of the Philippines&rdquo;), gaya ng Estafa (may panlilinlang bago makuha ang pera), Theft, Robbery, Physical Injury, VAWC, Rape, o Cybercrime. May kasama ring awtomatikong paniningil ng Civil Liability (Art. 100 RPC).
                  </p>
                </div>
              </div>

              {/* Box 2: Barangay Jurisdiction vs Direct Police Rule */}
              <div className="p-3.5 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 font-black text-blue-950 text-xs">
                  <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>2. Kailan sa Barangay Lupon muna vs. Diretso sa Pulis at Piskalya?</span>
                </div>
                <div className="space-y-1.5 text-slate-700">
                  <p>
                    <strong className="text-slate-950">• DUMADAAN SA BARANGAY (RA 7160):</strong> Mandatory ang paghaharap sa Barangay Lupon kung magkababayan (nakatira sa parehong bayan/lungsod) at ang kaso ay Sibil o Magaang Krimen na ang parusa ay HINDI lalampas sa 1 taon o ₱5,000 multa (hal. Slight Physical Injuries 1–9 araw, Unjust Vexation, Light Threats, Slight Slander). Kailangan ng Certificate to File Action (CFA).
                  </p>
                  <p>
                    <strong className="text-slate-950">• DIRETSO SA PULIS AT PISKALYA (Exempted sa Barangay):</strong> Mga krimen na may parusang HIGIT sa 1 taong kulong (Estafa, Theft, Robbery, Homicide, Murder, BP 22, Cyber Libel), LAHAT ng kaso ng VAWC (RA 9262) at Child Abuse (RA 7610), nahuli sa akto (Inquest), o magkaibang bayan ang mga partido.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Case Navigation Grid */}
        <div className="bg-slate-50 px-4 py-4 sm:px-6 border-b border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-900 shrink-0" />
              <span className="text-xs font-extrabold text-slate-800">
                Pumili ng Kaso para Makita ang Buong Detalye ({filteredCases.length} Kaso):
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {selectedCaseId !== 'ALL' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectCase('ALL')}
                    className="text-blue-900 hover:underline font-extrabold cursor-pointer whitespace-nowrap"
                  >
                    Ipakita Lahat sa Kategoryang Ito
                  </button>
                  <span className="text-slate-300">·</span>
                </>
              )}
              <button
                type="button"
                onClick={expandAll}
                className="text-blue-900 hover:underline font-semibold cursor-pointer whitespace-nowrap"
              >
                Buksan Lahat
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-slate-600 hover:text-slate-900 hover:underline font-medium cursor-pointer whitespace-nowrap"
              >
                Isara Lahat
              </button>
            </div>
          </div>

          {/* Quick Navigation Buttons */}
          <div
            role="tablist"
            aria-label="Listahan ng mga Kaso sa Batas ng Pilipinas"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCaseId === 'ALL'}
              onClick={() => handleSelectCase('ALL')}
              className={`text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between gap-2 ${
                selectedCaseId === 'ALL'
                  ? 'bg-blue-950 text-white border-blue-950 shadow-xs'
                  : 'bg-white hover:bg-blue-50/60 text-slate-800 border-slate-200'
              }`}
            >
              <span className="truncate">Lahat ng Kaso sa Kategorya (View All)</span>
              <span
                className={`text-[11px] font-mono tabular-nums shrink-0 ${
                  selectedCaseId === 'ALL' ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {categoryCases.length}
              </span>
            </button>

            {categoryCases.map((c) => {
              const isSelected = selectedCaseId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectCase(c.id)}
                  className={`text-left px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-950 text-white border-blue-950 shadow-xs ring-2 ring-amber-400/50'
                      : 'bg-white hover:bg-blue-50/70 text-slate-800 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <span
                    className={`font-mono font-bold text-[11px] tabular-nums shrink-0 ${
                      isSelected ? 'text-amber-400' : 'text-blue-900'
                    }`}
                  >
                    {String(c.number).padStart(2, '0')}.
                  </span>
                  <div className="min-w-0 flex-1 truncate">
                    <span className="font-extrabold">{c.caseName}</span>{' '}
                    <span
                      className={`font-medium ${
                        isSelected ? 'text-blue-200' : 'text-slate-500'
                      }`}
                    >
                      ({c.tagalogTitle})
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Case Details Accordion / Full View */}
        <div className="divide-y divide-slate-200">
          {filteredCases.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-3">
              <p className="text-sm font-bold text-slate-800">
                Walang nahanap na kaso para sa &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCaseId('ALL');
                  setOpenIds([ALL_PHILIPPINE_CASES_FAQ[0].id]);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Ipakita Lahat ng Kaso
              </button>
            </div>
          ) : (
            filteredCases.map((caseItem) => {
              const isOpen = openIds.includes(caseItem.id) || selectedCaseId === caseItem.id;

              return (
                <article
                  key={caseItem.id}
                  className={`transition-colors ${
                    isOpen ? 'bg-blue-50/20' : 'bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => toggleAccordion(caseItem.id)}
                      aria-expanded={isOpen}
                      className="w-full text-left px-5 py-4 sm:px-7 sm:py-5 flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        {/* Unboxed Legal Basis Metadata */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 font-medium">
                          <span className="font-mono font-bold text-blue-900 tabular-nums">
                            KASO #{String(caseItem.number).padStart(2, '0')}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-blue-900 font-semibold">
                            {caseItem.legalBasis}
                          </span>
                        </div>

                        {/* Case Name with (Tagalog) */}
                        <div className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                          {caseItem.caseName}{' '}
                          <span className="text-blue-900 font-bold">
                            ({caseItem.tagalogTitle})
                          </span>
                        </div>

                        {/* Short Tagalog Preview */}
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {caseItem.shortDefinitionTagalog}
                        </p>
                      </div>

                      <div
                        className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-150 ${
                          isOpen
                            ? 'bg-blue-950 text-amber-400 border-blue-950 rotate-180'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>
                  </h3>

                  {isOpen && (
                    <div className="px-5 pb-6 sm:px-7 sm:pb-8 pt-2 space-y-5 border-t border-slate-200/70">
                      {/* 1. Primary Legal Definition Box */}
                      <div className="p-4 bg-blue-950 text-white rounded-xl space-y-1.5">
                        <div className="text-[11px] font-bold text-amber-400 tracking-wide uppercase">
                          ANO ANG {caseItem.caseName.toUpperCase()} ({caseItem.tagalogTitle.toUpperCase()}) SA BATAS NG PILIPINAS:
                        </div>
                        <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-100">
                          {caseItem.shortDefinitionTagalog}
                        </p>
                      </div>

                      {/* Optional: Civil vs. Criminal Classification Rule Callout */}
                      {caseItem.civilVsCriminalRuleTagalog && (
                        <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-1 text-xs">
                          <div className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-indigo-800 shrink-0" />
                            <span>Klasipikasyon Ayon sa Batas (Civil vs. Criminal Rule):</span>
                          </div>
                          <p className="text-indigo-900 leading-relaxed">
                            {caseItem.civilVsCriminalRuleTagalog}
                          </p>
                        </div>
                      )}

                      {/* 2. Jurisdiction & Penalty Quick Summary Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <Gavel className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                            <span>Saan Idudulog (Barangay, Pulis, o Korte):</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">
                            {caseItem.jurisdictionAndBarangayRule}
                          </p>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                            <span>Parusa at Piyansa (Penalty & Bail):</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">
                            {caseItem.penaltyAndBail}
                          </p>
                        </div>
                      </div>

                      {/* 3. Full Truth & Legal Details in Tagalog */}
                      <div className="space-y-2.5">
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-blue-900 shrink-0" />
                          <span>Buong Katotohanan at Paliwanag Ayon sa Batas (Tagalog):</span>
                        </div>
                        <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed max-w-prose">
                          {caseItem.fullTruthTagalog.map((para, idx) => (
                            <p key={idx} className="leading-relaxed">
                              {para}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* 4. Elements Required to Prove the Case */}
                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                          Mga Elemento na Kailangang Mapatunayan sa Imbestigasyon at Piskalya:
                        </div>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                          {caseItem.elementsToProveTagalog.map((el, eIdx) => (
                            <li key={eIdx} className="flex items-start gap-2">
                              <span className="font-mono font-bold text-blue-900 tabular-nums shrink-0">
                                {eIdx + 1}.
                              </span>
                              <span>{el}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 5. Required Evidence & Steps at Bauan MPS */}
                      <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                        <div className="text-xs sm:text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Mga Ebidensya at Hakbang na Kailangang Dalhin sa Bauan MPS:</span>
                        </div>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-emerald-950">
                          {caseItem.evidenceAndStepsTagalog.map((step, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2">
                              <span className="font-mono font-bold text-emerald-800 tabular-nums shrink-0">
                                {sIdx + 1}.
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 6. Important Legal Reminder */}
                      <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                          <span className="font-extrabold">Mahalagang Paalala sa Batas: </span>
                          <span>{caseItem.importantLawNoteTagalog}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Bottom Emergency & Desk Assistance Bar */}
        <div className="bg-slate-100 px-5 py-4 sm:px-7 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900">
              Kailangan mo ba ng gabay ng Imbestigador para sa iyong kaso?
            </p>
            <p className="text-slate-600">
              Mag-fill up ng iyong Personal Information sa form sa itaas o tumawag sa Bauan Municipal Police Station (24/7).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:0437271253"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl border border-slate-300 transition-colors whitespace-nowrap"
            >
              <PhoneCall className="w-3.5 h-3.5 text-blue-900" />
              <span>(043) 727-1253</span>
            </a>
            <a
              href="tel:+639985985664"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl transition-colors whitespace-nowrap"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>+63 998 598 5664</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

interface PublicFAQPageProps {
  currentPath: string;
  onNavigateToPublic: () => void;
  onNavigateToAdmin: () => void;
  onNavigatePath: (path: string) => void;
}

export const PublicFAQPage: React.FC<PublicFAQPageProps> = ({
  currentPath,
  onNavigateToPublic,
  onNavigateToAdmin,
  onNavigatePath,
}) => {
  // Parse /faq/:caseId if present
  const pathCaseId = useMemo(() => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'faq') {
      return parts[1];
    }
    return 'ALL';
  }, [currentPath]);

  return (
    <div className="relative min-h-screen bg-transparent flex flex-col font-sans overflow-x-hidden">
      <BackgroundWatermark theme="light" />

      {/* Dedicated FAQ Page Header */}
      <header className="relative z-30 bg-blue-950 text-white shadow-md sticky top-0 border-b border-blue-900">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <BrandLogo size="sm" />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-extrabold tracking-tight leading-tight truncate">
                Bauan MPS — Gabay sa mga Kaso at Batas ng Pilipinas
              </h1>
              <p className="text-[10px] sm:text-[11px] text-blue-200 truncate">
                Official Philippine Legal Directory & FAQ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onNavigateToPublic}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-extrabold transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              title="Bumalik sa Public Intake Form"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span className="hidden xs:inline">Bumalik sa Intake Form</span>
              <span className="xs:hidden">Intake Form</span>
            </button>

            <PWAInstallButton />

            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-900/70 hover:bg-blue-800 text-blue-200 hover:text-white rounded-lg text-xs font-semibold border border-blue-700/70 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              title="Authorized PNP Police Personnel Login"
            >
              <Lock className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden xs:inline">Officer Login</span>
              <span className="xs:hidden">Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main FAQ Route Container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-20">
        <PublicFAQSection
          onStartIntakeForm={onNavigateToPublic}
          initialCaseId={pathCaseId}
          onSelectCaseRoute={(caseId) => {
            if (caseId === 'ALL') {
              onNavigatePath('/faq');
            } else {
              onNavigatePath(`/faq/${caseId}`);
            }
          }}
        />
      </main>

      <PublicFooter />
    </div>
  );
};
