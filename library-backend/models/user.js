const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
  },
  favouriteGenre: {
    type: String,
    minLength: 2,
    required: true,
  },
});

module.exports = mongoose.model("User", schema);
