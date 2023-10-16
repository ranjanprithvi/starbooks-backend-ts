import Joi from "joi";
import { Schema, model } from "mongoose";
export const genreSchema = {
    name: Joi.string().min(3).required(),
};
export const genreSchemaObject = Joi.object(genreSchema);
const dbSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minLength: 3,
    },
});
export const Genre = model("genre", dbSchema);
