import mongoose, { Types } from "mongoose";
import request from "supertest";
import server from "../../dist/index";
import { logger } from "../../dist/startup/logger";
import { conn } from "../../dist/startup/mongo";
import { Book } from "../../dist/models/bookModel";
import { User } from "../../dist/models/userModel";
import { Genre } from "../../dist/models/genreModel";
import { Author } from "../../dist/models/authorModel";

describe("/api/books", () => {
    afterEach(async () => {
        await Book.collection.deleteMany({});
        await Genre.collection.deleteMany({});
        await Author.collection.deleteMany({});
        // server.close();
    });

    afterAll(async () => {
        conn.close();
        logger.close();
        server.close();
    });

    describe("GET /", () => {
        it("should return all the books", async () => {
            const genre1 = new Genre({ name: "genre1" });
            const genre2 = new Genre({ name: "genre2" });
            const author1 = new Author({ name: "author1" });
            const author2 = new Author({ name: "author2" });

            await genre1.save();
            await genre2.save();
            await author1.save();
            await author2.save();

            await Book.collection.insertMany([
                {
                    title: "book1",
                    genre: genre1._id,
                    author: author1._id,
                    yearPublished: 2000,
                    // dailyRentalFee: 40,
                },
                {
                    title: "book2",
                    genre: genre2._id,
                    author: author2._id,
                    yearPublished: 2000,
                    // dailyRentalFee: 50,
                },
            ]);

            const res = await request(server).get("/api/books");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });
    });
    describe("GET /:id", () => {
        it("should return a book if valid id is passed", async () => {
            const genre1 = new Genre({ name: "genre1" });
            const author1 = new Author({ name: "author1" });
            const book = new Book({
                title: "book1",
                genre: genre1._id,
                author: author1._id,
                yearPublished: 2000,
                // dailyRentalFee: 40,
            });
            await genre1.save();
            await author1.save();
            await book.save();

            const response = await request(server).get(
                `/api/books/${book._id}`
            );
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("title", "book1");
            expect(response.body).toHaveProperty(
                "genre._id",
                genre1._id.toHexString()
            );
            expect(response.body).toHaveProperty(
                "author._id",
                author1._id.toHexString()
            );
        });

        it("should return 404 status if id is not valid", async () => {
            const response = await request(server).get("/api/books/1");
            expect(response.status).toBe(404);
        });

        it("should return 404 status if no book with given id is found", async () => {
            const id = mongoose.Types.ObjectId();
            const response = await request(server).get("/api/books/" + id);
            expect(response.status).toBe(404);
        });
    });

    describe("POST /", () => {
        let token;
        let params;

        beforeEach(async () => {
            token = new User({ isAdmin: true }).generateAuthToken();
            const genre = new Genre({ name: "genre1" });
            const author = new Author({ name: "author1" });
            await genre.save();
            await author.save();

            params = {
                title: "book1",
                genre: genre._id,
                author: author._id,
                yearPublished: 2000,
                // dailyRentalFee: 40,
            };
        });

        const exec = function () {
            return request(server)
                .post("/api/books")
                .set("x-auth-token", token)
                .send(params);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const response = await exec();

            expect(response.status).toBe(401);
        });

        it("should return 403 if client is not admin", async () => {
            token = new User().generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it("should return 400 if book title is not passed", async () => {
            delete params.title;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if book title is not unique", async () => {
            const book = new Book({
                title: "book1",
                genre: mongoose.Types.ObjectId(),
                author: mongoose.Types.ObjectId(),
                yearPublished: 2000,
                // dailyRentalFee: 40,
            });
            await book.save();

            params = { title: "book1" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if book title has less than 3 characters", async () => {
            params = { title: "ge" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if genre is not passed", async () => {
            delete params.genre;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if genre is not valid", async () => {
            params.genre = 1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if no genre with given genreId exists", async () => {
            params.genre = mongoose.Types.ObjectId();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if author is not passed", async () => {
            delete params.author;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if author is not valid", async () => {
            params.author = 1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if no author with given authorId exists", async () => {
            params.author = mongoose.Types.ObjectId();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if rating is less than 0", async () => {
            params.rating = -1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if rating is greater than 5", async () => {
            params.rating = 6;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if yearPublished is greater than current year", async () => {
            params.yearPublished = 2050;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if numberInStock is less than 0", async () => {
            params.numberInStock = -1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if numberRentedOut is less than 0", async () => {
            params.numberRentedOut = -1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if dailyRentalRate is not passed", async () => {
            delete params.title;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if additional parameters are passed", async () => {
            params = { title: "book1", additional: "new" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should save book if request is valid", async () => {
            await exec();

            const book = await Book.findOne({ title: "book1" });
            expect(book).not.toBeNull();
        });

        it("should return book if request is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("_id");
            expect(response.body).toHaveProperty("title", "book1");
        });
    });

    describe("PATCH /:id", () => {
        let id;
        let token;
        let params;

        // beforeAll(async () => {});

        beforeEach(async () => {
            const genre = new Genre({ name: "genre1" });
            const author = new Genre({ name: "author1" });
            const book = new Book({
                title: "book1",
                genre: genre._id,
                author: author._id,
                yearPublished: 2000,
                // dailyRentalFee: 40,
            });
            await book.save();
            id = book._id;

            token = new User({ isAdmin: true }).generateAuthToken();
            params = {};
        });

        const exec = function () {
            return request(server)
                .patch("/api/books/" + id)
                .set("x-auth-token", token)
                .send(params);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const response = await exec();

            expect(response.status).toBe(401);
        });

        it("should return 403 if client is not admin", async () => {
            token = new User().generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it("should return 400 if book title has less than 3 characters", async () => {
            params.title = "ge";
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if genre is not valid", async () => {
            params.genre = 1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if no genre with given genreId exists", async () => {
            params.genre = mongoose.Types.ObjectId();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if author is not valid", async () => {
            params.author = 1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if no author with given authorId exists", async () => {
            params.author = mongoose.Types.ObjectId();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        // it("should return 400 if dailyRentalFee is less than 0", async () => {
        //     params.dailyRentalFee = -1;
        //     const response = await exec();

        //     expect(response.status).toBe(400);
        // });

        // it("should return 400 if dailyRentalFee is greater than 500", async () => {
        //     params.dailyRentalFee = 501;
        //     const response = await exec();

        //     expect(response.status).toBe(400);
        // });

        it("should return 400 if rating is less than 0", async () => {
            params.rating = -1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if rating is greater than 5", async () => {
            params.rating = 6;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if yearPublished is greater than current year", async () => {
            params.yearPublished = 2050;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if numberInStock is less than 0", async () => {
            params.numberInStock = -1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if numberRentedOut is less than 0", async () => {
            params.numberRentedOut = -1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if additional parameters are passed", async () => {
            params = { title: "book1", additional: "new" };
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 404 status if id is not valid", async () => {
            id = 1;
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return 404 status if no book with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should save book if params are valid", async () => {
            const genre = new Genre({ name: "genre2" });
            await genre.save();
            const author = new Author({ name: "author2" });
            await author.save();

            params.title = "book2";
            params.genre = genre._id;
            params.author = author._id;

            await exec();

            const book = await Book.findOne({ title: "book2" });
            expect(book).not.toBeNull();
        });

        it("should return book if params are valid", async () => {
            const genre = new Genre({ name: "genre2" });
            await genre.save();
            const author = new Author({ name: "author2" });
            await author.save();

            params.title = "book2";
            params.genre = genre._id;
            params.author = author._id;

            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("title", "book2");
        });
    });

    describe("DELETE /:id", () => {
        let id;
        let token;
        let book;

        beforeEach(async () => {
            book = new Book({
                title: "book1",
                genre: Types.ObjectId(),
                author: Types.ObjectId(),
                yearPublished: 2000,
                // dailyRentalFee: 40,
            });
            await book.save();
            id = book._id;

            token = new User({
                isAdmin: true,
            }).generateAuthToken();
        });

        const exec = function () {
            return request(server)
                .delete("/api/books/" + id)
                .set("x-auth-token", token);
        };

        it("should return 401 if client is not logged in", async () => {
            token = "";
            const response = await exec();

            expect(response.status).toBe(401);
        });

        it("should return 403 if client is not an admin", async () => {
            token = new User({
                title: "John",
                email: "johndoe@jd.com",
                password: "1234",
            }).generateAuthToken();

            const response = await exec();

            expect(response.status).toBe(403);
        });

        it("should return 404 status if id is not valid", async () => {
            id = 1;
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return 404 status if no book with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should remove book from the db if id is valid", async () => {
            await exec();

            const book = await Book.findOne({ title: "book1" });
            expect(book).toBeNull();
        });

        it("should return book if id is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("_id", id.toHexString());
            expect(response.body).toHaveProperty("title", book.title);
            expect(response.body).toHaveProperty(
                "genre",
                book.genre.toHexString()
            );
            expect(response.body).toHaveProperty(
                "author",
                book.author.toHexString()
            );
            expect(response.body).toHaveProperty(
                "yearPublished",
                book.yearPublished
            );
        });
    });
});
