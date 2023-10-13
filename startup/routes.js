import books from "../routes/booksRoutes.js";
import genres from "../routes/genresRoutes.js";
import authors from "../routes/authorsRoutes.js";
import members from "../routes/membersRoutes.js";
import rentals from "../routes/rentalsRoutes.js";
import users from "../routes/usersRoutes.js";
import auth from "../routes/authRoutes.js";
import { error } from "../middleware/error.js";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { logger } from "./logger.js";
import cors from "cors";

export default function initialiseRoutes(app) {
    app.use(cors());
    app.use(express.json());
    //  app.use(express.urlencoded({ extended: true })); //When extended is true, we can pass arrays and objects in the url.
    app.use(express.static("public")); // All resources inside public folder can be served
    app.use(helmet());

    logger.info("Morgan enabled");
    app.use(morgan("tiny"));

    app.use("/api/books", books);
    app.use("/api/genres", genres);
    app.use("/api/authors", authors);
    app.use("/api/members", members);
    app.use("/api/rentals", rentals);
    app.use("/api/users", users);
    app.use("/api/auth", auth);
    app.use(error);
}
