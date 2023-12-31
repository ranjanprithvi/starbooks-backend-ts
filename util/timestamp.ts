import { Types } from "mongoose";

export function getTimestamp(objectId: Types.ObjectId) {
    const timestamp = objectId.toString().substring(0, 8);

    return new Date(parseInt(timestamp, 16) * 1000);
}
