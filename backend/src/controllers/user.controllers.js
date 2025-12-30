import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/user.models.js";
import { Issue } from "../models/issueRaise.models.js";

// Generate Tokens
const generateAccessAndRefereshTokens = async (userId) => {
  const user = await User.findById(userId);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { fullName, email, username, password, department, phoneNumber } = req.body;

    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      username: username.toLowerCase(),
      department,
      phoneNumber,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: createdUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: "Username or email is required" });
    }

    // Check by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User does not exist" });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: loggedInUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOGOUT USER
const logoutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { refreshToken: 1 },
    });

    res.status(200).json({ success: true, message: "User logged out" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// REFRESH ACCESS TOKEN
const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user || incomingRefreshToken !== user.refreshToken) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    res.status(200).json({
      success: true,
      message: "Token refreshed",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CHANGE PASSWORD
const changeCurrentPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isMatch = await user.isPasswordCorrect(oldPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid old password" });
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET CURRENT USER
const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE ACCOUNT DETAILS
const updateAccountDetails = async (req, res) => {
  try {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, email },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Account updated",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ISSUES BY DEPARTMENT
const getdepartment = async (req, res) => {
  try {
    const dep = req.user.department;
    const issues = await Issue.find({ requireDepartment: dep }).populate('requireDepartment');

    res.status(200).json({
      success: true,
      issues,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//admin controllers
const admintCreateuser = async (req,res)=>{
        const { fullName, email, username, password, department, phoneNumber, isAdmin } = req.body;

    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    
    if (existedUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }
    console.log("Hi");
    
    const user = await User.create({
      fullName,
      email,
      password, // Let the model handle hashing via pre-save hook
      username: username.toLowerCase(),
      department,
      phoneNumber,
      isAdmin: isAdmin || false
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user: createdUser },
    });     
}

//admin : get all users
const getAllusers = async (req,res)=>{
    try {
        const users = await User.find({}).select("-password -refreshToken");
        
        // Map fields to match frontend expectations in UserManagement.jsx
        const formattedUsers = users.map(user => ({
            id: user._id,
            full_name: user.fullName,
            email: user.email,
            phone_number: user.phoneNumber,
            department_id: user.department,
            is_admin: user.isAdmin,
            // department_name should ideally be populated from a Department join
        }));

        res.status(200).json({
            success: true,
            data: { users: formattedUsers },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

//admin : update user
const adminUpdateuser = async (req,res)=>{
    const { userId } = req.params;
    const { fullName, email, department, phoneNumber, isAdmin } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { fullName, email, department, phoneNumber, isAdmin },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "User updated",
      data: { user },
    });
}   

//admin : delete user
const adminDeleteuser = async (req,res)=>{
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }


    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User deleted",
    });
}


//admin : reset user password
const adminResetuserPassword = async (req,res)=>{
    const { userId } = req.params;
    const { newPassword } = req.body;

    if ( !userId || !newPassword) {
      return res.status(400).json({ success: false, message: "New password is required" });
    }       

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = newPassword; // Let pre-save hook handle hashing
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
}




export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getdepartment,
  admintCreateuser,
  getAllusers,
  adminUpdateuser,
  adminDeleteuser,
  adminResetuserPassword
};
