import mongoose from "mongoose";
import config from "config";
import { logger } from "./logger.js";

const connectionString =
    connectionString(
        config.has("MongodbURI")
            ? config.get("MongodbURI")
            : config.get("localDB")
    ) + config.get("db_name");

export default function initialiseDb() {
    mongoose.set("strictQuery", false);
    mongoose
        .connect(connectionString)
        .then(() => logger.info(`Connected to ${connectionString}..`))
        .catch((err) => logger.error(err));
}
export const conn = mongoose.connection;
