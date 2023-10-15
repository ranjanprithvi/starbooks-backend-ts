import { authorSchemaObject } from "../models/authorModel.js";
import { auth } from "../middleware/auth.js";
import express from "express";
import { admin } from "../middleware/admin.js";
import { Author } from "../models/authorModel.js";
import validateObjectId from "../middleware/validateObjectId.js";
import { validateBody } from "../middleware/validate.js";
import { Book } from "../models/bookModel.js";
const router = express.Router();

router.get("/", async (req, res) => {
    const authors = await Author.find().sort("name");
    res.send(authors);
});

router.get("/:id", validateObjectId, async (req, res) => {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).send("Resource not found");
    res.send(author);
});

router.post("/", [auth, validateBody(authorSchemaObject)], async (req, res) => {
    let author = await Author.findOne({ name: req.body.name });
    if (author) return res.status(400).send("Author already exists");

    author = new Author({ name: req.body.name });
    await author.save();
    res.status(201).send(author);
});

router.put(
    "/:id",
    [validateObjectId, auth, validateBody(authorSchemaObject)],
    async (req, res) => {
        let author = await Author.findOne({ name: req.body.name });
        if (author) res.status(400).send("Author already exists");

        author = await Author.findByIdAndUpdate(
            req.params.id,
            { $set: { name: req.body.name } },
            { new: true, runValidators: true }
        );
        if (!author) return res.status(404).send("Resource not found");
        res.send(author);
    }
);

router.delete("/:id", [validateObjectId, auth, admin], async (req, res) => {
    const books = await Book.find({ author: req.params.id });
    if (books.length > 0)
        return res
            .status(400)
            .send("Cannot delete author with books associated with it");

    const author = await Author.findByIdAndRemove(req.params.id);
    if (!author) return res.status(404).send("Resource not found");
    res.send(author);
});

export default router;
