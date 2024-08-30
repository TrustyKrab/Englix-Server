import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer'
import cors from 'cors';
import express from 'express';


const app = express();

app.use(cors({
    origin: 'https://englix-client.vercel.app', // Izinkan permintaan dari domain klien Anda
    credentials: true // Jika Anda menggunakan cookie
}));

dotenv.config();
const router = express.Router();

router.get("/getUsers", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users)
    } catch (error) {
        console.log(error)
    }
})

router.get("/:id/getUserByID", async (req, res) => {
    try {
        const users = await User.findById(req.params.id);
        res.json(users)
    } catch (error) {
        console.log(error)
        return res.status(404).json
    }
})

router.patch('/:id/updateUser', async (req, res) => {
    try {
        const updateUser = await User.updateOne({ _id: req.params.id }, { $set: req.body })
        res.status(201).json({ message: "berhasil mengupdate", updateUser })
    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: "terjadi kesalahan" })
    }
})

router.get("/getUserByUsername", async (req, res) => {
    const { username } = req.query;
    try {
        const user = await User.findOne({ username });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.delete('/:id/deleteUser', async (req, res) => {
    try {
        const deleteUser = await User.deleteOne({ _id: req.params.id })
        res.status(201).json({ message: "berhasil menghapus", deleteUser })
    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: "terjadi kesalahan" })
    }
})

router.post('/register', async (req, res) => {
    const { email, username, password, notlp } = req.body;

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
    }

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
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
        return res.json({ status: true, message: "User registered successfully" });
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "Error registering user" });
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
            return res.status(400).json({ status: false, message: "Password yang Anda masukkan salah" });
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
        return res.status(404).json({ message: "user tidak ditemukan" })
    }

    try {
        if (!user.quiz) {
            user.quiz = [{ percoobaan: 1 }]
        }

        user.quiz.push({ percoobaan: user.quiz.length + 1, score, quizname })

        await user.save()
        return res.status(200).json({ message: "nilai Quiz tersimpan" })
    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: "terjadi kesalahan saat melakukan submit" })
    }
})

// router.post('/forgotpassword', async (req, res) => {
//     const { email } = req.body;

//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ status: false, message: "Akun tidak ditemukan" });
//         }

//         const token = jwt.sign({ id: user._id }, process.env.KEY, { expiresIn: '10m' });
//         var transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS
//             }
//         });

//         var mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: 'Reset Password',
//             text: `https://englix-client.vercel.app/resetpassword/${token}`
//         };

//         transporter.sendMail(mailOptions, function (error, info) {
//             if (error) {
//                 return res.json({ message: "Error sending email" });
//             } else {
//                 return res.json({ status: true, message: "Email sent" });
//             }
//         });
//     } catch (err) {
// console.log(err);
//     }
// });


router.post("/forgot-password", async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found for email:", email);
            return res.status(400).json({ message: "User tidak ditemukan" });
        }

        const token = jwt.sign({ id: user._id }, process.env.KEY, {
            expiresIn: "10m",
        });

        var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        var mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Reset Password",
            text: `https://englix-client.vercel.app/user/reset-password/${token}`,
        };

        transporter.sendMail(mailOptions, function (error) {
            if (error) {
                console.error("Error sending email:", error);
                return res
                    .status(500)
                    .json({ status: false, message: "Gagal mengirim email" });
            } else {
                console.log("Email sent to:", email);
                return res
                    .status(200)
                    .json({ status: true, message: "Email terkirim" });
            }
        });
    } catch (error) {
        console.error("Error during reset password process:", error);
        return res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});



// router.post('/resetpassword', async (req, res) => {
//     const { password, token } = req.body;

//     try {
//         const decoded = jwt.verify(token, process.env.KEY);
//         const userId = decoded.id;

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         const hashpassword = await bcrypt.hash(password, 10);
//         user.password = hashpassword;
//         await user.save();

//         return res.json({ status: true, message: "Password berhasil diubah" });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Terjadi kesalahan pada server" });
//     }
// });

router.get('/logout', (req, res) => {
    res.clearCookie('token')
    return res.json({ status: true })
})

export { router as UserRouter };