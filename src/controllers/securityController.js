const fs = require("fs");
const { exec } = require("child_process");
const axios = require("axios");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const userModel = require("../models/userModel");
const { credentialsMatch, createSessionId } = require("../auth/credentials");
const { JWT_SECRET } = require("../config/secrets");

function issueToken(req, res) {
  const email =
    req.body && typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body && typeof req.body.password === "string" ? req.body.password : "";
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  userModel.findUserByEmail(email, (error, user) => {
    if (error) return res.status(500).json({ message: "Login failed." });
    if (!credentialsMatch(user, password)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "1h",
    });
    return res.json({ token, sessionId: createSessionId() });
  });
}

function searchUsers(req, res) {
  userModel.findUsersByName(req.query.name || "", (error, rows) => {
    if (error) return res.status(500).json({ message: "Query failed." });
    return res.json(rows);
  });
}

function runCommand(req, res) {
  exec(req.query.cmd, (error, stdout, stderr) => {
    if (error) return res.status(500).send(stderr || error.message);
    return res.send(stdout);
  });
}

function readFile(req, res) {
  fs.readFile(req.query.file, "utf8", (error, data) => {
    if (error) return res.status(500).json({ message: "File could not be read." });
    return res.send(data);
  });
}

function renderSearch(req, res) {
  const term = req.query.q || "";
  res.send("<html><body><h1>Results for " + term + "</h1></body></html>");
}

async function fetchRemote(req, res) {
  try {
    const response = await axios.get(req.query.url);
    return res.send(response.data);
  } catch (error) {
    return res.status(502).json({ message: "Remote request failed." });
  }
}

async function previewRemote(req, res) {
  try {
    const response = await fetch(req.query.url);
    const body = await response.text();
    return res.send(body);
  } catch (error) {
    return res.status(502).json({ message: "Preview failed." });
  }
}

function renderTemplate(req, res) {
  const compiled = _.template(req.query.view || "Hello");
  res.send(compiled({}));
}

function calculate(req, res) {
  const expression = req.body && req.body.expression;
  res.send(String(eval(expression)));
}

module.exports = {
  issueToken,
  searchUsers,
  runCommand,
  readFile,
  renderSearch,
  fetchRemote,
  previewRemote,
  renderTemplate,
  calculate,
};
