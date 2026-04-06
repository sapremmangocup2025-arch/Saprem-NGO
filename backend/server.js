const express = require("express");
const cors = require("cors");
const connect = require("./src/config/db");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Allowed frontend origins (production + local development)
app.use(cors({
  origin: ["https://competitions.sapremngo.in", "http://localhost:8080", "http://localhost:5173"],
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
app.use("/api/pride-survey", require("./src/routes/prideSurvey"));
app.use("/api/activity", require("./src/routes/activity"));
app.use("/api/admin/activity", require("./src/routes/adminActivity"));

// Staff Management Routes
app.use("/api/staff", require("./src/routes/staff"));
app.use("/api/attendance", require("./src/routes/attendance"));
app.use("/api/staff-tasks", require("./src/routes/staffTask"));
app.use("/api/daily-reports", require("./src/routes/dailyWorkReport"));
app.use("/api/daily-updates", require("./src/routes/dailyUpdate"));
app.use("/api/field-visits", require("./src/routes/fieldVisit"));
app.use("/api/village-meetings", require("./src/routes/villageMeeting"));
app.use("/api/staff-reports", require("./src/routes/staffReport"));

// PDF Generation Routes
app.use("/api/pdf", require("./src/routes/pdf"));

// Dashboard Routes
app.use("/api/dashboard", require("./src/routes/dashboard"));

// Upload Routes
app.use("/api/upload", require("./src/routes/upload"));



// DB + Server
connect().then(() => {
  app.listen(process.env.PORT, () =>
    console.log("Server running on port", process.env.PORT)
  );
});
