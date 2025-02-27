const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        max: 50
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        min: 6,       
    }, 
    profilePicture: {
        type: String,
        default: ""
    },
    coverPicture: {
        type: String,
        default: "",
    },
    followers: {
        type: Array,
        default: [],
    },
    followings: {
        type: Array,
        default: [],
    },
    bio: {
        type: String,
    },
    bookmarks: {
        type: Array,
        default: []
    },
     
}, {timestamps: true});

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

const User = mongoose.model('SocialUser', userSchema);
module.exports = User;