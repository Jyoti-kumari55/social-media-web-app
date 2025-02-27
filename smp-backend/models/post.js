const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialUser",
      required: true,
    },
    desc: {
      type: String,
      // required: true,
    },
    img: {
      type: String,
    },
    likes: {
      type: Array,
      default: [],
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
    }, 
    commentCount: {
      type: Number
    }, 
    comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialComment",
      required: true,
    }],
    share: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("SocialPost", postSchema);
module.exports = Post;
