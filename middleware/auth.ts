import jwt from "jsonwebtoken";
import config from "config";
import { Request, Response, NextFunction } from "express";

export function auth(req: Request, res: Response, next: NextFunction) {
    if (!config.get("authEnabled")) return next();

    const token = req.header("x-auth-token");
    if (!token)
        return res.status(401).send("Access Denied. No token provided.");

    try {
        const decoded: any = jwt.verify(token, config.get("JWTPrivateKey"));
        req.user = { _id: decoded._id, isAdmin: decoded.isAdmin };
        next();
    } catch (ex) {
        res.status(400).send("Invalid Token.");
    }
}
