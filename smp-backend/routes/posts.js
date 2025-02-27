const router = require("express").Router();
const isAuthenticated = require("../config/authorize");
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require('../models/comment');

// Create Post
router.post("/create", isAuthenticated, async (req, res) => {
  try {
    const loggedInUser = req.user;
    
    if(!loggedInUser) {
      return res.status(404).json({ error: "User is not authorized."});
    }
  
    let commentsCount = 0;
    if(req.body.postId) {
      commentsCount =   await Post.find({postId: req.body.postId});
      commentsCount = commentsCount.length+ 1;
      await Post.findByIdAndUpdate(req.body.postId , {commentCount: commentsCount} )
    }

    const newPost = new Post({ ...req.body, user: loggedInUser });

    const savedPost = await newPost.save();
    res
      .status(200)
      .json({ message: "Post created Successfully.", post: savedPost });
    
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to create post.", error: error.message });
  }
});

// Get all posts
router.get("/allPosts", isAuthenticated, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user);
    
    // console.log(req.user)
    // console.log(currentUser);

    const [allPosts, currentUserPosts] = await Promise.all([
      Post.find({postId: {$exists: false}}).populate("userId", "-password"),
      Post.find({ userId: currentUser._id, postId: {$exists: false} }).populate("userId", "-password"),
    ]);

    // console.log("allPosts", allPosts);
    // console.log(" currentUser", currentUserPosts);

    const followingUserPosts = allPosts.filter(
      (post) =>
        post.userId &&
        currentUser.followings &&
        currentUser.followings.includes(post.userId._id)
        
    );
     //console.log(followingUserPosts);

    //Combine all user post(current user and all following users)
    //let allFeedPosts = [...currentUserPosts, ...followingUserPosts];

    // If i want all post (current user, following users and other user ):
    let allFeedPosts = [...currentUserPosts, ...followingUserPosts, ];

    return res.status(200).json(allFeedPosts);
  } catch (error) {
    console.error("Error fetching all feed posts:", error);
    res
      .status(500)
      .json({ error: "Internal server error.", error: error.message });
  }
});

// Get all followings user posts
router.get("/followingPosts", isAuthenticated, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user);

    // Fetch all posts of users the current user is following
    const [allPosts, followingUserPosts] = await Promise.all([
      Post.find({postId: {$exists: false}}).populate("userId", "-password"),
      Post.find({ userId: { $in: currentUser.followings }, postId: {$exists: false} }).populate("userId", "-password"),
    ]);
    
     // Filter posts that belong to the users the current user is following
     const filteredFollowingPosts = allPosts.filter(
      (post) =>
        post.userId &&
        currentUser.followings &&
        currentUser.followings.includes(post.userId._id)
    );
    let allFollowingPosts = [...filteredFollowingPosts];
    return res.status(200).json(allFollowingPosts);
  } catch (error) {
    console.error("Error fetching following users' posts:", error);
    res
      .status(500)
      .json({ error: "Internal server error.", error: error.message });
  
  }
})
// Get a post by id and get all comment
router.get("/:postId", isAuthenticated, async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId)
       .populate("userId", "-email -password")
       .populate({
        path: "comments",  // Populate the 'comments' array
        populate: {
          path: "userId",  // Populate the userId field within each comment
          select: "-email -password"  // Exclude sensitive fields from the comment's user
        }
      });

      const comments =   await Post.find({postId}).populate("userId", "-password");

    
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }
    res.status(200).json({ message: "Post found.", post: post , user: post.user , comments: comments});
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

//Update a Post
router.put("/edit/:postId", isAuthenticated, async (req, res) => {
  const { postId } = req.params;
  const loggedInUser = req.user;
  const updatedData = req.body;
  try {
    // const updatedPost = await Post.findByIdAndUpdate(postId, updatedData, {
    //   new: true,
    // });
    const updatedPost = await Post.findById(postId);

    if(!updatedPost) {
      return res.status(404).json({ error: "Post not found." });
    }

    //checking whether the logged in user is owner of the post ot not...
    if(updatedPost.userId.toString() !== loggedInUser.toString()) {
      return res.status(403).json({ error: "You are not authorized to update this post." });
    }
    const updatedPostData = await Post.findByIdAndUpdate(postId, updatedData, { new: true,});
    res
        .status(200)
        .json({ message: "Post has been updated. ", post: updatedPostData });

    // if (updatedPost) {
    //   res
    //     .status(200)
    //     .json({ message: "Post has been updated. ", post: updatedPost });
    // } else {
    //   res.status(404).json({ error: "Post not found." });
    // }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to update the post.", error: error.message });
  }
});

//Delete Post
router.delete("/:postId", isAuthenticated, async (req, res) => {
  const { postId } = req.params;
    const loggedInUser = req.user;
    //console.log("LoggedInuser: ", loggedInUser);
  try {
    let commentsCount = 0;
  
    const deletedPost = await Post.findById(postId);
    if(deletedPost.postId) {
      commentsCount =   await Post.find({postId: deletedPost.postId});
      commentsCount =  commentsCount.length - 1
      await Post.findByIdAndUpdate(deletedPost.postId , {commentCount: commentsCount} )
    }
   // console.log("Deleted Post: ", deletedPost);
    if (!deletedPost) {
      return res.status(404).json({ error: "Post not found." });
    }
    if(deletedPost.userId.toString() !== loggedInUser.toString()) {
      return res.status(403).json({ error: "You are not authorized to delete this post." });
    }

    await Post.findByIdAndDelete(postId);
    await Post.deleteMany({postId: postId});

    res.status(200).json({ message: "Post deleted successfully." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to delete the post.", error: error.message });
  }
});

//like or dislike a post
router.post("/like/:postId", isAuthenticated, async (req, res) => {
  try {
   // console.log("Post id: ", req.params);
    const loggedUserId = req.body.userId;
    const loggedInUser = await User.findById(req.body.userId);
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (post.likes.includes(loggedUserId)) {
      await Post.findByIdAndUpdate(postId, { $pull: { likes: loggedUserId } });
      res.status(200).json({ message: `${loggedInUser.name} disliked your post.` });
    } else {
      await Post.findByIdAndUpdate(postId, { $push: { likes: loggedUserId } });
      res.status(200).json({ message: `${loggedInUser.name} liked your post.` });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

module.exports = router;
