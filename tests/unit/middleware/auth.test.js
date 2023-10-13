import moment from "moment";
import { auth } from "../../../middleware/auth";
import { User } from "../../../models/userModel";
import mongoose from "mongoose";

describe("auth middleware", () => {
    it("should populate req.user with payload of the token", () => {
        const user = {
            _id: mongoose.Types.ObjectId(),
            isAdmin: true,
            membershipExpiry: moment().add(1, "day").toISOString(),
        };
        const token = new User(user).generateAuthToken();
        const req = {
            header: jest.fn().mockReturnValue(token),
        };

        let res = {};
        let next = jest.fn();
        auth(req, res, next);
        expect(req.user).toMatchObject(user);
    });
});
