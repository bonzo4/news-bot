import { RequestHandler } from 'express';

export function checkAuth(token: string): RequestHandler {
    return (req, res, next) => {
        if (req.headers.authorization !== `Bearer ${token}`) {
            res.sendStatus(401);
            return;
        }
        next();
    };
}
