import express, { Router } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/userModel.js";
import { authSchemaObject } from "../models/authModel.js";
import { validateBody } from "../middleware/validate.js";
import { Request, Response } from "express";

const router: Router = express.Router();

router.post(
    "/login",
    validateBody(authSchemaObject),
    async (req: Request, res: Response) => {
        const user = await User.findOne({ email: req.body.email });
        console.log(1);
        if (!user) return res.status(400).send("Invalid Email or password");

        const validPassword = await bcrypt.compare(
            req.body.password,
            user.password
        );
        if (!validPassword)
            return res.status(400).send("Invalid Email or password");

        const token = "user.generateAuthToken();";
        res.send({ token, isAdmin: user.isAdmin });
    }
);

export default router;
