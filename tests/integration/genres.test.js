import mongoose from "mongoose";
import request from "supertest";
import server from "../../index";
import { logger } from "../../startup/logger";
import { conn } from "../../startup/mongo";
import { Genre } from "../../models/genreModel";
import { User } from "../../models/userModel";
import { Book } from "../../models/bookModel";

describe("/api/genres", () => {
    // beforeEach(() => {
    //     server = require("../../index");
    // });
    // afterEach(() => {
    //     server.close();
    // });
    afterEach(async () => {
        await Genre.collection.deleteMany({});
        await Book.collection.deleteMany({});
        // server.close();
    });

    afterAll(async () => {
        conn.close();
        logger.close();
        server.close();
    });

    describe("GET /", () => {
        it("should return all the genres", async () => {
            await Genre.collection.insertMany([
                { name: "genre1" },
                { name: "genre2" },
            ]);
            const res = await request(server).get("/api/genres");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });
    });
    describe("GET /:id", () => {
        it("should return a genre if valid id is passed", async () => {
            const genre = new Genre({ name: "genre1" });
            await genre.save();

            const response = await request(server).get(
                `/api/genres/${genre._id}`
            );
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("name", "genre1");
        });

        it("should return 404 status if id is not valid", async () => {
            const response = await request(server).get("/api/genres/1");
            expect(response.status).toBe(404);
        });

        it("should return 404 status if no genre with given id is found", async () => {
            const id = mongoose.Types.ObjectId();
            const response = await request(server).get("/api/genres/" + id);
            expect(response.status).toBe(404);
        });
    });

    describe("POST /", () => {
        let token;
        let params;

        beforeEach(() => {
            token = new User().generateAuthToken();
            params = { name: "genre1" };
        });

        const exec = function () {
            return request(server)
                .post("/api/genres")
                .set("x-auth-token", token)
                .send(params);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const response = await exec();

            expect(response.status).toBe(401);
        });

        it("should return 400 if genre has less than 3 characters", async () => {
            params = { name: "ge" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if genre name is not passed", async () => {
            params = {};
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if additional parameters are passed", async () => {
            params = { name: "genre1", title: "new" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if genre is not unique", async () => {
            const genre = new Genre(params);
            await genre.save();

            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should save genre if request is valid", async () => {
            await exec();

            const genre = await Genre.findOne({ name: "genre1" });
            expect(genre).not.toBeNull();
        });

        it("should return genre if request is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("_id");
            expect(response.body).toHaveProperty("name", "genre1");
        });
    });

    describe("PUT /:id", () => {
        let id;
        let token;
        let params;

        // beforeAll(async () => {});

        beforeEach(async () => {
            const genre = new Genre({ name: "genre1" });
            await genre.save();
            id = genre._id;

            token = new User().generateAuthToken();
            params = { name: "genre2" };
        });

        const exec = function () {
            return request(server)
                .put("/api/genres/" + id)
                .set("x-auth-token", token)
                .send(params);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const response = await exec();

            expect(response.status).toBe(401);
        });

        it("should return 400 if genre has less than 3 characters", async () => {
            params = { name: "ge" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if genre name is not passed", async () => {
            params = {};
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if additional parameters are passed", async () => {
            params = { name: "genre1", title: "new" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 404 status if id is not valid", async () => {
            id = 1;
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return 404 status if no genre with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return 400 if genre is not unique", async () => {
            const genre = new Genre({ name: "genre2" });
            await genre.save();

            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should save genre if request is valid", async () => {
            await exec();

            const genre = await Genre.findOne({ name: "genre2" });
            expect(genre).not.toBeNull();
        });

        it("should return genre if request is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("name", "genre2");
        });
    });

    describe("DELETE /:id", () => {
        let id;
        let token;

        // beforeAll(async () => {});

        beforeEach(async () => {
            const genre = new Genre({ name: "genre1" });
            await genre.save();
            id = genre._id;

            token = new User({
                isAdmin: true,
            }).generateAuthToken();
        });

        const exec = function () {
            return request(server)
                .delete("/api/genres/" + id)
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

        it("should return 404 status if no genre with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return 400 if genre is associated with a book", async () => {
            const book = new Book({
                title: "book1",
                genre: id,
                author: mongoose.Types.ObjectId(),
                numberInStock: 10,
                yearPublished: 2020,
            });
            await book.save();

            const response = await exec();
            expect(response.status).toBe(400);
        });

        it("should remove genre from the db if id is valid", async () => {
            await exec();

            const genre = await Genre.findOne({ name: "genre1" });
            expect(genre).toBeNull();
        });

        it("should return genre if id is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("_id");
            expect(response.body).toHaveProperty("name", "genre1");
        });
    });
});
