import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    //  console.log(req);
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    // console.log(req.cookies)
    if (!token) {
      throw new ApiError(401, "Unauthorized Request");
    }
    //   console.log("hihihihi")
    //   console.log(token);
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log(decodedToken);
    if (decodedToken?.officerName) {
      const admin = await Admin.findById(decodedToken?._id).select("-password -refreshToken");
      // console.log(admin);
      if (!admin) {
        throw new ApiError(401, "Invalid access Token");
      }

      req.admin = admin;
      next();
      // console.log('hi obaid');
    } else {
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
      if (!user) {
        throw new ApiError(401, "invalid access Token");
      }
      req.user = user;
      next();
    }
  } catch (error) {
    // console.log("hoolo popo");
    throw new ApiError(401, error?.message || "Invalid access token")
  }
})



/*const verifyAdminJWT = asyncHandler(async (req, res, next) => {
  try {
    console.log("Cookies:", req.cookies); // Check if cookies are present
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    console.log("Token:", token); // Check if token is being extracted correctly

    if (!token) {
      throw new ApiError(401, "Unauthorized Request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded Token:", decodedToken); // Check decoded token

    const admin = await Admin.findById(decodedToken?._id).select("-password -refreshToken");
    if (!admin) {
      throw new ApiError(401, "Invalid access Token");
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.log("JWT Verification Error:", error); // Detailed error logging
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});*/


export {
  verifyJWT,
  // verifyAdminJWT
}