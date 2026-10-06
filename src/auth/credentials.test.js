const test = require("node:test");
const assert = require("node:assert/strict");
const {
  hashPassword,
  verifyPassword,
  credentialsMatch,
  createSessionId,
} = require("./credentials");

test("accepts the password that was hashed", () => {
  const stored = hashPassword("correct-horse");
  assert.equal(verifyPassword("correct-horse", stored), true);
});

test("rejects a wrong password", () => {
  const stored = hashPassword("correct-horse");
  assert.equal(verifyPassword("wrong-password", stored), false);
});

test("rejects a missing user and a malformed hash", () => {
  assert.equal(credentialsMatch(null, "secret"), false);
  assert.equal(credentialsMatch({ email: "a@b.c" }, "secret"), false);
  assert.equal(credentialsMatch({ password_hash: "md5$abc" }, "secret"), false);
});

test("session ids are 64 hex characters and not reused", () => {
  const id = createSessionId();
  assert.match(id, /^[0-9a-f]{64}$/);
  assert.notEqual(id, createSessionId());
});
