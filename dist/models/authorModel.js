import { Schema, model } from "mongoose";
import Joi from "joi";
export const authorSchema = {
    name: Joi.string().min(3).required(),
};
export const authorSchemaObject = Joi.object(authorSchema);
const dbSchema = new Schema({
    name: { type: String, required: true, unique: true, minLength: 3 },
});
export const Author = model("author", dbSchema);
