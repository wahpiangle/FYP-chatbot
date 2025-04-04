import { type NextFunction, type Request, type Response } from 'express';

const redirectLogin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        res.status(401).json({ message: 'You are not logged in' });
    }
    // else if (!req.session.user.verified) {
    //     res.json({ message: 'You need to verify your phone number to access this route' });
    // }
    else {
        next();
    }
}

export default redirectLogin;