const http = require("node:http");
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const { JWT_SECRET } = require("../config/secrets");
const { hashPassword } = require("./credentials");
const app = require("../app");

const passwordHash = hashPassword("correct-horse");

userModel.findUserByEmail = (email, callback) => {
  if (email === "ada@example.com") {
    return callback(null, {
      id: 7,
      name: "Ada",
      email,
      password_hash: passwordHash,
    });
  }
  return callback(null, null);
};

function request(server, method, path, body) {
  const { port } = server.address();
  const payload = body === undefined ? null : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: payload
          ? {
              "content-type": "application/json",
              "content-length": Buffer.byteLength(payload),
            }
          : {},
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode,
            body: raw ? JSON.parse(raw) : null,
          });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test("login rejects missing credentials and unknown or wrong passwords", async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());

  const missing = await request(server, "POST", "/api/token", { email: "ada@example.com" });
  assert.equal(missing.status, 400);

  const unknown = await request(server, "POST", "/api/token", {
    email: "missing@example.com",
    password: "correct-horse",
  });
  assert.equal(unknown.status, 401);

  const wrong = await request(server, "POST", "/api/token", {
    email: "ada@example.com",
    password: "wrong-password",
  });
  assert.equal(wrong.status, 401);
});

test("login issues an HS256 token for a matching password", async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());

  const response = await request(server, "POST", "/api/token", {
    email: "Ada@Example.com",
    password: "correct-horse",
  });
  assert.equal(response.status, 200);
  assert.match(response.body.sessionId, /^[0-9a-f]{64}$/);

  const payload = jwt.verify(response.body.token, JWT_SECRET, { algorithms: ["HS256"] });
  assert.equal(payload.sub, 7);
  assert.equal(payload.email, "ada@example.com");
  assert.equal(Object.hasOwn(payload, "passwordHash"), false);
});

test("password reset requires an email and does not return a token", async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());

  const missing = await request(server, "POST", "/api/password-reset", {});
  assert.equal(missing.status, 400);

  const accepted = await request(server, "POST", "/api/password-reset", {
    email: "ada@example.com",
  });
  assert.equal(accepted.status, 200);
  assert.equal(Object.hasOwn(accepted.body, "token"), false);
});

test("token verification requires a token", async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());

  const missing = await request(server, "POST", "/api/verify", {});
  assert.equal(missing.status, 400);
});
