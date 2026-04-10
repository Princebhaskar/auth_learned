import mongoose from "mongoose";

export const connection = () => {
    mongoose.connect(process.env.MONGO_URI, {
        dbName: "mern_authentication"
    })
    .then(() => {
        console.log("Database connected successfully");
    })
    .catch((err) => {
        console.log("Database connection failed", err);
    });
};