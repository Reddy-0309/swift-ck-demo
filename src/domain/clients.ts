// Client organisations that Swift Solutions serves. Swift produces e-learning programmes for
// them; this platform adds the approved point-of-work guidance, practice and evidence that go
// with each programme. Every organisation, programme and person here is fictional.
//
// Customer material belongs to its client: objects are mapped to exactly one client through
// their source document, and packages and insights are scoped per client.

import type { AnalyticsEvent, DemoState, Language, Scenario } from "./types";

export type DeliveryModel = "A" | "B";
export type Maturity = "knowledge" | "competency" | "dynamic";

export interface ClientModule {
  id: string;
  title: Partial<Record<Language, string>> & { en: string };
  minutes: number;
  format: "Video lesson" | "Interactive lesson" | "Micro-lesson" | "Simulation";
  /** Knowledge objects (by key) that support this module at the point of work. */
  objectKeys: string[];
  /** Tasks the module prepares people for; a task with no approved guidance is a gap. */
  taskIds: string[];
  scenarioKeys: string[];
}

export interface ClientTask {
  code: string;
  icon: string;
  situations?: string[];
  assets?: string[];
}

export interface Client {
  id: string;
  name: string;
  short: string;
  industry: string;
  location: string;
  workforce: number;
  /** Source documents whose IDs start with one of these prefixes belong to this client. */
  documentPrefixes: string[];
  roles: string[];
  tasks: ClientTask[];
  languages: Language[];
  deliveryModel: DeliveryModel;
  delivery: string;
  maturity: Maturity;
  sponsor: string;
  programme: { code: string; title: string; summary: string; lms: string; modules: ClientModule[] };
  colour: string;
}

export const MATURITY_LABEL: Record<Maturity, string> = {
  knowledge: "Knowledge enablement",
  competency: "Competency enablement",
  dynamic: "Dynamic knowledge & learning",
};

export const MATURITY_TEXT: Record<Maturity, string> = {
  knowledge: "Approved guidance delivered with the course.",
  competency: "Adds practice, independent checks and refresher evidence.",
  dynamic: "Adds a continuing governed knowledge service.",
};

export const DELIVERY_LABEL: Record<DeliveryModel, string> = {
  A: "Model A · knowledge package",
  B: "Model B · governed service",
};

