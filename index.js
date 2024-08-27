import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
dotenv.config();
import { AdminRouter } from './routes/admin.js';
import { UserRouter } from './routes/user.js';



const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(cookieParser())
app.use('/admin', AdminRouter)
app.use('/user', UserRouter)
app.use('/user/:id', UserRouter)




mongoose.connect('mongodb://127.0.0.1:27017/fatih')
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    }).catch(err => {
        console.error("Connection error", err);
    });