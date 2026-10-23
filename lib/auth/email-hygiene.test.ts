import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyMxHosts,
  disposableListsAvailable,
  isDisposable,
  MX_DISPOSABLE,
  MX_NONE,
  MX_OK,
  normalizeEmail,
} from "./email-hygiene.ts";

test("disposable blocklists load from the project root", () => {
  assert.equal(disposableListsAvailable, true);
});

test("normalizes Gmail tags and dots to the same mailbox", () => {
  assert.equal(normalizeEmail(" F.Oo+promo@GMAIL.com "), "foo@gmail.com");
  assert.equal(normalizeEmail("foo+promo@googlemail.com"), "foo@googlemail.com");
});

test("strips plus aliases only for providers that ignore them", () => {
  assert.equal(normalizeEmail("person+shop@outlook.com"), "person@outlook.com");
  assert.equal(normalizeEmail("first.last+shop@yahoo.com"), "first.last@yahoo.com");
  assert.equal(normalizeEmail("first.last+shop@example.com"), "first.last+shop@example.com");
});

test("blocks disposable domains and their subdomains", () => {
  assert.equal(isDisposable("person@temp-mail.org"), true);
  assert.equal(isDisposable("person@mailinator.com"), true);
  assert.equal(isDisposable("person@sub.mailinator.com"), true);
  assert.equal(isDisposable("person@notmailinator.net"), false);
});

test("classifies explicit MX hosts and null MX", () => {
  assert.equal(classifyMxHosts(["mx1.yopmail.com."]), MX_DISPOSABLE);
  assert.equal(classifyMxHosts(["mail.example.com."]), MX_OK);
  assert.equal(classifyMxHosts(["."]), MX_NONE);
  assert.equal(classifyMxHosts([]), MX_NONE);
});
