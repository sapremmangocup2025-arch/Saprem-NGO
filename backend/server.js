const express = require("express");
const cors = require("cors");
const connect = require("./src/config/db");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Allowed frontend origins
app.use(cors({
  origin: "https://competitions.sapremngo.in",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Routes
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/application", require("./src/routes/application"));
app.use("/api/admin", require("./src/routes/admin"));
app.use("/api/village", require("./src/routes/village"));
app.use("/api/competition", require("./src/routes/competition"));
app.use("/api/category", require("./src/routes/category"));
app.use("/api/report", require("./src/routes/report"));
app.use("/api/admin", require("./src/routes/adminVillage"));

// DB + Server
connect().then(() => {
  app.listen(process.env.PORT, () =>
    console.log("Server running on port", process.env.PORT)
  );
});
