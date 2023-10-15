"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_js_1 = __importDefault(require("./startup/config.js"));
const logger_js_1 = require("./startup/logger.js");
const mongo_js_1 = __importDefault(require("./startup/mongo.js"));
const routes_js_1 = __importDefault(require("./startup/routes.js"));
const app = (0, express_1.default)();
(0, mongo_js_1.default)();
(0, routes_js_1.default)(app);
(0, config_js_1.default)();
const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger_js_1.logger.info(`Listening on port ${port}..`));
app.get("/", (req, res) => {
    res.send("Starbooks backend is running!");
});
exports.default = server;
