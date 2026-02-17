import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/Order.js";
import User from "./models/User.js";
import Product from "./models/Product.js";

dotenv.config();

const verifyData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB. Database Name:", mongoose.connection.name);

        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();
        const orderCount = await Order.countDocuments();

        console.log(`Users: ${userCount}`);
        console.log(`Products: ${productCount}`);
        console.log(`Orders: ${orderCount}`);

        if (orderCount > 0) {
            const recentOrder = await Order.findOne().sort({ createdAt: -1 });
            console.log("Latest Order:", JSON.stringify(recentOrder, null, 2));
        }

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

verifyData();
