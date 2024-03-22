import express, { Express, Request, Response } from "express";
import checkConfigVariables from "./startup/config.js";
import { logger } from "./startup/logger.js";
import initialiseDb from "./startup/mongo.js";
import initialiseRoutes from "./startup/routes.js";
import config from "config";

const app: Express = express();

initialiseDb();
initialiseRoutes(app);
checkConfigVariables();

const port = config.get("port") || 3000;
const server = app.listen(port, () =>
    logger.info(`Listening on port ${port}..`)
);

export default server;
