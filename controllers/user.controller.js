import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import path from 'path';

const generateAccessAndRefreshToken = async (userId) => {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
};

const registerUser = async (req, res) => {
    const { username, email, fullName, contact, age, password } = req.body;
    try {
        if ([username, email, fullName, contact, age, password].some((field) => field?.trim() === "")) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existedUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existedUser) {
            return res.status(409).json({ message: "User with email or username already exists" });
        }

        const avatarLocalPath = req.file?.path;
        if (!avatarLocalPath) {
            return res.status(400).json({ message: "Avatar file is required" });
        }

        const localAvatarUrl = path.relative("public", avatarLocalPath).replace(/\\/g, "/");

        const user = await User.create({
            username,
            email,
            fullName,
            avatar: "/" + localAvatarUrl,
            contact,
            age,
            password
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");
        if (!createdUser) {
            return res.status(500).json({ message: "Error while registering user" });
        }

        return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const loginUser = async (req, res) => {
    const { email, username, password } = req.body;
    try {
        if (!(username || email)) {
            return res.status(400).json({ message: "Username or email is required" });
        }

        const user = await User.findOne({ $or: [{ username }, { email }] });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordCorrect = await user.isPasswordCorrect(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: true
        };

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "User logged in successfully"));
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const logoutUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $set: { refreshToken: undefined }
        }, { new: true });

        const options = { httpOnly: true, secure: true };
        return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully"));
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const refreshAccessToken = async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        return res.status(401).json({ message: "Unauthorized request" });
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        if (incomingRefreshToken !== user.refreshToken) {
            return res.status(401).json({ message: "Refresh token expired or invalid" });
        }

        const options = { httpOnly: true, secure: true };
        const { accessToken, refreshToken: newrefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(new ApiResponse(200, {
                accessToken,
                refreshToken: newrefreshToken
            }, "Access token refreshed"));
    } catch (error) {
        console.error("Token Refresh Error:", error);
        return res.status(401).json({ message: error?.message || "Invalid refresh token" });
    }
};

const changeCurrentPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user?._id);

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid old password" });
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
    } catch (error) {
        console.error("Password Change Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getCurrentUser = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
};

const updateAccountDetails = async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const user = await User.findByIdAndUpdate(req.user?._id, {
            $set: { fullName, email }
        }, { new: true }).select("-password");

        return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
    } catch (error) {
        console.error("Update Details Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const updateUserAvatar = async (req, res) => {
    try {
        const avatarLocalPath = req.file?.path;
        if (!avatarLocalPath) {
            return res.status(400).json({ message: "Avatar is missing" });
        }

        const localAvatarUrl = path.relative("public", avatarLocalPath).replace(/\\/g, "/");

        const user = await User.findByIdAndUpdate(req.user?._id, {
            $set: { avatar: "/" + localAvatarUrl }
        }, { new: true }).select("-password");

        return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
    } catch (error) {
        console.error("Avatar Update Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar };
