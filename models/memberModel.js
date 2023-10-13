import { Schema, model, Types } from "mongoose";
import Joi from "joi";

export const memberSchema = {
    name: Joi.string().min(3).required(),
    phone: Joi.number().min(1000000000).max(9999999999).required(),
    email: Joi.string().email(),
    dateOfBirth: Joi.date().max(new Date()),
    // isMember: Joi.boolean(),
    membershipExpiry: Joi.date().required().max(new Date()),
    maxBorrow: Joi.number().min(1).max(5),
};

export const memberSchemaObject = Joi.object(memberSchema);

const dbSchema = new Schema({
    name: { type: String, required: true },
    phone: {
        type: Number,
        min: 1000000000,
        max: 9999999999,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        min: 5,
        max: 255,
        index: true,
        unique: true,
        sparse: true,
    },
    dateOfBirth: { type: Date, max: new Date() },
    // isMember: { type: Boolean, default: false },
    membershipExpiry: {
        type: Date,
        required: true,
        max: new Date(),
    },
    maxBorrow: {
        type: Number,
        min: 1,
        max: 5,
        default: 1,
    },
    activeRentals: [{ type: Types.ObjectId, ref: "rental" }],
});

export const Member = model("member", dbSchema);
