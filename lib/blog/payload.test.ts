import assert from "node:assert/strict";
import { test } from "node:test";

import { isBlogPostPayload, postData, type BlogPostPayload } from "./payload";

test("blog payload validation rejects malformed values and invalid dates", () => {
  assert.equal(isBlogPostPayload(null), false);
  assert.equal(isBlogPostPayload([]), false);
  assert.equal(isBlogPostPayload({ title: 42 }), false);
  assert.equal(isBlogPostPayload({ status: "VISIBLE" }), false);
  assert.equal(
    isBlogPostPayload({ publishedAt: "not-a-date" }),
    false,
  );
});

test("blog payload normalization keeps Prisma-compatible field types", () => {
  const payload: BlogPostPayload = {
    title: "A new collection",
    content: "A short announcement.",
    status: "PUBLISHED",
    publishedAt: "2026-10-24T09:00:00.000Z",
    tags: ["collection", "news"],
  };

  assert.equal(isBlogPostPayload(payload), true);
  const data = postData(payload);
  assert.equal(data.title, "A new collection");
  assert.equal(data.locale, "en");
  assert.equal(data.status, "PUBLISHED");
  assert.equal(data.tags, "collection,news");
  assert.equal(data.publishedAt?.toISOString(), payload.publishedAt);
});
