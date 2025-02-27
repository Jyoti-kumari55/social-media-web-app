const router = require("express").Router();
const isAuthenticated = require("../config/authorize");
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

// create a comment
// router.post("/create/:postId", isAuthenticated, async (req, res) => {
//   try {
//     const loggedInUser = req.user;
//     const { comment } = req.body;
//     const { postId } = req.params;
//     if (!loggedInUser) {
//       return res.status(401).json({ message: " User is not authorized." });
//     }
//     if (!comment) {
//       return res.status(400).json({ message: " Comment content is required." });
//     }
//     const newComment = new Comment({
//       userId: loggedInUser,
//       postId,
//       comment,
//     });
//     const savedComment = await newComment.save();

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found." });
//     }
//     post.comments.push(savedComment);
//     await post.save();

//     await post.populate({
//       path: "comments",
//       populate: {
//         path: "userId",
//         select: "-email -password",
//       },
//     });

//     return res.status(200).json({
//       message: "Comment posted successfully",
//       post: post,
//       //  comment: savedComment
//     });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Failed to create comment.", error: error.message });
//   }
// });

// get all comments on a post by a user
// router.get("/:postId/allComments", async (req, res) => {
//   const { postId } = req.params;

//   try {
//     // Find the post by ID
//     const post = await Post.findById(postId).populate("comments");

//     if (!post) {
//       return res.status(400).json({ message: "Post not found." });
//     }

//     // Get all comments related to the post
//     const comments = post.comments;
//     return res
//       .status(200)
//       .json({ message: "Comments retrieved successfully.", comments });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Failed to get comments.", error: error.message });
//   }
// });

// delete a comment
// router.delete("/:commentId", isAuthenticated, async (req, res) => {
//   const loggedInUser = req.user;
//   const { commentId } = req.params;

//   try {
//     const deletedComment = await Comment.findById(commentId);
//     if (!deletedComment) {
//       return res.status(400).json({ message: "Comment not found." });
//     }
//     if (deletedComment.userId.toString() === loggedInUser.toString()) {
//       const post = await Post.findById(deletedComment.postId);
//       if (post) {
//         post.comments = post.comments.filter((c) => c.toString() !== commentId);
//         await post.save();
//       }

//       // Delete the comment from the database
//       await Comment.findByIdAndDelete(commentId);
//       return res
//         .status(200)
//         .json({ message: "Comment has been successfully deleted." });
//     } else {
//       return res
//         .status(403)
//         .json({ message: "You can delete only your own comments" });
//     }
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Failed to delete a comment.", error: error.message });
//   }
// });

//update a comment
// router.put("/:commentId", isAuthenticated, async (req, res) => {
//   const loggedInUser = req.user;
//   const { commentId } = req.params;
//   const { comment } = req.body;

//   try {
//     // Find the comment by ID
//     const commentToUpdate = await Comment.findById(commentId);

//     if (!commentToUpdate) {
//       return res.status(400).json({ message: "Comment not found." });
//     }

//     // Check if the logged-in user is the owner of the comment
//     if (commentToUpdate.userId.toString() === loggedInUser.toString()) {
//       // Update the comment content
//       commentToUpdate.comment = comment || commentToUpdate.comment;

//       // Save the updated comment
//       await commentToUpdate.save();
//       return res
//         .status(200)
//         .json({
//           message: "Comment has been successfully updated.",
//           comment: commentToUpdate,
//         });
//     } else {
//       return res
//         .status(403)
//         .json({ message: "You can only update your own comments." });
//     }
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Failed to update the comment.", error: error.message });
//   }
// });

//User comment bookmark
// router.put("/bookmark/:commentId", isAuthenticated, async (req, res) => {
//   try {
//     const loggedUserId = req.body.userId;
//     const { commentId } = req.params;

//     // Find the comment
//     const comment = await Comment.findById(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: "Comment not found" });
//     }

//     // Find the user
//     const user = await User.findById(loggedUserId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Check if the comment is already bookmarked
//     const isBookmarked = user.commentBookmarks.includes(commentId);

//     // If already bookmarked, remove it from bookmarks
//     if (isBookmarked) {
//       await User.findByIdAndUpdate(loggedUserId, {
//         $pull: { commentBookmarks: commentId },
//       });
//       return res
//         .status(200)
//         .json({ message: "Comment removed from bookmarks" });
//     } else {
//       // If not bookmarked, add it to bookmarks
//       await User.findByIdAndUpdate(loggedUserId, {
//         $push: { commentBookmarks: commentId },
//       });
//       return res
//         .status(200)
//         .json({ message: "Comment bookmarked successfully" });
//     }
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Internal server error.", error: error.message });
//   }
// });

//Get all bookmarked comments
// router.get("/bookmark/comments", isAuthenticated, async (req, res) => {
//   try {
//     // Find the user and populate the bookmarked comments
//     const user = await User.findById(req.user)
//       .populate({
//         path: "commentBookmarks",
//         model: "SocialComment",
//         populate: {
//           path: "userId", // Populate the user of the comment
//           select: "-email -password", // Optionally exclude sensitive info
//         },
//       })
//       .select("name username profilePicture");

//     // Check if the user has any bookmarked comments
//     if (!user.commentBookmarks || user.commentBookmarks.length === 0) {
//       return res.status(404).json({ message: "No bookmarked comments found." });
//     }

//     // Send the response with the bookmarked comments
//     res.status(200).json({
//       message: "Bookmarked comments fetched successfully.",
//       bookmarks: user.commentBookmarks,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error.", error: error.message });
//   }
// });

//remove a bookmarked comment
// router.post('/removeBookmark/:commentId', isAuthenticated,  async (req, res) => {
//   const { commentId } = req.params;
//   const { userId } = req.body;

