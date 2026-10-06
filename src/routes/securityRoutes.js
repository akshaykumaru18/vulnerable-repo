const express = require("express");
const controller = require("../controllers/securityController");
const exposure = require("../controllers/exposureController");

const router = express.Router();

router.post("/token", controller.issueToken);
router.get("/users", controller.searchUsers);
router.get("/command", controller.runCommand);
router.get("/file", controller.readFile);
router.get("/search", controller.renderSearch);
router.get("/fetch", controller.fetchRemote);
router.get("/preview", controller.previewRemote);
router.get("/template", controller.renderTemplate);
router.post("/calculate", controller.calculate);

router.get("/redirect", exposure.redirectTo);
router.post("/session", exposure.rememberSession);
router.post("/password-reset", exposure.resetPassword);
router.get("/accounts/:id", exposure.getAccount);
router.post("/profile", exposure.updateProfile);
router.post("/xml", exposure.parseXml);
router.post("/preferences", exposure.mergePreferences);
router.post("/notes", exposure.writeNote);
router.get("/match", exposure.matchPattern);
router.post("/verify", exposure.verifyToken);
router.post("/page", exposure.renderPage);
router.get("/date", exposure.formatDate);
router.get("/insecure-fetch", exposure.fetchInsecure);
router.get("/config", exposure.showConfig);
router.post("/dynamic", exposure.runDynamic);
router.post("/state", exposure.restoreState);

module.exports = router;
