import { User } from "../../../models/userModel";
import jwt from "jsonwebtoken";
import config from "config";
import mongoose from "mongoose";

describe("user.generateAuthToken", () => {
    it("should generate a valid auth Token", () => {
        const payload = { _id: mongoose.Types.ObjectId(), isAdmin: true };

        const user = new User(payload);
        const token = user.generateAuthToken();
        const decoded = jwt.verify(token, config.get("JWTPrivateKey"));
        expect(decoded).toMatchObject(payload);
    });
});
