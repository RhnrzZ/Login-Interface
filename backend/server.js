const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/database");

const authRoutes = require("./routes/authRoutes");

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.post("/test-google", (req, res) => {
    res.json({
        success: true,
        message: "POST route Express berhasil!"
    });
});

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Backend Login System berhasil berjalan!"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});