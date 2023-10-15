import { auth } from "../middleware/auth.js";
import express from "express";
import { Book } from "../models/bookModel.js";
import { User } from "../models/userModel.js";
import { conn } from "../startup/mongo.js";
import { rentalSchemaObject } from "../models/rentalModel.js";
import { admin } from "../middleware/admin.js";
import { Rental } from "../models/rentalModel.js";
import _ from "lodash";
import validateObjectId from "../middleware/validateObjectId.js";
import { validateBody } from "../middleware/validate.js";
import { Request, Response } from "express";

const router = express.Router();

router.get("/", [auth, admin], async (req: Request, res: Response) => {
    res.send(await Rental.find().populate(["book", "user"]).sort("-_id"));

    // const user = await User.findById(req.user._id)
    //     .select("activeRentals")
    //     .populate("activeRentals")
    //     .populate({
    //         path: "activeRentals",
    //         populate: {
    //             path: "book",
    //             model: Book,
    //         },
    //     });

    // res.send(user.activeRentals);
});

router.get(
    "/:id",
    [validateObjectId, auth, admin],
    async (req: Request, res: Response) => {
        const rental = await Rental.findById(req.params.id).populate([
            "book",
            "user",
        ]);
        if (!rental) return res.status(404).send("Resource not found");

        res.send(rental);
    }
);

router.post(
    "/",
    [auth, admin, validateBody(rentalSchemaObject)],
    async (req: Request, res: Response) => {
        const user = await User.findById(req.body.user);
        if (!user) return res.status(400).send("Invalid User.");

        if (user.isAdmin)
            return res.status(400).send("Admin cannot rent books you weirdo.");

        if (user.membershipExpiry && new Date() > user.membershipExpiry)
            return res.status(400).send("User membership has expired");

        if (user.activeRentals.length >= user.maxBorrow)
            return res
                .status(400)
                .send("User has reached the maximum limit of borrowing.");

        const book = await Book.findById(req.body.book);
        if (!book) return res.status(400).send("Invalid Book.");

        if (book.numberInStock === 0)
            return res.status(400).send(`'${book.title}' is out of stock`);

        const session = await conn.startSession();
        try {
            await session.withTransaction(async () => {
                const rental = await new Rental({
                    user: user._id,
                    book: book._id,
                }).save();

                await Book.findByIdAndUpdate(
                    book._id,
                    {
                        $inc: { numberInStock: -1, numberRentedOut: 1 },
                    },
                    { runValidators: true }
                );
                // throw new Error("Some error");
                await User.findByIdAndUpdate(
                    user._id,
                    {
                        $push: { activeRentals: rental._id },
                    },
                    { runValidators: true }
                );
                res.status(201).send(
                    await Rental.findById(rental._id).populate(["book", "user"])
                );
            });
            session.endSession();
        } catch (ex) {
            res.status(500).send(ex);
        }
    }
);

// router.put("/:id", auth, async (req:Request, res:Response) => {
//     const { error } = rentalSchemaObject.validate();
//     if (error) {
//         return res.status(400).send(`Errors in fields...
//     ${error[0]}`);
//     }

//     const user = await User.findById(req.body.userId);
//     if (!user) return res.status(404).send("Invalid User.");
//     const book = await Book.findById(req.body.bookId);
//     if (!book) return res.status(404).send("Invalid Book.");

//     if (book.numberInStock === 0)
//         return res.status(400).send(`'${book.title}' is out of stock`);

//     let rental = {
//         ...req.body,
//         book: _.pick(book, [
//             "_id",
//             "title",
//             "genre",
//             "author",
//             "dailyRentalFee",
//         ]),
//     };
//     delete rental.bookId;

//     rental = await saveRental(rental, req.params.id);
//     res.send(rental);
// });

router.patch(
    "/return/:id",
    [validateObjectId, auth, admin],
    async (req: Request, res: Response) => {
        const rentalInDb = await Rental.findById(req.params.id);
        if (!rentalInDb) return res.status(404).send("Resource not found");

        if (rentalInDb.dateReturned) {
            return res.status(400).send("Book has already been returned");
        }

        let rental;

        const session = await conn.startSession();
        try {
            await session.withTransaction(async () => {
                const user = await User.findByIdAndUpdate(
                    rentalInDb.user,
                    {
                        $pull: { activeRentals: req.params.id },
                    },
                    { runValidators: true }
                );
                const book = await Book.findByIdAndUpdate(
                    rentalInDb.book,
                    {
                        $inc: { numberInStock: 1, numberRentedOut: -1 },
                    },
                    { runValidators: true }
                );
                rental = await Rental.findByIdAndUpdate(
                    req.params.id,
                    { $set: { dateReturned: new Date() } },
                    { new: true, runValidators: true }
                ).populate(["book", "user"]);
            });
            session.endSession();
        } catch (ex) {
            res.status(500).send(ex);
        }

        // let rental = { dateReturned: new Date() };
        // if (user.isUser) {
        //     if (user.membershipExpiry < rental.dateReturned) {
        //         rental.rentalFee =
        //             book.dailyRentalFee *
        //             (moment().diff(user.membershipExpiry, "days") + 1);
        //     }
        // } else {
        //     rental.rentalFee =
        //         book.dailyRentalFee *
        //         (moment().diff(rentalInDb._id.getTimestamp(), "days") + 1);
        // }

        res.send(rental);
    }
);

router.delete(
    "/:id",
    [validateObjectId, auth, admin],
    async (req: Request, res: Response) => {
        const rental = await Rental.findById(req.params.id).populate([
            "book",
            "user",
        ]);

        if (!rental) return res.status(404).send("Resource not found");
        if (!rental.dateReturned)
            return res.status(400).send("Rental is still active");

        await rental.remove();

        res.send(rental);
    }
);

export default router;
