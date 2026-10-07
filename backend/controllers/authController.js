const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const db = require("../config/database");

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

// ==========================
// REGISTER
// ==========================
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Cek data wajib
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Nama, email, dan password wajib diisi."
            });
        }

        // Cek panjang password
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password minimal 6 karakter."
            });
        }

        // Cek email sudah terdaftar
        const [existingUsers] = await db.promise().query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email sudah terdaftar."
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Simpan user
        const [result] = await db.promise().query(
            `INSERT INTO users 
            (name, email, password_hash, provider)
            VALUES (?, ?, ?, 'local')`,
            [name, email, passwordHash]
        );

        res.status(201).json({
            success: true,
            message: "Registrasi berhasil.",
            user: {
                id: result.insertId,
                name,
                email,
                provider: "local"
            }
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server."
        });
    }
};


// ==========================
// LOGIN
// ==========================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cek data wajib
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email dan password wajib diisi."
            });
        }

        // Cari user berdasarkan email
        const [users] = await db.promise().query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah."
            });
        }

        const user = users[0];

        // Cek password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah."
            });
        }

        // Buat JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        // Response
        res.status(200).json({
            success: true,
            message: "Login berhasil.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                provider: user.provider
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server."
        });
    }
};

// ==========================
// GOOGLE LOGIN
// ==========================
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential tidak ditemukan."
            });
        }

        // Verifikasi token dari Google
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name;
        const profilePicture = payload.picture;

        if (!googleId || !email) {
            return res.status(400).json({
                success: false,
                message: "Data akun Google tidak lengkap."
            });
        }

        // Cari user berdasarkan Google ID
        const [users] = await db.promise().query(
            "SELECT * FROM users WHERE google_id = ?",
            [googleId]
        );

        let user;

        // =================================
        // USER GOOGLE SUDAH TERDAFTAR
        // =================================
        if (users.length > 0) {
            user = users[0];

            // Update data profile terbaru dari Google
            await db.promise().query(
                `UPDATE users
                 SET name = ?, profile_picture = ?
                 WHERE google_id = ?`,
                [name, profilePicture, googleId]
            );

            user.name = name;
            user.profile_picture = profilePicture;
        }

        // =================================
        // USER GOOGLE BELUM TERDAFTAR
        // =================================
        else {
            const [existingEmail] = await db.promise().query(
                "SELECT * FROM users WHERE email = ?",
                [email]
            );

            // Email sudah digunakan akun local
            if (existingEmail.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Email ini sudah terdaftar menggunakan login biasa. Silakan login menggunakan email dan password."
                });
            }

            // Buat user Google baru
            const [result] = await db.promise().query(
                `INSERT INTO users
                (name, email, google_id, profile_picture, provider)
                VALUES (?, ?, ?, ?, 'google')`,
                [name, email, googleId, profilePicture]
            );

            user = {
                id: result.insertId,
                name,
                email,
                google_id: googleId,
                profile_picture: profilePicture,
                provider: "google"
            };
        }

        // =================================
        // BUAT JWT APLIKASI KITA
        // =================================
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        res.status(200).json({
            success: true,
            message: "Login dengan Google berhasil.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profile_picture: user.profile_picture,
                provider: "google"
            }
        });

    } catch (error) {
        console.error("Google Login error:", error);

        res.status(401).json({
            success: false,
            message: "Token Google tidak valid."
        });
    }
};

// ==========================
// GET CURRENT USER
// ==========================
const me = async (req, res) => {
    try {
        const [users] = await db.promise().query(
            `SELECT id, name, email, google_id, profile_picture, provider, created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan."
            });
        }

        res.status(200).json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error("Get user error:", error);

        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server."
        });
    }
};

// ==========================
// EXPORT
// ==========================
module.exports = {
    register,
    login,
    googleLogin,
    me
};