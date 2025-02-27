const router = require("express").Router();
const bycrypt = require("bcryptjs");
const Post = require("../models/post");
const User = require("../models/user");
const isAuthenticated = require("../config/authorize");
const cloudinary = require("cloudinary");

// Update a user
router.put("/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUser = req.user;
    // console.log(req.user);
    let { currentPassword, newPassword } = req.body;

    if (userId !== loggedInUser) {
      return res
        .status(403)
        .json({ error: "You can only update your own profile." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bycrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ error: "Current password is incorrect." });
      }
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "New password must be at least 6 characters long." });
      }

      const salt = await bycrypt.genSalt(10);
      user.password = await bycrypt.hash(newPassword, salt);
    }

    Object.keys(req.body).forEach((key) => {
      if (key !== "userId" && key !== "currentPassword" && key !== "newPassword") {
        user[key] = req.body[key];
      }
    });

    // if (req.body.password) {
    //   const salt = await bycrypt.genSalt(16);
    //   user.password = await bycrypt.hash(req.body.password, salt);
    // }

    const updatedUser = await user.save();
    res
      .status(200)
      .json({ message: "Account updated successfully.", user: updatedUser });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

// update user with password and images(cover and profile)
// router.put("/:userId", isAuthenticated, async (req, res) => {
//   try {
//     const { userId } = req.params;
//     let { profilePicture, coverPicture, currentPassword, newPassword } = req.body;

//     const loggedInUser = req.user;
//     console.log(req.user);

//     // Check if the logged-in user is trying to update their own profile
//     if (userId !== loggedInUser.toString()) {
//       return res.status(403).json({ error: "You can only update your own profile." });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found." });
//     }

//     // Password update validation
//     if (currentPassword && newPassword) {
//       const isMatch = await bcrypt.compare(currentPassword, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ error: "Current password is incorrect." });
//       }
//       if (newPassword.length < 6) {
//         return res.status(400).json({ error: "New password must be at least 6 characters long." });
//       }

//       const salt = await bycrypt.genSalt(10);
//       user.password = await bycrypt.hash(newPassword, salt);
//     }

//     // Handle profile picture update
//     if (profilePicture) {
//       if (user.profilePicture) {
//         // Assuming Cloudinary is being used to handle image uploads
//         await cloudinary.uploader.destroy(user.profilePicture.split("/").pop().split(".")[0]);
//       }
//       const uploadedResponse = await cloudinary.uploader.upload(profilePicture);
//       user.profilePicture = uploadedResponse.secure_url;
//     }

//     // Handle cover picture update
//     if (coverPicture) {
//       if (user.coverPicture) {
//         await cloudinary.uploader.destroy(user.coverPicture.split("/").pop().split(".")[0]);
//       }
//       const uploadedResponse = await cloudinary.uploader.upload(coverPicture);
//       user.coverPicture = uploadedResponse.secure_url;
//     }

//     // Update other fields from req.body (excluding userId and password)
//     Object.keys(req.body).forEach((key) => {
//       if (key !== "userId" && key !== "currentPassword" && key !== "newPassword") {
//         user[key] = req.body[key];
//       }
//     });

//     const updatedUser = await user.save();
//     res.status(200).json({ message: "Account updated successfully.", user: updatedUser });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal server error.", error: error.message });
//   }
// });

// Delete a user
router.delete("/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: " User ID is required" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: " User not found." });
    }
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

