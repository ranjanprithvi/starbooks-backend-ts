var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import bcrypt from "bcrypt";
import { User } from "../models/userModel.js";
import { authSchemaObject } from "../models/authModel.js";
import { validateBody } from "../middleware/validate.js";
const router = express.Router();
router.post("/login", validateBody(authSchemaObject), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User.findOne({ email: req.body.email });
    console.log(1);
    if (!user)
        return res.status(400).send("Invalid Email or password");
    const validPassword = yield bcrypt.compare(req.body.password, user.password);
    if (!validPassword)
        return res.status(400).send("Invalid Email or password");
    const token = "user.generateAuthToken();";
    res.send({ token, isAdmin: user.isAdmin });
}));
export default router;
