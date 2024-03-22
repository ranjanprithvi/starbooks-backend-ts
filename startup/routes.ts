import books from "../routes/booksRoutes.js";
import genres from "../routes/genresRoutes.js";
import authors from "../routes/authorsRoutes.js";
import rentals from "../routes/rentalsRoutes.js";
import users from "../routes/usersRoutes.js";
import auth from "../routes/authRoutes.js";
import { error } from "../middleware/error.js";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { logger } from "./logger.js";
import cors from "cors";
import { Express, Request, Response } from "express";

export default function initialiseRoutes(app: Express) {
    app.use(cors());
    app.use(express.json());
    //  app.use(express.urlencoded({ extended: true })); //When extended is true, we can pass arrays and objects in the url.
    app.use(express.static("public")); // All resources inside public folder can be served
    app.use(helmet());

    logger.info("Morgan enabled");
    app.use(morgan("tiny"));

    app.use("/starbooks/api/books", books);
    app.use("/starbooks/api/genres", genres);
    app.use("/starbooks/api/authors", authors);
    app.use("/starbooks/api/rentals", rentals);
    app.use("/starbooks/api/users", users);
    app.use("/starbooks/api/auth", auth);
    app.use("/", (req: Request, res: Response) => {
        res.send("Starbooks backend is running!");
    });
    app.use(error);
}
