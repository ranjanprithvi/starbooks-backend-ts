"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const userModel_js_1 = require("../models/userModel.js");
const authModel_js_1 = require("../models/authModel.js");
const validate_js_1 = require("../middleware/validate.js");
const router = express_1.default.Router();
router.post("/login", (0, validate_js_1.validateBody)(authModel_js_1.authSchemaObject), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield userModel_js_1.User.findOne({ email: req.body.email });
    console.log(1);
    if (!user)
        return res.status(400).send("Invalid Email or password");
    const validPassword = yield bcrypt_1.default.compare(req.body.password, user.password);
    if (!validPassword)
        return res.status(400).send("Invalid Email or password");
    const token = user.generateAuthToken();
    res.send({ token, isAdmin: user.isAdmin });
}));
exports.default = router;
