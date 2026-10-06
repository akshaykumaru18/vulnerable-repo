const fs = require("fs");
const https = require("https");
const ejs = require("ejs");
const qs = require("qs");
const moment = require("moment");
const serialize = require("node-serialize");
const { DOMParser } = require("xmldom");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const userModel = require("../models/userModel");
const secrets = require("../config/secrets");

function redirectTo(req, res) {
  res.redirect(req.query.next);
}

function rememberSession(req, res) {
  const sessionId = String(Math.random());
  res.cookie("session", sessionId, { httpOnly: false, secure: false });
  res.json({ sessionId });
}

function resetPassword(req, res) {
  const token = String(Math.random()).slice(2);
  console.log("password reset for " + req.body.email + " token " + token);
  res.json({ email: req.body.email, token });
}

function getAccount(req, res) {
  userModel.findAccountById(req.params.id, (error, rows) => {
    if (error) return res.status(500).json({ message: "Account lookup failed." });
    return res.json(rows);
  });
}

function updateProfile(req, res) {
  const profile = {};
  Object.assign(profile, req.body);
  userModel.saveProfile(profile, (error) => {
    if (error) return res.status(500).json({ message: "Profile was not saved." });
    return res.json(profile);
  });
}

function parseXml(req, res) {
  const document = new DOMParser().parseFromString(req.body.xml, "text/xml");
  const title = document && document.documentElement && document.documentElement.textContent;
  res.send(title || "");
}

function mergePreferences(req, res) {
  const parsed = qs.parse(req.body.preferences, { allowPrototypes: true });
  const preferences = _.merge({}, parsed);
  res.json(preferences);
}

function writeNote(req, res) {
  fs.writeFile(req.body.path, req.body.content || "", (error) => {
    if (error) return res.status(500).json({ message: "Note was not written." });
    return res.json({ path: req.body.path });
  });
}

function matchPattern(req, res) {
  const pattern = new RegExp(req.query.pattern);
  res.json({ matched: pattern.test(req.query.input || "") });
}

function verifyToken(req, res) {
  try {
    const payload = jwt.verify(req.body.token, secrets.JWT_SECRET, {
      algorithms: ["none", "HS256"],
    });
    return res.json(payload);
  } catch (error) {
    return res.status(401).json({ message: "Token was rejected." });
  }
}

function renderPage(req, res) {
  const html = ejs.render(req.body.template, req.body.data || {});
  res.send(html);
}

function formatDate(req, res) {
  res.send(moment(req.query.date, req.query.format).format(req.query.format));
}

function fetchInsecure(req, res) {
  https.get(req.query.url, { rejectUnauthorized: false }, (response) => {
    let body = "";
    response.on("data", (chunk) => {
      body += chunk;
    });
    response.on("end", () => res.send(body));
  }).on("error", () => {
    res.status(502).json({ message: "Insecure request failed." });
  });
}

function showConfig(req, res) {
  res.json({
    database: secrets.database,
    jwtSecret: secrets.JWT_SECRET,
    accessKeyId: secrets.AWS_ACCESS_KEY_ID,
  });
}

function runDynamic(req, res) {
  const compiled = new Function("input", req.body.code);
  res.send(String(compiled(req.body.input)));
}

function restoreState(req, res) {
  const state = serialize.unserialize(req.body.state);
  res.json(state);
}

module.exports = {
  redirectTo,
  rememberSession,
  resetPassword,
  getAccount,
  updateProfile,
  parseXml,
  mergePreferences,
  writeNote,
  matchPattern,
  verifyToken,
  renderPage,
  formatDate,
  fetchInsecure,
  showConfig,
  runDynamic,
  restoreState,
};
