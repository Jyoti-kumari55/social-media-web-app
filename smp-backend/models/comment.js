const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SocialUser',
        required: true,
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SocialPost',
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
    
}, { timestamps: true});

const Comment = mongoose.model('SocialComment', commentSchema);
module.exports = Comment;