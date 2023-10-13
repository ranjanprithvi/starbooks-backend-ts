import mongoose from "mongoose";
import request from "supertest";
import server from "../../index";
import { logger } from "../../startup/logger";
import { conn } from "../../startup/mongo";
import { Member } from "../../models/memberModel";
import { User } from "../../models/userModel";
import moment from "moment";

describe("/api/members", () => {
    let token;

    afterEach(async () => {
        await Member.collection.deleteMany({});
        // server.close();
    });

    afterAll(async () => {
        conn.close();
        logger.close();
        server.close();
    });

    describe("GET /", () => {
        beforeEach(() => {
            token = new User().generateAuthToken();
        });

        it("should return all the members", async () => {
            await Member.collection.insertMany([
                {
                    name: "member1",
                    phone: 7723482234,
                },
                {
                    name: "member2",
                    phone: 7723482233,
                },
            ]);

            const res = await request(server)
                .get("/api/members")
                .set("x-auth-token", token);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });
    });
    describe("GET /:id", () => {
        beforeEach(() => {
            token = new User().generateAuthToken();
        });

        it("should return a member if valid id is passed", async () => {
            const member = new Member({
                name: "member1",
                phone: 7723482234,
            });
            await member.save();

            const response = await request(server)
                .get(`/api/members/${member._id}`)
                .set("x-auth-token", token);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("name", "member1");
            expect(response.body).toHaveProperty("phone", 7723482234);
        });

        it("should return 404 status if id is not valid", async () => {
            const response = await request(server)
                .get("/api/members/1")
                .set("x-auth-token", token);
            expect(response.status).toBe(404);
        });

        it("should return 404 status if no member with given id is found", async () => {
            const id = mongoose.Types.ObjectId();
            const response = await request(server)
                .get("/api/members/" + id)
                .set("x-auth-token", token);
            expect(response.status).toBe(404);
        });
    });

    describe("POST /", () => {
        let token;
        let params;

        beforeEach(async () => {
            token = new User().generateAuthToken();
            params = {
                name: "member1",
                phone: 7723482234,
            };
        });

        const exec = function () {
            return request(server)
                .post("/api/members")
                .set("x-auth-token", token)
                .send(params);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const response = await exec();

            expect(response.status).toBe(401);
        });

        it("should return 400 if member name is not passed", async () => {
            delete params.name;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if member name has less than 3 characters", async () => {
            params.name = "ge";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if phone is not passed", async () => {
            delete params.phone;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if phone has less than 10 digits", async () => {
            params.phone = 12345;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if phone has more than 10 digits", async () => {
            params.phone = 12345678901;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if email is not valid", async () => {
            params.email = "abc";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if dateOfBirth is greater than current date", async () => {
            params.dateOfBirth = moment().add(5, "days");
            const response = await exec();

            expect(response.status).toBe(400);
        });

        // it("should return 400 if isMember is not a boolean", async () => {
        //     params.isMember = "asd";
        //     const response = await exec();

        //     expect(response.status).toBe(400);
        // });

        it("should return 400 if membershipExpiry is not a date", async () => {
            params.membershipExpiry = "asd";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if membershipExpiry is not passed", async () => {
            // params.isMember = true;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if maxBorrow is less than 1", async () => {
            params.maxBorrow = 0;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if maxBorrow is greater than 5", async () => {
            params.maxBorrow = 6;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if additional parameters are passed", async () => {
            params.additional = "new";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should save non member member if request is valid", async () => {
            await exec();

            const member = await Member.findOne({ name: "member1" });
            expect(member).not.toBeNull();
        });

        it("should save member member if request is valid", async () => {
            // params.isMember = true;
            params.membershipExpiry = moment();
            await exec();

            const member = await Member.findOne({ name: "member1" });
            expect(member).not.toBeNull();
        });

        it("should return member if request is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("_id");
            expect(response.body).toHaveProperty("name", "member1");
        });
    });

    describe("PATCH /:id", () => {
        let id;
        let token;
        let params;

        // beforeAll(async () => {});

        beforeEach(async () => {
            const member = new Member({
                name: "member1",
                phone: 2212321232,
            });
            await member.save();
            id = member._id;

            token = new User().generateAuthToken();
            params = {
                name: "member2",
                phone: 1234512345,
                membershipExpiry: moment().add(30, "days"),
                maxBorrow: 2,
            };
        });

        const exec = function () {
            return request(server)
                .patch("/api/members/" + id)
                .set("x-auth-token", token)
                .send(params);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const response = await exec();

            expect(response.status).toBe(401);
        });

        it("should return 404 status if id is not valid", async () => {
            id = 1;
            const response = await exec();

            expect(response.status).toBe(404);
        });

        it("should return 404 status if no member with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();

            expect(response.status).toBe(404);
        });

        it("should return 400 if member name has less than 3 characters", async () => {
            params.name = "ge";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if phone has less than 10 digits", async () => {
            params.phone = 12345;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if phone has more than 10 digits", async () => {
            params.phone = 12345678901;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if email is not valid", async () => {
            params.email = "abc";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if dateOfBirth is greater than current date", async () => {
            params.dateOfBirth = moment().add(5, "days");
            const response = await exec();

            expect(response.status).toBe(400);
        });

        // it("should return 400 if isMember is not a boolean", async () => {
        //     params.isMember = "asd";
        //     const response = await exec();

        //     expect(response.status).toBe(400);
        // });

        it("should return 400 if membershipExpiry is not a date", async () => {
            params.membershipExpiry = "asd";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if membershipExpiry is not passed", async () => {
            // params.isMember = true;
            delete params.membershipExpiry;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if maxBorrow is less than 1", async () => {
            params.maxBorrow = 0;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if maxBorrow is greater than 5", async () => {
            params.maxBorrow = 6;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if additional parameters are passed", async () => {
            params.additional = "new";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should save member if request is valid", async () => {
            await exec();

            const member = await Member.findOne({
                name: params.name,
                phone: params.phone,
                membershipExpiry: params.membershipExpiry,
                maxBorrow: params.maxBorrow,
            });
            expect(member).not.toBeNull();
        });

        it("should return member if request is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                name: params.name,
                phone: params.phone,
                membershipExpiry: params.membershipExpiry,
                maxBorrow: params.maxBorrow,
            });
        });
    });

    describe("DELETE /:id", () => {
        let id;
        let token;

        beforeEach(async () => {
            const member = new Member({
                name: "member1",
                phone: 1212312321,
            });
            await member.save();
            id = member._id;

            token = new User({
                isAdmin: true,
            }).generateAuthToken();
        });

        const exec = function () {
            return request(server)
                .delete("/api/members/" + id)
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

        it("should return 404 status if no member with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should remove member from the db if id is valid", async () => {
            await exec();

            const member = await Member.findOne({ name: "member1" });
            expect(member).toBeNull();
        });

        it("should return member if id is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("_id");
            expect(response.body).toHaveProperty("name", "member1");
        });
    });
});
