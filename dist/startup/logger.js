"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = require("winston");
require("winston-mongodb");
require("express-async-errors");
// import { connectionString } from "./mongo.js";
const { combine, timestamp, label, printf } = winston_1.format;
const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});
exports.logger = (0, winston_1.createLogger)({
    format: combine(label({ label: "Starbooks" }), timestamp(), myFormat),
    transports: [
        new winston_1.transports.Console(),
        new winston_1.transports.File({ filename: "logs/logfile.log" }),
        // new transports.MongoDB({
        //     db: connectionString,
        //     options: {
        //         useNewUrlParser: true,
        //         useUnifiedTopology: true,
        //     },
        // }),
    ],
    exceptionHandlers: [
        new winston_1.transports.Console(),
        new winston_1.transports.File({ filename: "./logs/exceptions.log" }),
    ],
    rejectionHandlers: [
        new winston_1.transports.Console(),
        new winston_1.transports.File({ filename: "./logs/rejections.log" }),
    ],
});
