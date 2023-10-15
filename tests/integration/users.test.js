import mongoose from "mongoose";
import request from "supertest";
import server from "../../dist/index";
import { logger } from "../../dist/startup/logger";
import { conn } from "../../dist/startup/mongo";
import { User } from "../../dist/models/userModel";
import bcrypt from "bcrypt";
import moment from "moment";

describe("/api/users", () => {
    afterEach(async () => {
        await User.collection.deleteMany({});
        // server.close();
    });

    afterAll(async () => {
        conn.close();
        logger.close();
        server.close();
    });

    describe("GET /", () => {
        let token;
        let user1;
        let user2;
        beforeEach(async () => {
            user1 = new User({
                name: "user1",
                email: "abc@abc.com",
                password: "12345",
                phoneNumber: "12345678901",
                membershipExpiry: moment().add(30, "days"),
            });
            user2 = new User({
                name: "user2",
                email: "abcd@abcd.com",
                password: "123456",
                isAdmin: true,
            });
            await user1.save();
            await user2.save();
            token = user2.generateAuthToken();
        });

        const exec = async function () {
            return await request(server)
                .get("/api/users")
                .set("x-auth-token", token);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it("should return 403 if client is not admin", async () => {
            token = user1.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it("should return all the users if client is admin", async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0]).not.toHaveProperty("password");
        });
    });

    describe("GET /:id", () => {
        let token;
        let user1;
        let user2;
        let id;

        beforeEach(async () => {
            user1 = new User({
                name: "user1",
                email: "abc@abc.com",
                password: "12345",
                countryCode: "49",
                phoneNumber: "12345678901",
                membershipExpiry: moment().add(30, "days").toDate(),
                dateOfBirth: moment().subtract(20, "years").toDate(),
                maxBorrow: 3,
            });
            user2 = new User({
                name: "user2",
                email: "abcd@abcd.com",
                password: "123456",
                isAdmin: true,
            });
            await user1.save();
            await user2.save();

            id = user1._id;

            token = user2.generateAuthToken();
        });

        const exec = async function () {
            return await request(server)
                .get(`/api/users/${id}`)
                .set("x-auth-token", token);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it("should return 403 if client is not admin", async () => {
            token = new User().generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it("should return 400 status if user doesnt exist in the db", async () => {
            id = mongoose.Types.ObjectId();

            const response = await exec();
            expect(response.status).toBe(400);
        });

        it("should return user if request is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                name: user1.name,
                email: user1.email,
                countryCode: user1.countryCode,
                phoneNumber: user1.phoneNumber,
                membershipExpiry: user1.membershipExpiry.toISOString(),
                dateOfBirth: user1.dateOfBirth.toISOString(),
                maxBorrow: user1.maxBorrow,
                isAdmin: false,
            });
            expect(response.body).toHaveProperty("activeRentals");
            expect(response.body).not.toHaveProperty("password");
        });
    });

    describe("GET /me", () => {
        let token;
        let user1;
        let user2;
        let id;

        beforeEach(async () => {
            user1 = new User({
                name: "user1",
                email: "abc@abc.com",
                password: "12345",
                countryCode: "49",
                phoneNumber: "12345678901",
                membershipExpiry: moment().add(30, "days").toDate(),
                dateOfBirth: moment().subtract(20, "years").toDate(),
                maxBorrow: 3,
                activeRentals: ["123456789012", "123456789013"],
            });
            user2 = new User({
                name: "user2",
                email: "abcd@abcd.com",
                password: "123456",
                isAdmin: true,
            });
            await user1.save();
            await user2.save();

            id = user1._id;

            token = user1.generateAuthToken();
        });

        const exec = async function () {
            return await request(server)
                .get(`/api/users/me`)
                .set("x-auth-token", token);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it("should return 400 status if user doesnt exist in the db", async () => {
            token = new User({
                name: "user3",
            }).generateAuthToken();

            const response = await exec();
            expect(response.status).toBe(400);
        });

        it("should return non admin user details if request is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                name: user1.name,
                email: user1.email,
                countryCode: user1.countryCode,
                phoneNumber: user1.phoneNumber,
                membershipExpiry: user1.membershipExpiry.toISOString(),
                dateOfBirth: user1.dateOfBirth.toISOString(),
                maxBorrow: user1.maxBorrow,
                isAdmin: false,
            });
            expect(response.body).toHaveProperty("activeRentals");
            expect(response.body).not.toHaveProperty("password");
        });

        it("should return admin user details if request is valid", async () => {
            token = user2.generateAuthToken();
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                name: user2.name,
                email: user2.email,
                isAdmin: true,
            });
            expect(response.body).not.toHaveProperty("password");
        });
    });
    describe("POST /", () => {
        let token;
        let params;

        beforeEach(() => {
            token = new User({ isAdmin: true }).generateAuthToken();
            params = {
                name: "user1",
                email: "abc@abc.com",
                dateOfBirth: moment().subtract(20, "years").toDate(),
                membershipExpiry: moment().add(30, "days"),
                countryCode: "49",
                phoneNumber: "12345678901",
                maxBorrow: 3,
            };
        });

        const exec = function () {
            return request(server)
                .post("/api/users")
                .set("x-auth-token", token)
                .send(params);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it("should return 403 if client is not admin", async () => {
            token = new User().generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it("should return 400 if user name is not passed", async () => {
            delete params.name;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user name has less than 3 characters", async () => {
            params.name = "us";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user name has more than 50 characters", async () => {
            params.name = "us".repeat(26);
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user email is not passed", async () => {
            delete params.email;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user email has less than 5 characters", async () => {
            params.email = "a@g.s";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user email has more than 255 characters", async () => {
            params.email = "a".repeat(252) + "@g.s";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user email is invalid", async () => {
            params.email = "au";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user email is not unique", async () => {
            const user = new User({ ...params, password: "123456" });
            await user.save();

            const response = await exec();

            expect(response.status).toBe(400);
        });

        // it("should return 400 if user password is not passed", async () => {
        //     delete params.password;
        //     const response = await exec();

        //     expect(response.status).toBe(400);
        // });

        // it("should return 400 if user password is less than 5 characters long", async () => {
        //     params.password = "123";
        //     const response = await exec();

        //     expect(response.status).toBe(400);
        // });

        // it("should return 400 if user password doesnt have a lowercase character", async () => {
        //     params.password = "ABC@1234";
        //     const response = await exec();

        //     expect(response.status).toBe(400);
        // });

        // it("should return 400 if user password doesnt have an uppercase character", async () => {
        //     params.password = "abc@starbooks1234";
        //     const response = await exec();

        //     expect(response.status).toBe(400);
        // });

        // it("should return 400 if user password doesnt have a numeric character", async () => {
        //     params.password = "Abc@starbooks";
        //     const response = await exec();

        //     expect(response.status).toBe(400);
        // });

        // it("should return 400 if user password doesnt have a special character", async () => {
        //     params.password = "Abcstarbooks1234";
        //     const response = await exec();

        //     expect(response.status).toBe(400);
        // });

        it("should return 400 if date of birth is in the future", async () => {
            params.dateOfBirth = moment().add(2, "days").toDate();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if membership expiry is not passed", async () => {
            delete params.membershipExpiry;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if country code is more than 3 characters", async () => {
            params.countryCode = "1234";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if countryCode has non numeric characters", async () => {
            params.countryCode = "a";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if phoneNumber is more than 11 characters", async () => {
            params.phoneNumber = "1".repeat(12);
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if phoneNumber has non numeric characters", async () => {
            params.phoneNumber = "a";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if date of birth is in the future", async () => {
            params.dateOfBirth = moment().add(1, "days").toDate();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if max borrow is less than 1", async () => {
            params.maxBorrow = 0;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if max borrow is more than 5", async () => {
            params.maxBorrow = 6;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if additional parameters are passed", async () => {
            params.title = "new";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should save user if request is valid", async () => {
            await exec();

            const user = await User.findOne({ name: "user1" });
            expect(user).not.toBeNull();
        });

        it("should return non admin user if request is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("_id");
            expect(response.body).toHaveProperty("name", params.name);
            expect(response.body).toHaveProperty("email", params.email);
            expect(response.body).toHaveProperty("isAdmin", false);
            expect(response.body).toHaveProperty(
                "membershipExpiry",
                params.membershipExpiry.toISOString()
            );
            expect(response.body).toHaveProperty("maxBorrow", params.maxBorrow);
            expect(response.body).toHaveProperty(
                "countryCode",
                params.countryCode
            );
            expect(response.body).toHaveProperty(
                "phoneNumber",
                params.phoneNumber
            );
            expect(response.body).toHaveProperty("activeRentals", []);
            expect(response.body).not.toHaveProperty("password");
        });

        it("should not return admin user even if request is valid", async () => {
            params.isAdmin = true;
            const response = await exec();

            expect(response.body).toHaveProperty("isAdmin", false);
        });

        it("should return maxBorrow equal to 1 if no maxBorrow is passed", async () => {
            delete params.maxBorrow;
            const response = await exec();

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("maxBorrow", 1);
        });
    });

    describe("PATCH /:id", () => {
        let id;
        let token;
        let params;

        // beforeAll(async () => {});

        beforeEach(async () => {
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash("Abc@starbooks1234", salt);

            const user = new User({
                name: "user1",
                email: "abc@abc.com",
                password: password,
                dateOfBirth: moment().subtract(20, "years").toDate(),
                membershipExpiry: moment().add(30, "days"),
                countryCode: "49",
                phoneNumber: "12345678901",
                maxBorrow: 3,
            });
            await user.save();
            id = user._id;

            token = new User({ isAdmin: true }).generateAuthToken();
            params = {
                name: "user2",
                dateOfBirth: moment().subtract(18, "years"),
                membershipExpiry: moment().add(60, "days"),
                countryCode: "44",
                phoneNumber: "12345678902",
                maxBorrow: 4,
            };
        });

        const exec = function () {
            return request(server)
                .patch("/api/users/" + id)
                .set("x-auth-token", token)
                .send(params);
        };
        it("should return 401 if client is not logged in", async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it("should return 403 if client is not admin", async () => {
            token = new User().generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it("should return 400 if user name has less than 3 characters", async () => {
            params.name = "us";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user name has more than 50 characters", async () => {
            params.name = "us".repeat(26);
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if date of birth is in the future", async () => {
            params.dateOfBirth = moment().add(2, "days").toDate();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if country code is more than 3 characters", async () => {
            params.countryCode = "1234";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if countryCode has non numeric characters", async () => {
            params.countryCode = "a";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if phoneNumber is more than 11 characters", async () => {
            params.phoneNumber = "1".repeat(12);
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if phoneNumber has non numeric characters", async () => {
            params.phoneNumber = "a";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if date of birth is in the future", async () => {
            params.dateOfBirth = moment().add(1, "days").toDate();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if max borrow is less than 1", async () => {
            params.maxBorrow = 0;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if max borrow is more than 5", async () => {
            params.maxBorrow = 6;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if additional parameters are passed", async () => {
            params.title = "new";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should save changes if request is valid", async () => {
            await exec();

            const user = await User.findById(id);
            expect(user).toHaveProperty("name", params.name);
            expect(user.dateOfBirth.toISOString()).toEqual(
                params.dateOfBirth.toISOString()
            );
            expect(user.membershipExpiry.toISOString()).toEqual(
                params.membershipExpiry.toISOString()
            );
            expect(user).toHaveProperty("maxBorrow", params.maxBorrow);
            expect(user).toHaveProperty("countryCode", params.countryCode);
        });

        it("should return non admin user if request is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("_id");
            expect(response.body).toHaveProperty("name", params.name);
            expect(response.body).toHaveProperty("email");
            expect(response.body).toHaveProperty("isAdmin", false);
            expect(response.body).toHaveProperty(
                "dateOfBirth",
                params.dateOfBirth.toISOString()
            );
            expect(response.body).toHaveProperty(
                "membershipExpiry",
                params.membershipExpiry.toISOString()
            );
            expect(response.body).toHaveProperty("maxBorrow", params.maxBorrow);
            expect(response.body).toHaveProperty(
                "countryCode",
                params.countryCode
            );
            expect(response.body).toHaveProperty(
                "phoneNumber",
                params.phoneNumber
            );
            expect(response.body).not.toHaveProperty("password");
        });
    });

    describe("DELETE /:id", () => {
        let id;
        let token;
        let user;

        // beforeAll(async () => {});

        beforeEach(async () => {
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash("Abc@starbooks1234", salt);

            user = new User({
                name: "user1",
                email: "abc@abc.com",
                password: password,
                membershipExpiry: moment().add(30, "days"),
                countryCode: "49",
                phoneNumber: "12345678901",
                maxBorrow: 3,
            });
            await user.save();
            id = user._id;

            token = new User({
                isAdmin: true,
            }).generateAuthToken();
        });

        const exec = function () {
            return request(server)
                .delete("/api/users/" + id)
                .set("x-auth-token", token);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const response = await exec();

            expect(response.status).toBe(401);
        });

        it("should return 403 if client is not an admin", async () => {
            token = new User().generateAuthToken();

            const response = await exec();

            expect(response.status).toBe(403);
        });

        it("should return 404 status if id is not valid", async () => {
            id = 1;
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return 404 status if no user with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should remove user from the db if id is valid", async () => {
            await exec();

            const u = await User.findById(user._id);
            expect(u).toBeNull();
        });

        it("should return user if id is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("_id", user._id.toHexString());
            expect(response.body).toHaveProperty("name", user.name);
            expect(response.body).toHaveProperty("email", user.email);
            expect(response.body).toHaveProperty("isAdmin", user.isAdmin);
            expect(response.body).toHaveProperty(
                "membershipExpiry",
                user.membershipExpiry.toISOString()
            );
            expect(response.body).toHaveProperty("maxBorrow", user.maxBorrow);
            expect(response.body).toHaveProperty(
                "countryCode",
                user.countryCode
            );
            expect(response.body).toHaveProperty(
                "phoneNumber",
                user.phoneNumber
            );
            expect(response.body).not.toHaveProperty("password");
        });
    });
});
