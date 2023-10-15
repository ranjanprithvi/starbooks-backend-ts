import mongoose, { Types, mongo } from "mongoose";
import request from "supertest";
import server from "../../dist/index";
import { logger } from "../../dist/startup/logger";
import { conn } from "../../dist/startup/mongo";
import { Rental } from "../../dist/models/rentalModel";
import { User } from "../../dist/models/userModel";
import moment from "moment";
import { Book } from "../../dist/models/bookModel";

describe("/api/rentals", () => {
    let token;
    let user;

    afterEach(async () => {
        await Rental.collection.deleteMany({});
        await Book.collection.deleteMany({});
        await User.collection.deleteMany({});
        // server.close();
    });

    afterAll(async () => {
        conn.close();
        logger.close();
        server.close();
    });

    function exec() {
        return request(server).get("/api/rentals").set("x-auth-token", token);
    }

    describe("GET /", () => {
        beforeEach(async () => {
            token = new User({ isAdmin: true }).generateAuthToken();
            const book1 = new Book({
                title: "book1",
                genre: Types.ObjectId(),
                author: Types.ObjectId(),
                yearPublished: 2020,
            });
            const book2 = new Book({
                title: "book2",
                genre: Types.ObjectId(),
                author: Types.ObjectId(),
                yearPublished: 2019,
            });
            await book1.save();
            await book2.save();

            const rental1 = new Rental({
                book: book1._id,
            });
            const rental2 = new Rental({
                book: book2._id,
            });

            user = new User({
                name: "user1",
                email: "abc@abc.com",
                password: "12345",
                phoneNumber: "12345678901",
                membershipExpiry: moment().add(30, "days"),
                maxBorrow: 2,
                activeRentals: [rental1._id, rental2._id],
            });
            await user.save();
            await Rental.collection.insertMany([
                {
                    user: mongoose.Types.ObjectId(),
                    book: mongoose.Types.ObjectId(),
                },
                {
                    user: mongoose.Types.ObjectId(),
                    book: mongoose.Types.ObjectId(),
                },
            ]);
            rental1.user = user._id;
            rental2.user = user._id;
            await rental1.save();
            await rental2.save();
        });

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

        it("should return all the rentals is user is admin", async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(4);
        });

        // it("should return only rentals belonging to member if user is member", async () => {
        //     token = user.generateAuthToken();
        //     const res = await request(server)
        //         .get("/api/rentals")
        //         .set("x-auth-token", token);
        //     expect(res.status).toBe(200);
        //     expect(res.body.length).toBe(2);
        // });
    });

    describe("GET /:id", () => {
        let id;
        beforeEach(() => {
            token = new User({ isAdmin: true }).generateAuthToken();
        });

        const exec = function () {
            return request(server)
                .get(`/api/rentals/${id}`)
                .set("x-auth-token", token);
        };

        it("should return 401 if client is not logged in", async () => {
            id = mongoose.Types.ObjectId();
            token = "";
            const response = await exec();

            expect(response.status).toBe(401);
        });

        it("should return 403 if client is not admin", async () => {
            token = new User().generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it("should return 404 status if id is not valid", async () => {
            id = 1;
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return 404 status if no rental with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return a rental if valid id is passed", async () => {
            const user = new User({
                name: "user1",
                email: "abc@abc.com",
                password: "12345",
                membershipExpiry: moment().add(30, "days"),
                maxBorrow: 3,
                activeRentals: [Types.ObjectId(), Types.ObjectId()],
            });
            const book = new Book({
                title: "book1",
                genre: { _id: mongoose.Types.ObjectId(), name: "genre1" },
                author: { _id: mongoose.Types.ObjectId(), name: "author1" },
                yearPublished: 2020,
                // dailyRentalFee: 40,
                numberInStock: 1,
            });

            const rental = new Rental({
                user: user._id,
                book: book._id,
            });
            await rental.save();
            await user.save();
            await book.save();

            id = rental._id;

            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty(
                "user._id",
                user._id.toString()
            );
            expect(response.body).toHaveProperty(
                "book._id",
                book._id.toString()
            );
        });
    });

    describe("POST /", () => {
        let token;
        let params;
        let user;
        let book;

        beforeEach(async () => {
            token = new User({ isAdmin: true }).generateAuthToken();
            user = new User({
                name: "user1",
                email: "abc@abc.com",
                password: "12345",
                membershipExpiry: moment().add(30, "days"),
                maxBorrow: 3,
                activeRentals: [Types.ObjectId(), Types.ObjectId()],
            });
            book = new Book({
                title: "book1",
                genre: { _id: mongoose.Types.ObjectId(), name: "genre1" },
                author: { _id: mongoose.Types.ObjectId(), name: "author1" },
                yearPublished: 2020,
                // dailyRentalFee: 40,
                numberInStock: 1,
            });
            await user.save();
            await book.save();
            params = {
                user: user._id,
                book: book._id,
            };
        });

        const exec = function () {
            return request(server)
                .post("/api/rentals")
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

        it("should return 400 if user is not passed", async () => {
            delete params.user;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user is invalid", async () => {
            params.user = 1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if no user with the given userId exists", async () => {
            params.user = mongoose.Types.ObjectId();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if book is not passed", async () => {
            delete params.book;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if book is invalid", async () => {
            params.book = 1;
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if no book with the given bookId exists", async () => {
            params.book = mongoose.Types.ObjectId();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if book is not in stock", async () => {
            book.numberInStock = 0;
            await book.save();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user is not a member", async () => {
            user.isAdmin = true;
            await user.save();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if user has reached maxBorrow limit", async () => {
            user.maxBorrow = 2;
            await user.save();
            const response = await exec();

            expect(response.status).toBe(400);
        });

        // it("should return 400 if rentalFee is not a number", async () => {
        //     params.rentalFee = "a";
        //     const response = await exec();

        //     expect(response.status).toBe(400);
        // });

        it("should return 400 if user membership has expired", async () => {
            user.membershipExpiry = new Date(moment().subtract(5, "days"));
            await user.save();

            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should return 400 if additional parameters are passed", async () => {
            params.additional = "new";
            const response = await exec();

            expect(response.status).toBe(400);
        });
        it("should save rental if request is valid", async () => {
            await exec();

            const rental = await Rental.findOne({
                user: user._id,
                book: book._id,
            });
            expect(rental).not.toBeNull();
        });

        it("should return rental if request is valid", async () => {
            const response = await exec();

            const userInDb = await User.findById(params.user);
            const bookInDb = await Book.findById(params.book);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("_id");
            expect(response.body).toHaveProperty(
                "user._id",
                userInDb._id.toString()
            );
            expect(response.body).toHaveProperty(
                "book._id",
                bookInDb._id.toString()
            );
            expect(bookInDb.numberInStock).toEqual(0);
            expect(bookInDb.numberRentedOut).toEqual(1);
            expect(userInDb.activeRentals[2].toString()).toEqual(
                response.body._id.toString()
            );
        });
    });

    describe("PATCH /return/:id", () => {
        let id;
        let token;
        let user;
        let book;
        let rental;

        // beforeAll(async () => {});

        beforeEach(async () => {
            token = new User({ isAdmin: true }).generateAuthToken();
            user = new User({
                name: "user1",
                email: "abc@abc.com",
                password: "12345",
                membershipExpiry: moment().add(30, "days"),
                maxBorrow: 3,
                activeRentals: [Types.ObjectId(), Types.ObjectId()],
            });
            book = new Book({
                title: "book1",
                genre: { _id: mongoose.Types.ObjectId(), name: "genre1" },
                author: { _id: mongoose.Types.ObjectId(), name: "author1" },
                yearPublished: 2020,
                // dailyRentalFee: 40,
                numberInStock: 0,
                numberRentedOut: 1,
            });

            rental = new Rental({
                user,
                book,
            });
            id = rental._id;
            user.activeRentals.push(id);

            await user.save();
            await book.save();
            await rental.save();
        });

        const exec = function () {
            return request(server)
                .patch("/api/rentals/return/" + id)
                .set("x-auth-token", token);
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

        it("should return 404 status if id is not valid", async () => {
            id = 1;
            const response = await exec();

            expect(response.status).toBe(404);
        });

        it("should return 404 status if no rental with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();

            expect(response.status).toBe(404);
        });

        it("should return 400 if rental has already been returned", async () => {
            rental.dateReturned = new Date();
            await rental.save();

            const response = await exec();

            expect(response.status).toBe(400);
        });

        it("should save rental if request is valid", async () => {
            await exec();

            const rentalInDb = await Rental.findById(id);
            expect(rentalInDb).not.toBeNull();
        });

        it("should return rental if request is valid", async () => {
            const res = await exec();

            const userInDb = await User.findById(rental.user);
            const bookInDb = await Book.findById(rental.book);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("_id");
            expect(res.body).toHaveProperty("user._id", user._id.toString());
            expect(res.body).toHaveProperty("book._id", book._id.toString());
            expect(res.body).toHaveProperty("dateReturned");
            expect(userInDb.activeRentals[2]).toEqual(undefined);
            expect(bookInDb.numberInStock).toEqual(1);
            expect(bookInDb.numberRentedOut).toEqual(0);
        });
    });

    describe("DELETE /:id", () => {
        let id;
        let token;
        let user;
        let book;
        let rental;

        // beforeAll(async () => {});

        beforeEach(async () => {
            token = new User({ isAdmin: true }).generateAuthToken();
            user = new User({
                name: "user1",
                email: "abc@abc.com",
                password: "12345",
                membershipExpiry: moment().add(30, "days"),
                maxBorrow: 3,
                activeRentals: [Types.ObjectId(), Types.ObjectId()],
            });
            book = new Book({
                title: "book1",
                genre: { _id: mongoose.Types.ObjectId(), name: "genre1" },
                author: { _id: mongoose.Types.ObjectId(), name: "author1" },
                yearPublished: 2020,
                // dailyRentalFee: 40,
                numberInStock: 0,
                numberRentedOut: 1,
            });

            rental = new Rental({
                user,
                book,
                dateReturned: new Date(),
            });
            id = rental._id;
            user.activeRentals.push(id);

            await user.save();
            await book.save();
            await rental.save();
        });
        const exec = function () {
            return request(server)
                .delete("/api/rentals/" + id)
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

        it("should return 404 status if no rental with given id is found", async () => {
            id = mongoose.Types.ObjectId();
            const response = await exec();
            expect(response.status).toBe(404);
        });

        it("should return 400 status if active rental is trying to be deleted", async () => {
            // rental.dateReturned = undefined;
            await Rental.findByIdAndUpdate(id, { $unset: { dateReturned: 1 } });
            await rental.save();

            id = rental._id;

            const response = await exec();
            expect(response.status).toBe(400);
        });

        it("should remove rental from the db if id is valid", async () => {
            await exec();

            const r = await Rental.findById(id);
            expect(r).toBeNull();
        });

        it("should return rental if id is valid", async () => {
            const response = await exec();

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("_id");
            // expect(response.body).toHaveProperty("rentalFee", 40);
            expect(response.body).toHaveProperty(
                "user._id",
                user._id.toString()
            );
            expect(response.body).toHaveProperty(
                "book._id",
                book._id.toString()
            );
            expect(response.body).toHaveProperty("dateReturned");
        });
    });
});