export const CLIENTS: Client[] = [
  {
    id: "cl-logistics",
    name: "Synthetic Logistics Co.",
    short: "Synthetic Logistics",
    industry: "Logistics and last-mile delivery",
    location: "Bengaluru hub network",
    workforce: 98,
    documentPrefixes: ["sop-dl"],
    roles: ["delivery_associate", "hub_supervisor"],
    tasks: [
      { code: "T-PICKUP", icon: "truck", situations: ["DAMAGED_PACKAGE", "ADDRESS_MISMATCH", "LEAKING_CONTENTS"] },
      { code: "T-RETURNS", icon: "returns" },
      { code: "T-COD-REVIEW", icon: "cash" },
    ],
    languages: ["en", "kn", "ta", "te", "hi", "ml", "mr", "bn"],
    deliveryModel: "A",
    delivery: "Knowledge package installed in the client's rider app and linked from each LMS module.",
    maturity: "competency",
    sponsor: "Head of Operations Training",
    programme: {
      code: "SL-LMD-01",
      title: "Last-mile delivery essentials",
      summary: "Onboarding course for new delivery associates and hub supervisors.",
      lms: "Client LMS · SCORM 1.2 course",
      modules: [
        {
          id: "SL-M1",
          title: { en: "Safe parcel handling", hi: "पार्सल को सुरक्षित रूप से संभालना", kn: "ಪಾರ್ಸೆಲ್ ಅನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ನಿರ್ವಹಿಸುವುದು", ta: "பார்சலைப் பாதுகாப்பாகக் கையாளுதல்" },
          minutes: 18,
          format: "Video lesson",
          objectKeys: ["sop-dl-014.standard-parcel-pickup"],
          taskIds: ["T-PICKUP"],
          scenarioKeys: [],
        },
        {
          id: "SL-M2",
          title: { en: "Exceptions at pickup", hi: "पिकअप के समय अपवाद", kn: "ಪಿಕಪ್ ಸಮಯದ ವಿನಾಯಿತಿಗಳು", ta: "பிக்அப்பின் போது விதிவிலக்குகள்" },
          minutes: 22,
          format: "Interactive lesson",
          objectKeys: ["sop-dl-014.damaged-packaging-at-pickup", "sop-dl-014.address-mismatch-at-pickup"],
          taskIds: ["T-PICKUP"],
          scenarioKeys: ["damaged-package-pickup"],
        },
        {
          id: "SL-M3",
          title: { en: "Collecting customer returns", hi: "ग्राहक रिटर्न लेना", kn: "ಗ್ರಾಹಕ ರಿಟರ್ನ್ ಸಂಗ್ರಹ", ta: "வாடிக்கையாளர் ரிட்டர்ன் சேகரிப்பு" },
          minutes: 15,
          format: "Micro-lesson",
          objectKeys: [],
          taskIds: ["T-RETURNS"],
          scenarioKeys: [],
        },
        {
          id: "SL-M4",
          title: { en: "Cash-on-delivery settlement (supervisors)" },
          minutes: 20,
          format: "Interactive lesson",
          objectKeys: ["sop-dl-014.cash-on-delivery-discrepancy-review"],
          taskIds: ["T-COD-REVIEW"],
          scenarioKeys: [],
        },
      ],
    },
    colour: "#1754a6",
  },
  {
    id: "cl-manufacturing",
    name: "Ironleaf Components Pvt. Ltd.",
    short: "Ironleaf Components",
    industry: "Manufacturing",
    location: "Hosur plant",
    workforce: 46,
    documentPrefixes: ["sop-mt"],
    roles: ["maintenance_technician", "forklift_operator"],
    tasks: [
      { code: "T-CONV-INSPECT", icon: "cog", assets: ["EQ-1000-A", "EQ-1000-B", "EQ-2000-X"] },
      { code: "T-LOTO", icon: "lock" },
      { code: "T-FORKLIFT-CHECK", icon: "forklift", assets: ["FL-25-01", "FL-25-02"] },
    ],
    languages: ["en", "ta", "kn", "hi", "ml", "te", "mr", "bn"],
    deliveryModel: "B",
    delivery: "Governed knowledge service called from the plant's maintenance app; always the current approved version.",
    maturity: "competency",
    sponsor: "Plant EHS Manager",
    programme: {
      code: "IL-PS-02",
      title: "Plant safety and equipment care",
      summary: "Safety-critical course for maintenance technicians and forklift operators.",
      lms: "Client LMS · xAPI course",
      modules: [
        {
          id: "IL-M1",
          title: { en: "Conveyor daily inspection", ta: "கன்வேயர் தினசரி ஆய்வு", ml: "കൺവെയർ ദൈനംദിന പരിശോധന" },
          minutes: 25,
          format: "Video lesson",
          objectKeys: ["sop-mt-007.daily-inspection-of-conveyor-cv-1000"],
          taskIds: ["T-CONV-INSPECT"],
          scenarioKeys: [],
        },
        {
          id: "IL-M2",
          title: { en: "Lockout and tagout", ta: "லாக்அவுட் மற்றும் டேக்அவுட்", kn: "ಲಾಕ್‌ಔಟ್ ಮತ್ತು ಟ್ಯಾಗ್‌ಔಟ್" },
          minutes: 30,
          format: "Simulation",
          objectKeys: ["sop-mt-012.lockout-and-tagout-before-maintenance"],
          taskIds: ["T-LOTO"],
          scenarioKeys: ["lockout-restart-request"],
        },
        {
          id: "IL-M3",
          title: { en: "Forklift pre-use check", ta: "ஃபோர்க்லிஃப்ட் பயன்பாட்டுக்கு முன் சோதனை", hi: "फोर्कलिफ्ट उपयोग से पहले जाँच" },
          minutes: 16,
          format: "Micro-lesson",
          objectKeys: ["sop-mt-012.forklift-pre-use-check"],
          taskIds: ["T-FORKLIFT-CHECK"],
          scenarioKeys: [],
        },
      ],
    },
    colour: "#0d7a4e",
  },
  {
    id: "cl-bank",
    name: "Tamarind Co-operative Bank",
    short: "Tamarind Bank",
    industry: "Banking (branch operations)",
    location: "42 branches, Karnataka",
    workforce: 38,
    documentPrefixes: ["sop-br"],
    roles: ["branch_officer", "branch_manager"],
    tasks: [
      { code: "T-CASH-OPEN", icon: "cash" },
      { code: "T-KYC-CHECK", icon: "idcard" },
      { code: "T-SUSPICIOUS-TXN", icon: "shield" },
    ],
    languages: ["en", "kn", "hi"],
    deliveryModel: "A",
    delivery: "Help panel inside the core-banking screen; restricted guidance served only through the bank's own backend.",
    maturity: "knowledge",
    sponsor: "Chief Learning Officer",
    programme: {
      code: "TB-BO-01",
      title: "Branch operations onboarding",
      summary: "Course for new branch officers, with help that opens next to the banking screen.",
      lms: "Client LMS · SCORM 2004 course",
      modules: [
        {
          id: "TB-M1",
          title: { en: "Opening the cash counter", kn: "ನಗದು ಕೌಂಟರ್ ತೆರೆಯುವುದು", hi: "नकद काउंटर खोलना" },
          minutes: 14,
          format: "Video lesson",
          objectKeys: ["sop-br-003.opening-the-cash-counter"],
          taskIds: ["T-CASH-OPEN"],
          scenarioKeys: [],
        },
        {
          id: "TB-M2",
          title: { en: "Knowing your customer", kn: "ನಿಮ್ಮ ಗ್ರಾಹಕರನ್ನು ತಿಳಿಯಿರಿ", hi: "अपने ग्राहक को जानें" },
          minutes: 24,
          format: "Interactive lesson",
          objectKeys: ["sop-br-003.customer-identity-check-before-account-opening"],
          taskIds: ["T-KYC-CHECK"],
          scenarioKeys: ["kyc-name-mismatch"],
        },
        {
          id: "TB-M3",
          title: { en: "Spotting suspicious transactions", kn: "ಅನುಮಾನಾಸ್ಪದ ವಹಿವಾಟುಗಳನ್ನು ಗುರುತಿಸುವುದು" },
          minutes: 28,
          format: "Interactive lesson",
          objectKeys: ["sop-br-003.suspicious-cash-deposit"],
          taskIds: ["T-SUSPICIOUS-TXN"],
          scenarioKeys: [],
        },
      ],
    },
    colour: "#5a3ea6",
  },
  {
    id: "cl-retail",
    name: "Corner Basket Stores",
    short: "Corner Basket",
    industry: "Retail",
    location: "60 stores, Maharashtra",
    workforce: 52,
    documentPrefixes: ["sop-rt"],
    roles: ["store_associate"],
    tasks: [
      { code: "T-SPILL", icon: "drop" },
      { code: "T-FIRE-CHECK", icon: "flame" },
      { code: "T-CUSTOMER-INJURY", icon: "plus" },
    ],
    languages: ["en", "hi", "mr", "bn"],
    deliveryModel: "A",
    delivery: "Knowledge package in the store team's handheld app and the course's job aids.",
    maturity: "knowledge",
    sponsor: "Retail Training Lead",
    programme: {
      code: "CB-SS-01",
      title: "Store safety for new joiners",
      summary: "First-week course for store associates.",
      lms: "Client LMS · SCORM 1.2 course",
      modules: [
        {
          id: "CB-M1",
          title: { en: "Keeping the floor safe", hi: "फ़र्श को सुरक्षित रखना", mr: "जमीन सुरक्षित ठेवणे" },
          minutes: 12,
          format: "Micro-lesson",
          objectKeys: ["sop-rt-005.cleaning-up-a-spill-on-the-shop-floor"],
          taskIds: ["T-SPILL"],
          scenarioKeys: ["spill-busy-aisle"],
        },
        {
          id: "CB-M2",
          title: { en: "Fire safety in the store", hi: "स्टोर में अग्नि सुरक्षा", mr: "स्टोअरमधील अग्निसुरक्षा" },
          minutes: 18,
          format: "Video lesson",
          objectKeys: ["sop-rt-005.daily-fire-exit-and-extinguisher-check"],
          taskIds: ["T-FIRE-CHECK"],
          scenarioKeys: [],
        },
        {
          id: "CB-M3",
          title: { en: "When a customer is hurt", hi: "जब कोई ग्राहक घायल हो", mr: "ग्राहक जखमी झाल्यास" },
          minutes: 15,
          format: "Interactive lesson",
          objectKeys: ["sop-rt-005.customer-injury-in-the-store"],
          taskIds: ["T-CUSTOMER-INJURY"],
          scenarioKeys: [],
        },
      ],
    },
    colour: "#b5541c",
  },
];

