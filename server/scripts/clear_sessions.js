import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const clearSessions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB");

        // Use the native MongoDB driver to access the collection directly
        const db = mongoose.connection.db;
        const collection = db.collection("sessions");

        // Count documents before deletion
        const count = await collection.countDocuments();
        console.log(`Found ${count} sessions.`);

        // Drop the collection to clear all sessions
        if (count > 0) {
            await collection.drop();
            console.log("✅ Sessions collection dropped successfully.");
        } else {
            console.log("No sessions to clear.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error clearing sessions:", error);
        process.exit(1);
    }
};

clearSessions();