//   try {
//     // Find the user and remove the comment from bookmarks
//     const user = await User.findById(userId);
//     user.commentBookmarks = user.commentBookmarks.filter(
//       (bookmarkedComment) => bookmarkedComment.toString() !== commentId
//     );
//     await user.save();

//     res.status(200).json({ message: "Comment removed from bookmarks." });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error.", error: error.message });
//   }
// });

// Toggle like/dislike for a comment

// router.put("/like/:commentId", isAuthenticated, async (req, res) => {
//   const loggedInUser = req.user;
//   console.log("user:::", loggedInUser)

//   const { commentId } = req.params;
//  // console.log("id:::", commentId)

//   try {
//       // Find the comment by ID
//       const comment = await Comment.findById(commentId);
//      // console.log("comm::", comment)

//       if (!comment) {
//           return res.status(404).json({ message: "Comment not found." });
//       }

//       // Check if the user already liked the comment
//       const userHasLiked = comment.likedBy.includes(loggedInUser._id);

//       if (userHasLiked) {
//           // If already liked, dislike the comment (remove from likedBy)
//           comment.likedBy = comment.likedBy.filter(userId => userId.toString() !== loggedInUser);
//           await comment.save();

//           // Also remove the user from the post's commentLikes array
//           const post = await Post.findById(comment.postId);
//           if (post) {
//               post.commentLikes = post.commentLikes.filter(userId => userId.toString() !== loggedInUser);
//               await post.save();
//           }

//           return res.status(200).json({ message: "Comment disliked." });
//       } else {
//           // If not liked yet, like the comment (add to likedBy)
//           comment.likedBy.push(loggedInUser._id);
//           await comment.save();

//           // Add the user to the post's commentLikes array
//           const post = await Post.findById(comment.postId);
//           if (post) {
//               post.commentLikes.push(loggedInUser._id);
//               await post.save();
//           }

//           return res.status(200).json({ message: `Comment liked by ${loggedInUser.name}` });
//       }
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "Failed to toggle like/dislike on comment.", error: error.message });
//   }
// });

// Like or dislike a comment on a post
// router.post("/like/:commentId", isAuthenticated, async (req, res) => {
//   try {
//     const loggedUserId = req.body.userId;

//     const loggedInUser = await User.findById(loggedUserId); // Fetch user
//     const { commentId } = req.params;

//     // Find the comment
//     const comment = await Comment.findById(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: "Comment not found." });
//     }

//       // Ensure likedBy is always an array
//     //   if (!Array.isArray(comment.likedBy)) {
//     //   comment.likedBy = [];
//     // }
//     console.log("Comment likedBy before filter: ", comment.likedBy);

//     // Check if the user already liked the comment
//     const userHasLiked = comment.likedBy.includes(loggedUserId);

//     if (userHasLiked) {
//       // If the user already liked the comment, dislike it (remove the like)
//       comment.likedBy = comment.likedBy.filter(toggle => toggle.toString() !== loggedUserId);
//       await comment.save();

//       // Also remove the user from the post's commentLikes array
//       const post = await Post.findById(comment.postId);
//       if (post) {
//         post.commentLikes = post.commentLikes.filter(toggle => toggle.toString() !== loggedUserId);
//         await post.save();
//       }

//       return res.status(200).json({ message: `${loggedInUser.name} disliked the comment.` });
//     } else {
//       // If the user hasn't liked the comment yet, like it (add the like)
//       comment.likedBy.push(loggedUserId);
//       await comment.save();

//       // Add the user to the post's commentLikes array
//       const post = await Post.findById(comment.postId);
//       if (post) {
//         post.commentLikes.push(loggedUserId);
//         await post.save();
//       }

//       return res.status(200).json({ message: `${loggedInUser.name} liked the comment.` });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to toggle like/dislike on comment.", error: error.message });
//   }
// });



// router.post("/like/:commentId", isAuthenticated, async (req, res) => {
//   try {
//     const loggedUserId = req.body.userId;

//     const loggedInUser = await User.findById(loggedUserId); // Fetch user
//     const { commentId } = req.params;

//     // Find the comment
//     const comment = await Comment.findById(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: "Comment not found." });
//     }

//     // Check if the user already liked the comment
//     const userHasLiked = comment.likesComm.includes(loggedUserId);

//     // Find the post to update
//     const post = await Post.findById(comment.postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found." });
//     }

//     // Find the commentLikes entry in the post for the specific comment
//     let commentLikeEntry = post.commentLikes.find(entry => entry.commentId.toString() === commentId);

//     if (userHasLiked) {
//       // If the user already liked the comment, dislike it (remove the like)
//       comment.likesComm = comment.likesComm.filter(toggle => toggle.toString() !== loggedUserId);
//       await comment.save();

//       // Update the post's commentLikes to remove the user
//       if (commentLikeEntry) {
//         commentLikeEntry.likedBy = commentLikeEntry.likedBy.filter(toggle => toggle.toString() !== loggedUserId);
//         await post.save();
//       }

//       return res.status(200).json({ message: `${loggedInUser.name} disliked the comment.` });
//     } else {
//       // If the user hasn't liked the comment yet, like it (add the like)
//       comment.likesComm.push(loggedUserId);
//       await comment.save();

//       // Update the post's commentLikes to add the user
//       if (commentLikeEntry) {
//         commentLikeEntry.likedBy.push(loggedUserId);
//       } else {
//         // If the entry does not exist, create a new one
//         post.commentLikes.push({
//           commentId: commentId,
//           likedBy: [loggedUserId],
//         });
//       }
//       await post.save();

//       return res.status(200).json({ message: `${loggedInUser.name} liked the comment.` });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to toggle like/dislike on comment.", error: error.message });
//   }
// });

module.exports = router;
