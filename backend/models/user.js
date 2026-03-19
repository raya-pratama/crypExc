const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  balance: {
    idr: { type: Number, default: 1000000 },
    btc: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model("User", userSchema);