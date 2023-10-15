import config from "config";
export function admin(req, res, next) {
    if (!config.get("authEnabled"))
        return next();
    // 401 Unauthorised - When the jwt is invalid
    // 403 Forbidden - When the user doesnt have the permissions to make the request
    // if (!req.user.isAdmin) return res.status(403).send("Access Denied");
    if (!req.accepted)
        return res.status(403).send("Access Denied");
    next();
}
