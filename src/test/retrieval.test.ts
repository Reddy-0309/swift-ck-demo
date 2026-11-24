import { describe, expect, it } from "vitest";
import { as, seededStore } from "./helpers";
import { CONTRACT_VERSION } from "../domain/contracts";
import { resolve } from "../domain/delivery";
import { missingProtectedTerms, protectedTerms } from "../domain/indic";
import type { Language } from "../domain/types";
import { TRANSLATIONS, DAMAGED_KEY, PICKUP_KEY } from "../seed/translations";

const DAMAGED_QUERIES: [Language, string][] = [
  ["en", "parcel packaging is torn"],
  ["kn", "ಪ್ಯಾಕೇಜಿಂಗ್ ಹಾನಿ"],
  ["ta", "சேதமடைந்த பேக்கேஜிங்"],
  ["te", "దెబ్బతిన్న ప్యాకేజింగ్"],
  ["hi", "पैकेजिंग फटी"],
  ["ml", "കേടായ പാക്കേജിംഗ്"],
  ["mr", "खराब पॅकेजिंग"],
  ["bn", "ক্ষতিগ্রস্ত প্যাকেজিং"],
];

describe("free-text retrieval in every language", () => {
  it.each(DAMAGED_QUERIES)("finds the damaged-packaging procedure in %s", async (language, query) => {
    const store = await seededStore();
    const r = store.transact((s) =>
      resolve(s, as(store, "arjun.rider"), { contract_version: CONTRACT_VERSION, tenant_id: "swift-demo", request_id: "q", host_app_id: "t", host_version: "1", language, query }),
    );
    expect(r.outcome).toBe("answer");
    expect(r.title).toBe(language === "en" ? "Damaged packaging at pickup" : TRANSLATIONS[DAMAGED_KEY]?.[language as Exclude<Language, "en">]?.title);
  });

  it.each([
    ["hi", "packaging phati"],
    ["kn", "packaging hani"],
    ["ta", "packaging sethamadaintha"],
  ] as [Language, string][])("matches transliterated / code-mixed Latin input in %s (%s)", async (language, query) => {
    const store = await seededStore();
    const r = store.transact((s) =>
      resolve(s, as(store, "arjun.rider"), { contract_version: CONTRACT_VERSION, tenant_id: "swift-demo", request_id: "q", host_app_id: "t", host_version: "1", language, query }),
    );
    expect(r.outcome).toBe("answer");
    expect(r.title).toBe(TRANSLATIONS[DAMAGED_KEY]?.[language as Exclude<Language, "en">]?.title);
  });

  it("abstains on an unrelated question", async () => {
    const store = await seededStore();
    const r = store.transact((s) =>
      resolve(s, as(store, "arjun.rider"), { contract_version: CONTRACT_VERSION, tenant_id: "swift-demo", request_id: "q", host_app_id: "t", host_version: "1", language: "en", query: "holiday leave policy" }),
    );
    expect(r).toMatchObject({ outcome: "abstain", reason: "no_confident_match" });
  });
});

describe("protected terms", () => {
  it("extracts codes, measures and numbers", () => {
    expect([...protectedTerms("Check guard G-2 and EST-1; cuts longer than 20 mm, 15 kg")].sort()).toEqual(["1", "15", "15 kg", "2", "20", "20 mm", "EST-1", "G-2"]);
  });

  it("accepts every seeded translation and rejects an altered one", () => {
    for (const [key, byLanguage] of Object.entries(TRANSLATIONS)) {
      for (const translation of Object.values(byLanguage)) {
        for (const text of translation.blocks) {
          expect(missingProtectedTerms(text, text), key).toEqual([]);
        }
      }
    }
    const hi = TRANSLATIONS[PICKUP_KEY]?.hi.blocks[2] as string;
    expect(missingProtectedTerms("Check that the parcel weighs no more than 15 kg; parcels above 15 kg need a two-person lift.", hi)).toEqual([]);
    expect(missingProtectedTerms("parcels above 15 kg need a two-person lift.", hi.replace(/15 kg/g, "१२ kg"))).toEqual(["15", "15 kg"]);
  });
});
