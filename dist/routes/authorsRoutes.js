var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { authorSchemaObject } from "../models/authorModel.js";
import { auth } from "../middleware/auth.js";
import express from "express";
import { admin } from "../middleware/admin.js";
import { Author } from "../models/authorModel.js";
import validateObjectId from "../middleware/validateObjectId.js";
import { validateBody } from "../middleware/validate.js";
import { Book } from "../models/bookModel.js";
const router = express.Router();
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authors = yield Author.find().sort("name");
    res.send(authors);
}));
router.get("/:id", validateObjectId, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const author = yield Author.findById(req.params.id);
    if (!author)
        return res.status(404).send("Resource not found");
    res.send(author);
}));
router.post("/", [auth, validateBody(authorSchemaObject)], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let author = yield Author.findOne({ name: req.body.name });
    if (author)
        return res.status(400).send("Author already exists");
    author = new Author({ name: req.body.name });
    yield author.save();
    res.status(201).send(author);
}));
router.put("/:id", [validateObjectId, auth, validateBody(authorSchemaObject)], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let author = yield Author.findOne({ name: req.body.name });
    if (author)
        res.status(400).send("Author already exists");
    author = yield Author.findByIdAndUpdate(req.params.id, { $set: { name: req.body.name } }, { new: true, runValidators: true });
    if (!author)
        return res.status(404).send("Resource not found");
    res.send(author);
}));
router.delete("/:id", [validateObjectId, auth, admin], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const books = yield Book.find({ author: req.params.id });
    if (books.length > 0)
        return res
            .status(400)
            .send("Cannot delete author with books associated with it");
    const author = yield Author.findByIdAndRemove(req.params.id);
    if (!author)
        return res.status(404).send("Resource not found");
    res.send(author);
}));
export default router;
