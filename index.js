import dotenv from 'dotenv';
import express from 'express';  // Tambahkan import 'express'
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AdminRouter } from './routes/admin.js';
import { UserRouter } from './routes/user.js';

dotenv.config();

const app = express(); // Pindahkan deklarasi 'app' ke atas
app.use(express.json());

const corsConfig = {
    origin: "*",
    credentials: true,
    method: ["GET", "POST", "PUT", "DELETE"],
}

app.use(cors(corsConfig));

// Middleware CORS
app.use(cors({
    origin: "https://englix-client.vercel.app",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(cookieParser());

// Log requests
app.use((req, res, next) => {
    console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
    next();
});

app.use('/admin', AdminRouter);
app.use('/user', UserRouter);
app.use('/user/:id', UserRouter);

mongoose.connect(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    })
    .catch(err => {
        console.error("Connection error", err);
    });
