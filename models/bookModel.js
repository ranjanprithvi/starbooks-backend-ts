import mongoose, { Schema, model } from "mongoose";
import Joi from "joi";

export const bookSchema = {
    title: Joi.string().min(3).required(),
    genre: Joi.string()
        .regex(/^[a-f\d]{24}$/i)
        .required(),
    author: Joi.string()
        .regex(/^[a-f\d]{24}$/i)
        .required(),
    numberInStock: Joi.number().min(0),
    // numberRentedOut: Joi.number().min(0),
    rating: Joi.number().min(0).max(5),
    yearPublished: Joi.number().max(new Date().getFullYear()).required(),
    // dailyRentalFee: Joi.number().min(0).max(500).required(),
    coverImage: Joi.string().allow(""),
    description: Joi.string().allow(""),
};
export const bookSchemaObject = Joi.object(bookSchema);

const dbSchema = new Schema(
    {
        title: { type: String, required: true, unique: true, minLength: 3 },
        genre: { type: mongoose.Types.ObjectId, ref: "genre", required: true },
        author: {
            type: mongoose.Types.ObjectId,
            ref: "author",
            required: true,
        },
        // dateAdded: { type: Date, default: Date.now() },
        // dailyRentalFee: { type: Number, min: 0, max: 500, required: true },
        numberInStock: { type: Number, min: 0, default: 0 },
        numberRentedOut: { type: Number, min: 0 },
        rating: { type: Number, min: 0, max: 5 },
        yearPublished: {
            type: Number,
            required: true,
            max: new Date().getFullYear(),
        },
        coverImage: String,
        description: String,
    }
    // { toObject: { getters: true }, toJSON: { getters: true } }
);

export const Book = model("book", dbSchema);
