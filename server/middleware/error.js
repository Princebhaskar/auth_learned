class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
       
    }
}

export const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    
    if(err.name === "castError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }
     if(err.name === "jsonWebTokenError") {
        const message = `jsonWebToken is invalid, try again.`;
        err = new ErrorHandler(message, 400);
    }

     if(err.name === "tokenExpiredError") {
        const message = `jsonWebToken is expired, try again.`;
        err = new ErrorHandler(message, 400);
    }
    if(err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
        err = new ErrorHandler(message, 400);
    }

    return res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};

export default ErrorHandler;