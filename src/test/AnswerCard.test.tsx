import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { as, seededStore } from "./helpers";
import { AnswerCard } from "../components/AnswerCard";
import { CONTRACT_VERSION } from "../domain/contracts";
import { resolve } from "../domain/delivery";
import { ANSWER_TEXT, FIELD_LABELS } from "../domain/labels";

describe("AnswerCard", () => {
  it("renders an approved answer with labels in the worker's language", async () => {
    const store = await seededStore();
    const r = store.transact((s) =>
      resolve(s, as(store, "arjun.rider"), { contract_version: CONTRACT_VERSION, tenant_id: "swift-demo", request_id: "a", host_app_id: "t", host_version: "1", language: "hi", task_id: "T-PICKUP" }),
    );
    render(<AnswerCard response={r} language="hi" state={store.getState()} />);
    expect(screen.getByRole("heading", { name: "सामान्य पार्सल पिकअप" })).toBeTruthy();
    expect(screen.getByText("चरण 3")).toBeTruthy();
    expect(screen.getByText(ANSWER_TEXT.hi.approvedNote)).toBeTruthy();
  });

  it("explains a non-answer in the worker's language", async () => {
    const store = await seededStore();
    const r = store.transact((s) =>
      resolve(s, as(store, "lakshmi.tech"), { contract_version: CONTRACT_VERSION, tenant_id: "swift-demo", request_id: "b", host_app_id: "t", host_version: "1", language: "te", task_id: "T-CONV-INSPECT" }),
    );
    render(<AnswerCard response={r} language="te" state={store.getState()} />);
    expect(screen.getByText(FIELD_LABELS.te.asset_id as string)).toBeTruthy();
    expect(screen.getByRole("heading", { name: ANSWER_TEXT.te.needContext })).toBeTruthy();
  });
});
