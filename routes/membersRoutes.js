// import { memberSchema, memberSchemaObject } from "../models/memberModel.js";
// import { auth } from "../middleware/auth.js";
// import express from "express";
// import { admin } from "../middleware/admin.js";
// import { Member } from "../models/memberModel.js";
// import validateObjectId from "../middleware/validateObjectId.js";
// import Joi from "joi";
// import { validateBody, validateEachParameter } from "../middleware/validate.js";
// import { genreSchema } from "../models/genreModel.js";
// const router = express.Router();

// router.get("/", auth, async (req, res) => {
//     res.send(await Member.find());
// });

// router.get("/:id", [validateObjectId, auth], async (req, res) => {
//     const member = await Member.findById(req.params.id);

//     if (!member) return res.status(404).send("Resource not found");
//     res.send(member);
// });

// router.post("/", [auth, validateBody(memberSchemaObject)], async (req, res) => {

//     const member = await new Member(req.body).save();
//     res.status(201).send(member);
// });

// // router.put("/:id", auth, async (req, res) => {
// //     if (!Member.findById(req.params.id))
// //         return res.status(404).send("Resource not found");

// //     const { error } = memberSchemaObject.validate(req.body);
// //     if (error)
// //         return res.status(400).send(`Errors in fields...
// //       ${JSON.stringify(error.details[0].message)}`);

// //     const member = await Member.findByIdAndUpdate(
// //         req.params.id,
// //         { $set: req.body },
// //         { new: true, runValidators: true }
// //     );
// //     res.send(member);
// // });

// router.patch(
//     "/:id",
//     [validateObjectId, auth, validateEachParameter(genreSchema)],
//     async (req, res) => {
//         if (req.body.isMember) {
//             if (!req.body.membershipExpiry)
//                 return res
//                     .status(400)
//                     .send("Membership Expiry date is required");
//         }

//         const member = await Member.findByIdAndUpdate(
//             req.params.id,
//             { $set: req.body },
//             { new: true, runValidators: true }
//         );
//         if (!member) return res.status(404).send("Resource not found");
//         res.send(member);
//     }
// );

// router.delete("/:id", [validateObjectId, auth, admin], async (req, res) => {
//     const member = await Member.findByIdAndDelete(req.params.id);
//     if (!member) return res.status(404).send("Resource not found");
//     res.send(member);
// });

// export default router;
