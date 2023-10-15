"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("config"));
function checkConfigVariables() {
    if (!config_1.default.get("JWTPrivateKey")) {
        throw new Error("FATAL ERROR.. Private Key is not set");
    }
    if (!config_1.default.get("MongodbURI")) {
        throw new Error("FATAL ERROR.. MongoDB password is not set");
    }
}
exports.default = checkConfigVariables;
// console.log("app name:" + config.get("name"));
// console.log("mail server:" + config.get("mail.host"));
// console.log("mail password:" + config.get("mail.password")); //The name of the variable of password
//                                                             is stored in 'custom-environment-variables.json'.
//                                                              This varible is an environment variable.
// console.log(`NODE_ENV: ${process.env.NODE_ENV}`); //--> returns undef if NODE_ENV not set
// console.log(`App: ${app.get("env")}`); //--> returns 'development' by default
