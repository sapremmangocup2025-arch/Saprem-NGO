const express = require("express");
const cors = require("cors");
const connect = require("./src/config/db");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "https://sapremcompetition.vercel.app",
  "http://localhost:8080"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.options("*", cors());

app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/application", require("./src/routes/application"));
app.use("/api/admin", require("./src/routes/admin"));
app.use("/api/village", require("./src/routes/village"));
app.use("/api/competition", require("./src/routes/competition"));
app.use("/api/category", require("./src/routes/category"));
app.use("/api/report", require("./src/routes/report"));
app.use("/api/admin", require("./src/routes/adminVillage"));

connect().then(() => {
  app.listen(process.env.PORT, () =>
    console.log("Server running on port", process.env.PORT)
  );
});
