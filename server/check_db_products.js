import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/seabite";
  await mongoose.connect(uri);
  const products = await Product.find({
    name: { $in: ["Rainbow Trout Fish", "Vanjaram/Seer - Small", "Mud crab(medium)", "Trevally"] }
  });
  console.log("Found products:", JSON.stringify(products, null, 2));
  
  await mongoose.disconnect();
}

main().catch(console.error);
