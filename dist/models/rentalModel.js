import mongoose, { Schema, model } from "mongoose";
import Joi from "joi";
export const rentalSchema = {
    user: Joi.string()
        .regex(/^[a-f\d]{24}$/i)
        .required(),
    book: Joi.string()
        .regex(/^[a-f\d]{24}$/i)
        .required(),
    // dateReturned: Joi.date(),
    // rentalFee: Joi.number(),
};
export const rentalSchemaObject = Joi.object(rentalSchema);
const dbSchema = new Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true,
    },
    book: { type: mongoose.Types.ObjectId, ref: "book", required: true },
    dateReturned: Date,
    // rentalFee: Number,
});
export const Rental = model("rental", dbSchema);