const BY_ID = new Map(CLIENTS.map((c) => [c.id, c]));

export function getClient(id: string | null | undefined): Client | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function clientForRole(role: string | null | undefined): Client | undefined {
  return role ? CLIENTS.find((c) => c.roles.includes(role)) : undefined;
}

export function clientForTask(task: string | null | undefined): Client | undefined {
  return task ? CLIENTS.find((c) => c.tasks.some((t) => t.code === task)) : undefined;
}

/** Client of an object key or a source document ID (case-insensitive prefix match). */
export function clientForKey(key: string | null | undefined): Client | undefined {
  if (!key) return undefined;
  const value = key.toLowerCase();
  return CLIENTS.find((c) => c.documentPrefixes.some((p) => value.startsWith(p)));
}

export function clientOfObject(s: DemoState, objectId: string | null | undefined): Client | undefined {
  if (!objectId) return undefined;
  return clientForKey(s.objects.find((o) => o.id === objectId)?.objectKey);
}

export function clientOfVersion(s: DemoState, versionId: string): Client | undefined {
  const v = s.versions.find((x) => x.id === versionId);
  return v ? clientOfObject(s, v.objectId) : undefined;
}

/** The client an event belongs to: by the worker's role, then the task, then the object. */
export function clientOfEvent(s: DemoState, e: AnalyticsEvent): Client | undefined {
  return clientForRole(e.context.role) ?? clientForTask(e.taskId) ?? clientOfObject(s, e.objectId);
}

export function clientOfScenario(scenario: Pick<Scenario, "taskId" | "linkedObjectKey">): Client | undefined {
  return clientForTask(scenario.taskId) ?? clientForKey(scenario.linkedObjectKey);
}

export function moduleTitle(m: ClientModule, language: Language): string {
  return m.title[language] ?? m.title.en;
}
