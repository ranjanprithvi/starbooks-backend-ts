"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const booksRoutes_js_1 = __importDefault(require("../routes/booksRoutes.js"));
const genresRoutes_js_1 = __importDefault(require("../routes/genresRoutes.js"));
const authorsRoutes_js_1 = __importDefault(require("../routes/authorsRoutes.js"));
const rentalsRoutes_js_1 = __importDefault(require("../routes/rentalsRoutes.js"));
const usersRoutes_js_1 = __importDefault(require("../routes/usersRoutes.js"));
const authRoutes_js_1 = __importDefault(require("../routes/authRoutes.js"));
const error_js_1 = require("../middleware/error.js");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const logger_js_1 = require("./logger.js");
const cors_1 = __importDefault(require("cors"));
function initialiseRoutes(app) {
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    //  app.use(express.urlencoded({ extended: true })); //When extended is true, we can pass arrays and objects in the url.
    app.use(express_1.default.static("public")); // All resources inside public folder can be served
    app.use((0, helmet_1.default)());
    logger_js_1.logger.info("Morgan enabled");
    app.use((0, morgan_1.default)("tiny"));
    app.use("/api/books", booksRoutes_js_1.default);
    app.use("/api/genres", genresRoutes_js_1.default);
    app.use("/api/authors", authorsRoutes_js_1.default);
    app.use("/api/rentals", rentalsRoutes_js_1.default);
    app.use("/api/users", usersRoutes_js_1.default);
    app.use("/api/auth", authRoutes_js_1.default);
    app.use(error_js_1.error);
}
exports.default = initialiseRoutes;
