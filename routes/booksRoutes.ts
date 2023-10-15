import { bookSchema, bookSchemaObject } from "../models/bookModel.js";
import { auth } from "../middleware/auth.js";
import express from "express";
import { Author } from "../models/authorModel.js";
import { Genre } from "../models/genreModel.js";
import { admin } from "../middleware/admin.js";
import { Book } from "../models/bookModel.js";
import validateObjectId from "../middleware/validateObjectId.js";
import { validateBody, validateEachParameter } from "../middleware/validate.js";
import { Request, Response } from "express";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    // console.log(req.query);
    if (req.query.search) {
        req.query.title = { $regex: req.query.search, $options: "i" };
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

    const books = await Book.find(JSON.parse(queryStr))
        .sort(sortBy)
        // .populate(req.query.populate ? req.query.populate.split("|") : []);
        .populate(["genre", "author"]);
    res.send(books);
});

router.get("/:id", validateObjectId, async (req: Request, res: Response) => {
    const book = await Book.findById(req.params.id).populate(
        // req.query.populate ? req.query.populate.split("|") : []
        ["genre", "author"]
    );
    if (!book) return res.status(404).send("Resource not found");
    res.send(book);
});

router.post(
    "/",
    [auth, admin, validateBody(bookSchemaObject)],
    async (req: Request, res: Response) => {
        const genre = await Genre.findById(req.body.genre);
        if (!genre) return res.status(400).send("Invalid Genre!");
        const author = await Author.findById(req.body.author);
        if (!author) return res.status(400).send("Invalid Author!");

        const book = await new Book(req.body).save();
        res.status(201).send(book);
    }
);

// router.put(
//     "/:id",
//     [validateObjectId, auth, admin, validateBody(bookSchemaObject)],
//     async (req:Request, res:Response) => {
//         const genre = await Genre.findById(req.body.genre);
//         if (!genre) return res.status(404).send("Invalid Genre!");
//         const author = await Author.findById(req.body.author);
//         if (!author) return res.status(404).send("Invalid Author!");

//         const book = await Book.findOneAndReplace(req.params.id, req.body);
//         if (!book) return res.status(404).send("Resource not found");
//         res.send(book);
//     }
// );

router.delete(
    "/:id",
    [validateObjectId, auth, admin],
    async (req: Request, res: Response) => {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).send("Resource not found");

        res.send(book);
    }
);

router.patch(
    "/:id",
    [validateObjectId, auth, admin, validateEachParameter(bookSchema)],
    async (req: Request, res: Response) => {
        if (req.body.genre) {
            const genre = await Genre.findById(req.body.genre);
            if (!genre) return res.status(400).send("Invalid Genre!");
        }
        if (req.body.author) {
            const author = await Author.findById(req.body.author);
            if (!author) return res.status(400).send("Invalid Author!");
        }

        const book = await Book.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!book) return res.status(404).send("Resource not found");
        res.send(book);
    }
);
export default router;
