const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
// middleware
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

// connect DB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// run server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});