
const mysql = require("mysql2");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "login_system",
    port: Number(process.env.DB_PORT || 3306),

    ...(isProduction
        ? {
            ssl: {
                ca: process.env.DB_SSL_CA?.replace(/\\n/g, "\n"),
                rejectUnauthorized: true
            }
        }
        : {}),

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database gagal terhubung:", err.message);
        return;
    }

    console.log("✅ Database MySQL berhasil terhubung!");
    connection.release();
});

module.exports = db;
