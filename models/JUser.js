const mongoose = require("mongoose");

const juserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const JUser = mongoose.model("JUser", juserSchema);
module.exports = JUser;
