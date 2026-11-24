// Plain-language descriptions of the demo identities and roles.

import { clientForRole, type Client } from "../domain/clients";
import type { User } from "../domain/types";

export type Workspace = "field" | "console";

export const ROLE_LABELS: Record<string, string> = {
  delivery_associate: "Delivery associate",
  maintenance_technician: "Maintenance technician",
  hub_supervisor: "Hub supervisor",
  forklift_operator: "Forklift operator",
  branch_officer: "Branch officer",
  branch_manager: "Branch manager",
  store_associate: "Store associate",
  admin: "Delivery manager",
  author: "Instructional designer",
  sme: "Subject-matter expert",
  bilingual_reviewer: "Language reviewer",
  hazard_reviewer: "Safety checker",
  analyst: "Learning analyst",
  worker: "Frontline worker",
};

const DOES: Record<string, string> = {
  "arjun.rider": "Picks up parcels. Gets the steps on the job in his own language.",
  "deepa.supervisor": "Runs the hub. Can open restricted cash-settlement guidance.",
  "lakshmi.tech": "Inspects conveyors and isolates machines. Safety-critical steps with diagrams.",
  "karthik.forklift": "Checks his forklift before each shift, in Tamil or Hindi.",
  "farhan.officer": "Opens the cash counter and checks customer documents.",
  "priya.store": "Keeps the shop floor safe. Uses the app in Marathi.",
  "asha.author": "Turns client SOPs into drafts, translations and slides.",
  "vikram.sme": "Reviews drafts, classifies risk and publishes.",
  "meera.sme": "A second expert, so nobody approves their own work.",
  "kavya.bilingual": "Approves translations and translated media.",
  "ravi.hazard": "Independently checks safety wording in translations.",
  "nisha.analyst": "Reports usage, gaps and practice results to each client.",
  admin: "Ships knowledge packages to clients and keeps the audit trail.",
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

/** The client organisation a frontline user works for (Swift staff have none). */
export function clientOf(user: User | null | undefined): Client | undefined {
  return clientForRole(user?.workRole);
}
