import request from "supertest";
import server from "../../index";
import { conn } from "../../startup/mongo";
import { logger } from "../../startup/logger";
import { Genre } from "../../models/genreModel";
import { User } from "../../models/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "config";
import moment from "moment";
import { Types } from "mongoose";

describe("auth", () => {
    afterAll(() => {
        conn.close();
        logger.close();
        server.close();
    });
    describe("middleware", () => {
        let token;

        beforeEach(() => {
            token = new User().generateAuthToken();
        });

        afterEach(async () => {
            await Genre.collection.deleteMany({});
            // server.close();
        });

        const exec = function () {
            return request(server)
                .post("/api/genres")
                .set("x-auth-token", token)
                .send({ name: "genre1" });
        };

        it("should return 401 if no token is passed", async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it("should return 400 if invalid token is passed", async () => {
            token = "1234";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it("should return 201 if valid token is passed", async () => {
            const res = await exec();
            expect(res.status).toBe(201);
        });
    });

    describe("login", () => {
        let user;
        let params;

        beforeEach(async () => {
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash("Abc@starbooks1234", salt);

            user = new User({
                name: "user1",
                email: "abc@abc.com",
                password: password,
                membershipExpiry: moment().add(30, "days"),
                maxBorrow: 3,
                activeRentals: [Types.ObjectId(), Types.ObjectId()],
            });
            await user.save();
            params = { email: "abc@abc.com", password: "Abc@starbooks1234" };
        });

        afterEach(async () => {
            await User.collection.deleteMany({});
            // server.close();
        });

        const exec = function () {
            return request(server).post("/api/auth/login").send(params);
        };

        it("should return 400 if user email is not passed", async () => {
            delete params.email;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user password is not passed", async () => {
            delete params.password;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if email is invalid", async () => {
            params.email = "abc@abcd.com";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if password is invalid", async () => {
            params.password = "Abc@starbooks123";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it.only("should return valid token if credentials are valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            const data = jwt.verify(
                response.body.token,
                config.get("JWTPrivateKey")
            );
            expect(data).toHaveProperty("_id");
            expect(data).toHaveProperty("name", "user1");
            expect(data).toHaveProperty("email", "abc@abc.com");
            expect(data).toHaveProperty("isAdmin", false);
        });
    });
});
