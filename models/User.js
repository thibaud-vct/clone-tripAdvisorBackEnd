const mongoose = require("mongoose");

const User = mongoose.model("User", {
    email: {
        unique: true,
        type: String,
    },
    favorite: Object,
    token: String,
    hash: String,
    salt: String,
});

module.exports = User;
