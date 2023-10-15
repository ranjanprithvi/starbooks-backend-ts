"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = void 0;
const logger_js_1 = require("../startup/logger.js");
function error(err, req, res, next) {
    logger_js_1.logger.error(err.message, err);
    res.status(500).send("Something went wrong..");
}
exports.error = error;
