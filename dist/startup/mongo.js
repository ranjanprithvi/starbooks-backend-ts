import mongoose from "mongoose";
import config from "config";
import { logger } from "./logger.js";
let connectionString;
connectionString = config.get("MongodbURI");
export default function initialiseDb() {
    mongoose.set("strictQuery", false);
    mongoose
        .connect(connectionString)
        .then(() => logger.info(`Connected to ${connectionString}..`))
        .catch((err) => logger.error(err));
}
export const conn = mongoose.connection;
