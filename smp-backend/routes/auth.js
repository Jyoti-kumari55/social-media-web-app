const User = require("../models/user");
const bycrypt = require("bcryptjs");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const isAuthenticated = require("../config/authorize");

router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use." });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use." });
    }
    const salt = await bycrypt.genSalt(10);
    const hashedPassword = await bycrypt.hash(password, salt);

    const newUser = new User({
      name: name,
      username: username,
      email: email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    res
      .status(201)
      .json({ message: "Account created successfully", user: savedUser });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to add User.", details: error.message });
  }
});

router.post("/login",  async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const validPassword = await bycrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(401)
        .json({ error: "Please enter your valid Password." });
    }
    // Successful Login

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.TOKEN_SECRET,
      { expiresIn: "8h" }
    );
    res.cookie("token", token, {
      expiresIn: "8h",
      httpOnly: true,
      secure: false,
      // secure: process.env.NODE_ENV === "production",  
      // sameSite: "None",
    });

    return res
      .status(200)
      .json({ message: `Welcome back ${user.name}!`, details: user, token });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Failed to find this user.", details: error.message });
  }
});

router.get("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      
    });
    res.status(200).json({ message: `You are successfully logged out.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occured while loging out." });
  }
});

// Validate Email Route
router.get("/validate-email", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Email not found." });
    }

    return res.status(200).json({ exists: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error.", details: error.message });
  }
});

// Password Update Route (For Forgot Password)
router.put("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Email not found." });
    }

    if (newPassword && newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    const salt = await bycrypt.genSalt(10);
    user.password = await bycrypt.hash(newPassword, salt);

    const updatedUser = await user.save();
    return res.status(200).json({ message: "Password updated successfully.", user: updatedUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
});


module.exports = router;
