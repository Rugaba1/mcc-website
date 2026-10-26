import assert from "node:assert/strict";
import { test } from "node:test";
import { legalDraftUpdateSchema } from "./draft";
import { toLegalDraftContent } from "./draft-payload";

test("legal edit payload contains only editable fields", () => {
  const content = toLegalDraftContent({
    documentType: "PRIVACY_POLICY",
    title: "Privacy",
    titleFr: "Confidentialité",
    titleRw: "Ibanga",
    contentMarkdown: "English",
    contentMarkdownFr: "Français",
    contentMarkdownRw: "Kinyarwanda",
  });

  assert.deepEqual(Object.keys(content).sort(), [
    "contentMarkdown",
    "contentMarkdownFr",
    "contentMarkdownRw",
    "title",
    "titleFr",
    "titleRw",
  ]);
  assert.equal(legalDraftUpdateSchema.safeParse(content).success, true);
});

test("legal edit validation rejects a payload with documentType", () => {
  const parsed = legalDraftUpdateSchema.safeParse({
    title: "Privacy",
    titleFr: "",
    titleRw: "",
    contentMarkdown: "",
    contentMarkdownFr: "",
    contentMarkdownRw: "",
    documentType: "PRIVACY_POLICY",
  });

  assert.equal(parsed.success, false);
});
