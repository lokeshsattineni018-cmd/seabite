import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/seabite";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri);
  
  const products = await Product.find({}, { name: 1, basePrice: 1, price: 1, cuts: 1, hasCuts: 1, pricePerKg: 1 });
  console.log("Found products:");
  products.forEach(p => console.log(JSON.stringify(p)));
  
  await mongoose.disconnect();
}

main().catch(console.error);
