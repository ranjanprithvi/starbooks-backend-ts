import mongoose from "mongoose";
import config from "config";
import { logger } from "./logger.js";
import { log } from "console";

let connectionString: string;

connectionString =
    config.get<string>("MongodbURI") + config.get<string>("db_name");

log(connectionString);

export default function initialiseDb() {
    mongoose.set("strictQuery", false);
    mongoose
        .connect(connectionString)
        .then(() => logger.info(`Connected to ${connectionString}..`))
        .catch((err) => logger.error(err));
}
export const conn = mongoose.connection;
