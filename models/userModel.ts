import Joi from "joi";
// import passwordComplexity, { ComplexityOptions } from "joi-password-complexity";
import _ from "lodash";
import { Schema, Types, model } from "mongoose";
import jwt from "jsonwebtoken";
import config from "config";
import { log } from "console";

// const complexityOptions: ComplexityOptions = {
//     min: 5,
//     max: 1024,
//     lowerCase: 1,
//     upperCase: 1,
//     numeric: 1,
//     symbol: 1,
//     requirementCount: 4,
// };

export const userSchema = {
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().min(5).max(255).required(),
    // password: passwordComplexity(complexityOptions).required(),
    password: Joi.string()
        .regex(
            /(?=^.{5,}$)(?=.*\d)(?=.*[!@#$%^&*]+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/
        )
        .required(),
    isAdmin: Joi.boolean(),
    countryCode: Joi.string().max(3).regex(/^\d+$/).allow(""),
    phoneNumber: Joi.string().max(11).regex(/^\d+$/).allow(""),
    dateOfBirth: Joi.date().max(new Date()),
    membershipExpiry: Joi.date().required(),
    maxBorrow: Joi.number().min(1).max(5),
};
export const userSchemaObject = Joi.object(userSchema);

interface IUser {
    _id: string;
    email: string;
    password: string;
    name: string;
    isAdmin: boolean;
    countryCode: string;
    phoneNumber: string;
    dateOfBirth: Date;
    membershipExpiry: Date;
    maxBorrow: number;
    activeRentals: Types.ObjectId[];
    generateAuthToken: () => string;
}

const dbSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            min: 5,
            max: 255,
            index: true,
            unique: true,
            sparse: true,
        },
        password: { type: String, required: true, select: false },
        name: { type: String, minLength: 3, maxLength: 50, required: true },
        isAdmin: { type: Boolean, default: false },
        countryCode: { type: String, maxLength: 3, default: "49" },
        phoneNumber: {
            type: String,
            maxLength: 11,
            index: true,
        },
        dateOfBirth: { type: Date, max: new Date() },
        // isMember: { type: Boolean, default: false },
        membershipExpiry: {
            type: Date,
            required: function (this: IUser) {
                return !this.isAdmin;
            },
        },
        maxBorrow: {
            type: Number,
            min: 1,
            max: 5,
            default: 1,
        },
        activeRentals: {
            type: [{ type: Types.ObjectId, ref: "rental" }],
            default: [],
        },
    },
    {
        methods: {
            generateAuthToken(): string {
                const token: string = jwt.sign(
                    {
                        _id: this._id,
                        isAdmin: this.isAdmin,
                    },
                    config.get("JWTPrivateKey")
                    // ,{ expiresIn: "24h" }
                );
                return token;
            },
        },
    }
);

export const User = model<IUser>("user", dbSchema);

// const Phone = model(
//     "phone",
//     new Schema({
//         countryCode: { type: String, maxLength: 3, default: "+49" },
//         phoneNumber: { type: String, required: true, maxLength: 11 },
//     })
// );
