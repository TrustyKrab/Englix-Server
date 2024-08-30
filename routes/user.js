import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import cors from 'cors';

dotenv.config();
const app = express();

// Middleware CORS
app.use(cors({
    origin: 'https://englix-client.vercel.app', // Ganti dengan domain klien Anda
    credentials: true // Jika Anda menggunakan cookie
}));

app.use(express.json()); // Parsing JSON body

const router = express.Router();

// Rute-rute Anda di sini
router.get("/getUsers", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Terjadi kesalahan" });
    }
});

router.get("/:id/getUserByID", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.json(user);
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: "User tidak ditemukan" });
    }
});

router.patch('/:id/updateUser', async (req, res) => {
    try {
        const updateUser = await User.updateOne({ _id: req.params.id }, { $set: req.body });
        res.status(200).json({ message: "Berhasil mengupdate", updateUser });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: "Terjadi kesalahan" });
    }
});

router.get("/getUserByUsername", async (req, res) => {
    const { username } = req.query;
    try {
        const user = await User.findOne({ username });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "User tidak ditemukan" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Terjadi kesalahan" });
    }
});

router.delete('/:id/deleteUser', async (req, res) => {
    try {
        const deleteUser = await User.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: "Berhasil menghapus", deleteUser });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: "Terjadi kesalahan" });
    }
});

router.post('/register', async (req, res) => {
    const { email, username, password, notlp } = req.body;

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
        return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
        return res.status(400).json({ message: "Username sudah terdaftar" });
    }

    try {
        const hashpassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            username,
            notlp,
            password: hashpassword
        });

        await newUser.save();
        return res.status(201).json({ status: true, message: "User berhasil terdaftar" });
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "Error saat mendaftar pengguna" });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: false, message: "Akun tidak ditemukan" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ status: false, message: "Password salah" });
        }

        const token = jwt.sign({ username: user.username }, process.env.KEY, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, maxAge: 360000 });
        return res.json({ message: "Login berhasil", token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.post('/submitresult', async (req, res) => {
    const { percoobaan, username, score, quizname } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
    }

    try {
        if (!user.quiz) {
            user.quiz = [{ percoobaan: 1 }];
        }

        user.quiz.push({ percoobaan: user.quiz.length + 1, score, quizname });

        await user.save();
        return res.status(200).json({ message: "Nilai quiz tersimpan" });
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "Terjadi kesalahan saat submit" });
    }
});

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User tidak ditemukan" });
        }

        const token = jwt.sign({ id: user._id }, process.env.KEY, {
            expiresIn: "10m",
        });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Reset Password",
            text: `https://englix-client.vercel.app/user/reset-password/${token}`,
        };

        transporter.sendMail(mailOptions, function (error) {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({ status: false, message: "Gagal mengirim email" });
            } else {
                return res.status(200).json({ status: true, message: "Email terkirim" });
            }
        });
    } catch (error) {
        console.error("Error during reset password process:", error);
        return res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ status: true });
});

app.use('/user', router); // Daftarkan router ke app

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
