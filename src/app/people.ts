// Plain-language descriptions of the demo identities and roles.

import type { User } from "../domain/types";

export type Workspace = "field" | "console";

export const ROLE_LABELS: Record<string, string> = {
  delivery_associate: "Delivery associate",
  maintenance_technician: "Maintenance technician",
  hub_supervisor: "Hub supervisor",
  admin: "Administrator",
  author: "Content author",
  sme: "Subject-matter expert",
  bilingual_reviewer: "Language reviewer",
  hazard_reviewer: "Safety checker",
  analyst: "Analyst",
  worker: "Frontline worker",
};

const DOES: Record<string, string> = {
  "arjun.rider": "Picks up parcels. Asks for steps on the job in his own language.",
  "lakshmi.tech": "Inspects conveyors. Gets safety-critical checks with diagrams.",
  "deepa.supervisor": "Runs the hub. Can see restricted cash-on-delivery procedures.",
  "asha.author": "Uploads SOPs, prepares drafts, translations and media.",
  "vikram.sme": "Reviews drafts, classifies risk and publishes.",
  "meera.sme": "A second expert, so nobody approves their own work.",
  "kavya.bilingual": "Approves translations and localized media.",
  "ravi.hazard": "Independently checks warnings and prohibitions in translations.",
  "nisha.analyst": "Reads usage, gaps and practice results.",
  admin: "Exports knowledge packages and reviews the activity log.",
};

export function workspaceOf(user: User): Workspace {
  return user.workRole ? "field" : "console";
}

export function personName(user: User): string {
  return user.displayName.replace(/\s*\(.*\)$/, "");
}

export function personRole(user: User): string {
  return ROLE_LABELS[user.workRole ?? user.roles[0] ?? ""] ?? user.roles.join(", ");
}

export function personDoes(user: User): string {
  return DOES[user.username] ?? "";
}
