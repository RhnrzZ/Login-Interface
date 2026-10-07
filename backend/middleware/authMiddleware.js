const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        // Ambil Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Token tidak ditemukan."
            });
        }

        // Format harus: Bearer TOKEN
        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                success: false,
                message: "Format token tidak valid."
            });
        }

        const token = parts[1];

        // Verifikasi token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Simpan data token ke request
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token tidak valid atau sudah expired."
        });
    }
};

module.exports = authMiddleware;