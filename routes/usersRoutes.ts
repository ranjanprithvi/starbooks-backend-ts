import express from "express";
import bcrypt from "bcrypt";
import _ from "lodash";
import { User } from "../models/userModel.js";
import { userSchema, userSchemaObject } from "../models/userModel.js";
import { auth } from "../middleware/auth.js";
import { admin } from "../middleware/admin.js";
import validateObjectId from "../middleware/validateObjectId.js";
import { validateBody, validateEachParameter } from "../middleware/validate.js";
import Joi from "joi";
import { Book } from "../models/bookModel.js";
import { generatePass } from "../util/generatePassword.js";
import { Request, Response } from "express";
const router = express.Router();

router.get("/me", auth, async (req: Request, res: Response) => {
    const user = await User.findById(req.user._id)
        .populate("activeRentals")
        .populate({
            path: "activeRentals",
            populate: {
                path: "book",
                model: Book,
            },
        });
    if (!user) {
        return res.status(400).send("User not found");
    }
    res.send(user);
});

router.get("/", [auth, admin], async (req: Request, res: Response) => {
    if (req.query.search) {
        req.query.name = { $regex: req.query.search, $options: "i" };
    }
    delete req.query.search;

    let sortBy = "-_id";

    if (req.query.sortBy) {
        sortBy = req.query.sortBy.toString();
    }
    delete req.query.sortBy;

    let queryStr = JSON.stringify({ ...req.query });
    queryStr = queryStr.replace(
        /\b(gt|gte|lt|lte|eq|ne)\b/g,
        (match) => `$${match}`
    );
    const users = await User.find(JSON.parse(queryStr))
        .sort(sortBy)
        // .populate(req.query.populate ? req.query.populate.split("|") : [])
        .populate("activeRentals");
    res.send(users);
});

router.get("/:id", [auth, admin], async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id)
        .populate("activeRentals")
        .populate({
            path: "activeRentals",
            populate: {
                path: "book",
                model: Book,
            },
        });
    if (!user) {
        return res.status(400).send("User not found");
    }
    res.send(user);
});

router.post(
    "/",
    [auth, admin, validateBody(Joi.object(_.omit(userSchema, "password")))],
    async (req: Request, res: Response) => {
        let user = await User.findOne({ email: req.body.email });
        if (user) return res.status(400).send("User already registered.");

        req.body.password = generatePass();

        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(req.body.password, salt);
        user = new User({
            ...req.body,
            password,
            isAdmin: false,
        });

        try {
            await user.save();
        } catch (ex: any) {
            for (let field in ex.errors) console.log(ex.errors[field].message);
        }
        const token = user.generateAuthToken();
        res.status(201)
            .header("x-auth-token", token)
            .header("access-control-expose-headers", "x-auth-token")
            .send(_.omit(user.toObject(), ["password"]));
    }
);

router.post(
    "/createAdmin",
    [
        auth,
        admin,
        validateBody(
            Joi.object(_.pick(userSchema, ["email", "password", "name"]))
        ),
    ],
    async (req: Request, res: Response) => {
        let user = await User.findOne({ email: req.body.email });
        if (user) return res.status(400).send("User already registered.");

        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(req.body.password, salt);
        user = new User({
            ...req.body,
            password,
            isAdmin: true,
        });

        try {
            await user.save();
        } catch (ex: any) {
            for (let field in ex.errors) console.log(ex.errors[field].message);
        }
        const token = user.generateAuthToken();
        res.status(201)
            .header("x-auth-token", token)
            .header("access-control-expose-headers", "x-auth-token")
            .send(_.omit(user.toObject(), ["password"]));
    }
);

router.patch(
    "/:id",
    [
        validateObjectId,
        auth,
        admin,
        validateEachParameter(
            _.pick(userSchema, [
                "email",
                "name",
                "countryCode",
                "phoneNumber",
                "membershipExpiry",
                "maxBorrow",
                "dateOfBirth",
            ])
        ),
    ],
    async (req: Request, res: Response) => {
        if (req.body.email) {
            const user = await User.findOne({ email: req.body.email });
            // console.log(user);
            if (user && user._id.toString() != req.params.id)
                return res.status(400).send("Email must be unique");
        }

        // if (req.body.password) {
        //     const salt = await bcrypt.genSalt(10);
        //     req.body.password = await bcrypt.hash(req.body.password, salt);
        // }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).select("-password");
        if (!user) return res.status(404).send("Resource not found");

        res.send(user);
    }
);

router.delete(
    "/:id",
    [validateObjectId, auth, admin],
    async (req: Request, res: Response) => {
        const user = await User.findByIdAndDelete(req.params.id).select(
            "-password"
        );
        if (!user) return res.status(404).send("Resource not found");

        res.send(user);
    }
);

export default router;
