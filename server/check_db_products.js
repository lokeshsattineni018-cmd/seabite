import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/seabite";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri);
  
  const products = await Product.find({ name: /Vanjaram/i });
  console.log("Found products:", JSON.stringify(products.map(p => ({
    name: p.name,
    _id: p._id,
    basePrice: p.basePrice,
    pricePerKg: p.pricePerKg,
    price: p.price,
    flashSale: p.flashSale,
    unit: p.unit
  })), null, 2));
  
  await mongoose.disconnect();
}

main().catch(console.error);
