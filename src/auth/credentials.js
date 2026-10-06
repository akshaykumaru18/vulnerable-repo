const crypto = require("crypto");

const KEY_LENGTH = 64;

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const DUMMY_HASH = hashPassword("timing-equalization");

function verifyPassword(password, stored) {
  if (typeof password !== "string" || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt" || !parts[1] || !parts[2]) {
    return false;
  }
  const expected = Buffer.from(parts[2], "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = crypto.scryptSync(password, parts[1], KEY_LENGTH);
  return crypto.timingSafeEqual(actual, expected);
}

function credentialsMatch(user, password) {
  if (!user || typeof user.password_hash !== "string") {
    verifyPassword(password, DUMMY_HASH);
    return false;
  }
  return verifyPassword(password, user.password_hash);
}

function createSessionId() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = {
  hashPassword,
  verifyPassword,
  credentialsMatch,
  createSessionId,
};
