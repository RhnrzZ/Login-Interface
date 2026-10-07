const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "login_system",
    port: 3306
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