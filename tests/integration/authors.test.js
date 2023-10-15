import mongoose, { mongo } from "mongoose";
import request from "supertest";
import server from "../../dist/index";
import { logger } from "../../dist/startup/logger";
import { conn } from "../../dist/startup/mongo";
import { Author } from "../../dist/models/authorModel";
import { User } from "../../dist/models/userModel";
import { Book } from "../../dist/models/bookModel";

describe("/api/authors", () => {
    // beforeEach(() => {
    //     server = require("../../index");
    // });
    // afterEach(() => {
    //     server.close();
    // });
    afterEach(async () => {
        await Author.collection.deleteMany({});
        await Book.collection.deleteMany({});
        // server.close();
    });

    afterAll(async () => {
        conn.close();
        logger.close();
        server.close();
    });

    describe("GET /", () => {
        it("should return all the authors", async () => {
            await Author.collection.insertMany([
                { name: "author1" },
                { name: "author2" },
            ]);
            const res = await request(server).get("/api/authors");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });
    });
    describe("GET /:id", () => {
        it("should return a author if valid id is passed", async () => {
            const author = new Author({ name: "author1" });
            await author.save();

            const response = await request(server).get(
                `/api/authors/${author._id}`
            );
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("name", "author1");
        });

        it("should return 404 status if id is not valid", async () => {
            const response = await request(server).get("/api/authors/1");
            expect(response.status).toBe(404);
        });

        it("should return 404 status if no author with given id is found", async () => {
            const id = mongoose.Types.ObjectId();
            const response = await request(server).get("/api/authors/" + id);
            expect(response.status).toBe(404);
        });
    });

    describe("POST /", () => {
        let token;
        let params;

        beforeEach(() => {
            token = new User().generateAuthToken();
            params = { name: "author1" };
        });

        const exec = function () {
            return request(server)
                .post("/api/authors")
                .set("x-auth-token", token)
                .send(params);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const response = await exec();

            expect(response.status).toBe(401);
        });

        it("should return 400 if author has less than 3 characters", async () => {
            params = { name: "au" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if author name is not passed", async () => {
            params = {};
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if additional parameters are passed", async () => {
            params = { name: "author1", title: "new" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if author is not unique", async () => {
            params = { name: "existingAuthor" };

            const author = new Author(params);
            await author.save();

            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should save author if request is valid", async () => {
            await exec();

            const author = await Author.findOne({ name: "author1" });
            expect(author).not.toBeNull();
        });

        it("should return author if request is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("_id");
            expect(response.body).toHaveProperty("name", "author1");
        });
    });

    describe("PUT /:id", () => {
        let id;
        let token;
        let params;

        // beforeAll(async () => {});

        beforeEach(async () => {
            const author = new Author({ name: "author1" });
            await author.save();
            id = author._id;

            token = new User().generateAuthToken();
            params = { name: "author2" };
        });

        const exec = function () {
            return request(server)
                .put("/api/authors/" + id)
                .set("x-auth-token", token)
                .send(params);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const response = await exec();

            expect(response.status).toBe(401);
        });

        it("should return 400 if author has less than 3 characters", async () => {
            params = { name: "au" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if author name is not passed", async () => {
            params = {};
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if additional parameters are passed", async () => {
            params = { name: "author1", title: "new" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 404 status if id is not valid", async () => {
            id = 1;
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return 404 status if no author with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return 400 if author is not unique", async () => {
            const author = new Author({ name: "author2" });
            await author.save();

            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should save author if id is valid", async () => {
            await exec();

            const author = await Author.findOne({ name: "author2" });
            expect(author).not.toBeNull();
        });

        it("should return author if id is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("name", "author2");
        });
    });

    describe("DELETE /:id", () => {
        let id;
        let token;

        // beforeAll(async () => {});

        beforeEach(async () => {
            const author = new Author({ name: "author1" });
            await author.save();
            id = author._id;

            token = new User({
                isAdmin: true,
            }).generateAuthToken();
        });

        const exec = function () {
            return request(server)
                .delete("/api/authors/" + id)
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

        it("should return 404 status if no author with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return 400 if author is associated with a book", async () => {
            const book = new Book({
                title: "book1",
                genre: mongoose.Types.ObjectId(),
                author: id,
                numberInStock: 10,
                yearPublished: 2020,
            });
            await book.save();

            const response = await exec();
            expect(response.status).toBe(400);
        });

        it("should remove author from the db if id is valid", async () => {
            await exec();

            const author = await Author.findOne({ name: "author1" });
            expect(author).toBeNull();
        });

        it("should return author if id is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("_id");
            expect(response.body).toHaveProperty("name", "author1");
        });
    });
});
