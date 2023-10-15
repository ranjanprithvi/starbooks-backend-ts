"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conn = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("config"));
const logger_js_1 = require("./logger.js");
let connectionString;
connectionString = config_1.default.get("MongodbURI");
function initialiseDb() {
    mongoose_1.default.set("strictQuery", false);
    mongoose_1.default
        .connect(connectionString)
        .then(() => logger_js_1.logger.info(`Connected to ${connectionString}..`))
        .catch((err) => logger_js_1.logger.error(err));
}
exports.default = initialiseDb;
exports.conn = mongoose_1.default.connection;
