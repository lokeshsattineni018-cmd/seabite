import jwt from "jsonwebtoken";

/**
 * Generates a JWT token and sets it as an HTTP-only cookie.
 * @param {Object} res - Express response object
 * @param {string} userId - The user ID to encode in the token
 */
const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || "seabite_secret_key_123", {
    expiresIn: "30d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none", // Required for cross-site cookie in some environments
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export default generateToken;