// User Bookmark
router.put("/bookmark/:postId", isAuthenticated, async (req, res) => {
  try {
    const loggedUserId = req.body.userId;
    const { postId } = req.params;
    // console.log("User", user, "PostId", postId);
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const user = await User.findById(loggedUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isBookmarked = user.bookmarks.includes(postId);

    if (isBookmarked) {
      await User.findByIdAndUpdate(loggedUserId, {
        $pull: { bookmarks: postId },
      });
      return res.status(200).json({ message: "User removed bookmarked post." });
    } else {
      await User.findByIdAndUpdate(loggedUserId, {
        $push: { bookmarks: postId },
      });
      return res.status(200).json({ message: "User bookmarked your post." });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

// Get all bookmarked post
router.get("/bookmark", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user)
      .populate({
        path: "bookmarks",
        model: "SocialPost",
        populate: {
          path: "userId",
          select: "-email -password",
          //select: "name username profilePicture"
        },
      })
      .select("name username profilePicture");

    //  console.log("Populated User Bookmarks:", user.bookmarks);

    // Check if the user has bookmarks
    if (!user.bookmarks || user.bookmarks.length === 0) {
      return res.status(404).json({ message: "No bookmarked posts found." });
    }

    // If user doesn't exist
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const bookmarkUserDeatils = user.bookmarks.map((post) => ({
      post,
      owner: post.userId,
      // isBookmarked: true
    }));
    // Send the bookmarks data, including post details and author details
    res.status(200).json({
      message: "Bookmarked posts fetched successfully.",
      bookmarks: bookmarkUserDeatils,
      // bookmarks: user.bookmarks.map(post => ({
      //   post: post, // The post details
      //   author: post.userId // The author details (user who posted)
      // }))
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

// Remove a bookmarked post
router.post("/removeBookmark/:postId", async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    user.bookmarks = user.bookmarks.filter(
      (markedPost) => markedPost.toString() !== postId
    );
    await user.save();
    res.status(200).json({ message: "Post removed from bookmarks." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

// Get all bookmarked post

// router.get("/bookmark", isAuthenticated, async (req, res) => {
//   try {
//     const user = await User.findById(req.user)
//       .populate("bookmarks")
//       .select("name username profilePicture");

//     if (!user.bookmarks || user.bookmarks.length === 0) {
//       return res.status(404).json({ message: "No bookmarked posts found." });
//     }
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.status(200).json({
//       message: "Bookmarked posts fetched successfully.",
//       bookmarks: user.bookmarks,
//     });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Internal server error.", error: error.message });
//   }
// });

//Get all Users
router.get("/allUsers", isAuthenticated, async (req, res) => {
  try {
    const users = await User.find({});

    const enteredUsers = users.map((user) => {
      return {
        username: user.username,
        email: user.email,
        _id: user._id,
        createdAt: user.createdAt,
      };
    });
    return res.status(200).json({ Users: enteredUsers });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

//Get a Profile
router.get("/profile/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    // console.log(userId)
    const user = await User.findById(userId).select(
      "-password -bookmarks -email"
    );
    if (!user) {
      return res.status(400).json({ message: "No user found with this ID." });
    }
    const allPosts = await Post.find({ userId: userId })
      .sort({ createdAt: -1 })
      .populate("userId", "-password -email");
    return res
      .status(200)
      .json({ message: "User found", user: user, posts: allPosts });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

// Other Users in the page
router.get("/otherusers/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const otherUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password -bookmarks -email"
    );
    if (!otherUsers) {
      res.status(404).json({ message: "No user in the data." });
    }
    res.status(200).json({ Users: otherUsers });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

// Get your friends
router.get("/friends", isAuthenticated, async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.user);
    // console.log("logged in : ", loggedInUser);
    // console.log(loggedInUser.followings);

    // const userFriends = await Promise.all(
    //   loggedInUser.followers.map((dost) => {
    //     return User.findById(dost).select("-password -bookmarks -email");
    //   })
    // );

    // Get only the followers who are NOT in the followings list
    const userFriends = await Promise.all(
      loggedInUser.followers
        .filter((followerId) => !loggedInUser.followings.includes(followerId)) // Filter followers not in followings
        .map((dost) => {
          return User.findById(dost).select("-password -bookmarks -email");
        })
    );
    // console.log(userFriends);

    return res.status(200).json({ Friends: userFriends });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

//Suggested Users
// router.get("/suggestedUsers", isAuthenticated, async (req, res) => {
//   try {
//     const loggedInUser = await User.findById(req.user);
//     const users = await User.find({}).select("-password -bookmarks -email");
//     let suggestedUsers = users.filter((user) => {
//       return (
//         !loggedInUser.followings.includes(user._id) &&
//         user._id.toString() !== loggedInUser._id.toString()
//       );
//     });

//     if (suggestedUsers.length > 10) {
//       suggestedUsers = suggestedUsers.slice(0, 8);
//     }
//     return res.status(200).json({ Users: suggestedUsers });
//   } catch (error) {
//     console.log(error);
//     res
//       .status(500)
//       .json({ message: "Internal server error.", error: error.message });
//   }
// });


router.get("/suggestedUsers", isAuthenticated, async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.user);
    const users = await User.find({}).select("-password -bookmarks -email");

    let suggestedUsers = users.filter((user) => {
      // Chacking if user is not the logged in user
      const isNotLoggedInUser =
        user._id.toString() !== loggedInUser._id.toString();

      // checking user not following itself
      const isNotFollowing = !loggedInUser.followings.includes(user._id);

      // Ensure the user is either following the logged-in user or a new user (no followers)
      const isNotFollower = !user.followers.includes(loggedInUser._id);
      const isNewUser = user.followers.length === 0 || user.followings.length === 0; // Assuming a user with no followers is new

      const isNotFollowingLoggedInUser = !user.followings.includes(
        loggedInUser._id
      );

      return (
        isNotLoggedInUser &&
        (isNotFollowing ||
          isNotFollower ||
          isNewUser ||
          isNotFollowingLoggedInUser)
      );
    });

    // if (suggestedUsers.length >= 10) {
    //   suggestedUsers = suggestedUsers.slice(0, 7);
    // }

    return res.status(200).json({ Users: suggestedUsers });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

// Follow User
router.post("/follow/:followUserId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.body;
    const followUserId = req.params.followUserId;
    const loggedInUser = await User.findById(userId);
    const user = await User.findById(followUserId);

    if (!loggedInUser || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!loggedInUser.followings.includes(followUserId)) {
      await user.updateOne({ $push: { followers: userId } });
      await loggedInUser.updateOne({ $push: { followings: followUserId } });
      return res.status(200).json({
        message: `${loggedInUser.name} started following ${user.name}.`,
      });
    } else {
      return res
        .status(400)
        .json({ message: `User already followed to ${user.name}` });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

//Unfollow the user
router.post("/unfollow/:followUserId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("LoggedInUserId: ", userId);
    const followUserId = req.params.followUserId;
    console.log("Follow User Id: ", followUserId);

    const loggedInUser = await User.findById(userId);
    const user = await User.findById(followUserId);

    if (!loggedInUser || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("tttttt: ", loggedInUser.followings);

    if (loggedInUser.followings.includes(followUserId)) {
      await user.updateOne({ $pull: { followers: userId } });
      await loggedInUser.updateOne({ $pull: { followings: followUserId } });

      return res
        .status(200)
        .json({ message: `${loggedInUser.name} unfollowed ${user.name}.` });
    } else {
      return res
        .status(400)
        .json({ message: `You are not following ${user.name}.` });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

// Toggle Follow
router.put("/toggleFollow/:followUserId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.body;
    const followUserId = req.params.followUserId;

    const loggedInUser = await User.findById(userId);
    const user = await User.findById(followUserId);

    if (!loggedInUser || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is already following
    if (loggedInUser.followings.includes(followUserId)) {
      // Unfollow
      await user.updateOne({ $pull: { followers: userId } });
      await loggedInUser.updateOne({ $pull: { followings: followUserId } });
      return res
        .status(200)
        .json({ message: `${loggedInUser.name} Unfollowed ${user.name}` });
    } else {
      // Follow
      await user.updateOne({ $push: { followers: userId } });
      await loggedInUser.updateOne({ $push: { followings: followUserId } });
      return res
        .status(200)
        .json({ message: `${loggedInUser.name} Followed ${user.name}` });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

// get all followers and followings
router.get("/userList/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user with the provided userId and exclude sensitive fields
    const user = await User.findById(userId)
      .select("-password -bookmarks -email")
      .populate("followers", "-password -bookmarks -email") // Populate followers
      .populate("followings", "-password -bookmarks -email"); // Populate followings

    if (!user) {
      return res.status(400).json({ message: "No user found with this ID." });
    }

    // Fetch all posts made by the user
    const allPosts = await Post.find({ userId: userId })
      .sort({ createdAt: -1 })
      .populate("userId", "-password -email");

    const populatedFollowers = await User.find({
      _id: { $in: user.followers },
    }).select("-password -bookmarks -email");
    const populatedFollowings = await User.find({
      _id: { $in: user.followings },
    }).select("-password -bookmarks -email");

    return res.status(200).json({
      message: "User found",
      user: user,
      // posts: allPosts,
      // followers: user.followers, // Return populated followers
      // following: user.followings, // Return populated following
      followers: populatedFollowers,
      followings: populatedFollowings,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

module.exports = router;
