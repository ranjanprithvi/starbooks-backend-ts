import express from "express";
import { auth } from "../middleware/auth.js";
import { admin } from "../middleware/admin.js";
import validateObjectId from "../middleware/validateObjectId.js";
import { Genre, genreSchemaObject } from "../models/genreModel.js";
import { validateBody } from "../middleware/validate.js";
import { Book } from "../models/bookModel.js";
import { Request, Response } from "express";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    const genres = await Genre.find().sort("name");
    res.send(genres);
});

router.get("/:id", validateObjectId, async (req: Request, res: Response) => {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).send("Resource not found");
    res.send(genre);
});

router.post(
    "/",
    [auth, validateBody(genreSchemaObject)],
    async (req: Request, res: Response) => {
        let genre = await Genre.findOne({ name: req.body.name });
        if (genre) return res.status(400).send("Genre already exists");

        genre = new Genre({ name: req.body.name });
        await genre.save();
        res.status(201).send(genre);
    }
);

router.put(
    "/:id",
    [validateObjectId, auth, validateBody(genreSchemaObject)],
    async (req: Request, res: Response) => {
        let genre = await Genre.findOne({ name: req.body.name });
        if (genre) return res.status(400).send("Genre already exists");

        genre = await Genre.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!genre) return res.status(404).send("Resource not found");
        res.send(genre);
    }
);

router.delete(
    "/:id",
    [validateObjectId, auth, admin],
    async (req: Request, res: Response) => {
        const books = await Book.find({ genre: req.params.id });
        if (books.length > 0)
            return res
                .status(400)
                .send("Cannot delete genre with books associated with it");
        const genre = await Genre.findByIdAndDelete(req.params.id);
        if (!genre) return res.status(404).send("Resource not found");
        res.send(genre);
    }
);

export default router;
