// src/pages/Menu.jsx
import { useState, useEffect } from "react";
import ProductGrid from "../components/ProductGrid"; 

export default function Menu() {
  // Example state - replace with your actual API fetch
  const [products, setProducts] = useState([
    { id: 1, name: "Lobster Tail", price: 45, image: "/lobster.jpg" },
    { id: 2, name: "King Crab", price: 60, image: "/crab.jpg" },
    { id: 3, name: "Salmon Fillet", price: 25, image: "/salmon.jpg" },
    // ... more items
  ]);

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <h1 className="text-4xl font-serif text-center mb-10">Our Menu</h1>
      
      {/* Use the new animated grid */}
      <ProductGrid products={products} />
    </div>
  );
}