const CART_KEY = "cart"; 

// ✅ DISPATCHER: Informs the Navbar & Sidebar to update without a white-page refresh
const notifyCartUpdate = () => {
  window.dispatchEvent(new Event("storage"));
  // Custom event for faster React state syncing
  window.dispatchEvent(new CustomEvent("cartUpdated"));
};

export const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  notifyCartUpdate();
};

export const getCart = () => {
  try {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (err) {
    console.error("Cart corruption detected, clearing...");
    localStorage.removeItem(CART_KEY);
    return [];
  }
};

export const addToCart = (product) => {
  const cart = getCart();
  const existing = cart.find((item) => item._id === product._id); 
  
  // 🔴 FIX: Derive stable unitPrice to prevent "Price Doubling"
  const derivedUnitPrice = product.qty > 0 ? (product.price / product.qty) : product.price;

  if (existing) {
    // Increment quantity only
    existing.qty += (product.qty || 1);
    existing.unitPrice = existing.unitPrice || derivedUnitPrice;
    existing.price = existing.unitPrice; 
  } else {
    // ✅ OPTIMIZATION: Create a clean object to save memory
    const newItem = {
        _id: product._id,
        name: product.name,
        image: product.image,
        unitPrice: derivedUnitPrice,
        price: derivedUnitPrice, // Keep as unit price for calculation safety
        qty: product.qty || 1,
        unit: product.unit || 'kg'
    };
    cart.push(newItem);
  }

  saveCart(cart);
};

export const removeFromCart = (id) => {
  const cart = getCart();
  const updatedCart = cart.filter((item) => item._id !== id);
  saveCart(updatedCart);
};

export const updateQty = (id, newQty) => {
  const cart = getCart();
  const item = cart.find((item) => item._id === id);

  if (item) {
    if (newQty > 0) {
      item.qty = newQty;
      const stablePrice = item.unitPrice || item.price;
      
      // 🔴 PREVENT CORRUPTION: Keep price as the UNIT price
      item.price = stablePrice; 
      item.unitPrice = stablePrice;

      saveCart(cart);
    } else {
      removeFromCart(id);
    }
  }
};

// ✅ ADDED: Calculate Total with Coupon Support
export const getCartTotals = (couponDiscount = 0) => {
  const cart = getCart();
  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);
  
  // Flash Sale Logic (e.g., SEABITE10)
  const discountAmount = (subtotal * couponDiscount) / 100;
  const total = subtotal - discountAmount;

  return {
    subtotal,
    discountAmount,
    total: total > 0 ? total : 0,
    itemCount: cart.reduce((acc, item) => acc + item.qty, 0)
  };
};

export const clearCart = () => {
  localStorage.removeItem(CART_KEY);
  notifyCartUpdate();
};