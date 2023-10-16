var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import { auth } from "../middleware/auth.js";
import { admin } from "../middleware/admin.js";
import validateObjectId from "../middleware/validateObjectId.js";
import { Genre, genreSchemaObject } from "../models/genreModel.js";
import { validateBody } from "../middleware/validate.js";
import { Book } from "../models/bookModel.js";
const router = express.Router();
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const genres = yield Genre.find().sort("name");
    res.send(genres);
}));
router.get("/:id", validateObjectId, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const genre = yield Genre.findById(req.params.id);
    if (!genre)
        return res.status(404).send("Resource not found");
    res.send(genre);
}));
router.post("/", [auth, validateBody(genreSchemaObject)], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let genre = yield Genre.findOne({ name: req.body.name });
    if (genre)
        return res.status(400).send("Genre already exists");
    genre = new Genre({ name: req.body.name });
    yield genre.save();
    res.status(201).send(genre);
}));
router.put("/:id", [validateObjectId, auth, validateBody(genreSchemaObject)], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let genre = yield Genre.findOne({ name: req.body.name });
    if (genre)
        return res.status(400).send("Genre already exists");
    genre = yield Genre.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!genre)
        return res.status(404).send("Resource not found");
    res.send(genre);
}));
router.delete("/:id", [validateObjectId, auth, admin], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const books = yield Book.find({ genre: req.params.id });
    if (books.length > 0)
        return res
            .status(400)
            .send("Cannot delete genre with books associated with it");
    const genre = yield Genre.findByIdAndDelete(req.params.id);
    if (!genre)
        return res.status(404).send("Resource not found");
    res.send(genre);
}));
export default router;
