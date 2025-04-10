import { Admin } from "../models/admin.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessAndRefreshToken = async (adminId) => {
    try {
        const admin = await Admin.findById(adminId);
        if (!admin) throw new ApiError(404, "Admin not found while generating tokens");

        const accessToken = await admin.generateAccessToken();
        const refreshToken = await admin.generateRefreshToken();

        admin.refreshToken = refreshToken;
        await admin.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, error.message || "Token generation failed");
    }
};

const registerAdmin = asyncHandler(async (req, res) => {
    const { officerName, email, policeStation, password, officersInStation = [] } = req.body;

    if (!officerName || !email || !policeStation || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingAdmin = await Admin.findOne({
        $or: [{ email }, { policeStation }]
    });

    if (existingAdmin) {
        throw new ApiError(409, "Admin with this email or police station already exists");
    }

    const newAdmin = await Admin.create({
        officerName,
        email,
        policeStation,
        password,
        officersInStation
    });

    const sanitizedAdmin = await Admin.findById(newAdmin._id).select("-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(201, sanitizedAdmin, "Admin registered successfully")
    );
});

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, policeStation, password } = req.body;

    if (!password || !(email || policeStation)) {
        throw new ApiError(400, "Email or Police Station and password are required");
    }

    const admin = await Admin.findOne({
        $or: [{ email }, { policeStation }]
    });

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    const isPasswordValid = await admin.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(admin._id);
    const sanitizedAdmin = await Admin.findById(admin._id).select("-password -refreshToken");

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    };

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, {
                admin: sanitizedAdmin,
                accessToken,
                refreshToken
            }, "Admin logged in successfully")
        );
});

const logoutAdmin = asyncHandler(async (req, res) => {
    const adminId = req.admin?._id;
    if (!adminId) {
        throw new ApiError(401, "Unauthorized request");
    }

    await Admin.findByIdAndUpdate(adminId, {
        $unset: { refreshToken: 1 }
    });

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    };

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Admin logged out successfully"));
});

const getCurrentAdmin = asyncHandler(async (req, res) => {
    if (!req.admin) {
        throw new ApiError(401, "Unauthorized");
    }

    return res.status(200).json(
        new ApiResponse(200, req.admin, "Current admin fetched successfully")
    );
});

export {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    getCurrentAdmin
};
