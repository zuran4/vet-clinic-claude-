const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("../models/User");

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await User.create({ name: "Γιατρός", pin: "1234" });
  console.log("Χρήστης προστέθηκε");
  mongoose.disconnect();
});
