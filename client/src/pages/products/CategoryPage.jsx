import { useEffect, useState, useContext } from "react";
import axios from "axios";
import ProductQuickView from "../../components/ProductQuickView";
import { CartContext } from "../../context/CartContext";
import { addToCart } from "../../utils/cartStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function CategoryPage({ title, category }) {
  const { refreshCartCount } = useContext(CartContext);

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/products`)
      .then((res) => {
        // ✅ backend sends { products: [...] }
        const filtered = res.data.products.filter(
          (p) => p.category === category
        );
        setItems(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const handleAdd = (e, item) => {
    e.stopPropagation();
    addToCart(item);
    refreshCartCount();
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-gray-500">
        Loading {title}...
      </div>
    );
  }

  return (
    <section className="pt-28 pb-20 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-center mb-10">
        {title}
      </h2>

      {items.length === 0 ? (
        <p className="text-center text-gray-500">
          No products available
        </p>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-6">
          {items.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelected(item)}
              className="bg-white rounded-2xl shadow
                         hover:shadow-xl hover:-translate-y-2
                         transition-all duration-500 cursor-pointer group"
            >
              <div className="relative overflow-hidden rounded-t-2xl">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover
                             group-hover:scale-110 transition-transform duration-700"
                />

                {item.trending && (
                  <span className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full">
                    Trending
                  </span>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">
                  {item.name}
                </h3>

                <p className="text-red-600 font-bold text-lg mb-3">
                  ₹{item.price}
                </p>

                <button
                  onClick={(e) => handleAdd(e, item)}
                  className="w-full bg-red-600 text-white py-2 rounded-xl
                             hover:bg-red-700 transition"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductQuickView
        product={selected}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
