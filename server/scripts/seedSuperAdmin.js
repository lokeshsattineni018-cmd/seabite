import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const seedSuperAdmin = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is not set in env");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    const email = "lokeshsattineni018@gmail.com";
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ User with email ${email} not found. Creating a new admin user...`);
      // Since it's a seed script, if the user doesn't exist, we can create a dummy one
      const newUser = await User.create({
        name: "Lokesh Sattineni",
        email: email.toLowerCase(),
        password: "DefaultSuperAdminPassword123", // User should change this immediately
        role: "admin",
        isSuperAdmin: true,
      });
      console.log(`✅ Super Admin created successfully! ID: ${newUser._id}`);
      console.log("⚠️ Please change the default password immediately on first login.");
    } else {
      console.log(`Found user: ${user.name} (${user.email}). Promoting...`);
      user.role = "admin";
      user.isSuperAdmin = true;
      await user.save();
      console.log(`✅ User promoted to Super Admin successfully!`);
    }

  } catch (err) {
    console.error("❌ Database Operation Failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  }
};

seedSuperAdmin();
