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
  const targetCut = product.selectedCut || "";
  const targetWeight = product.orderedWeightGrams || 0;
  const existing = cart.find(
    (item) => item._id === product._id && (item.selectedCut || "") === targetCut && (item.orderedWeightGrams || 0) === targetWeight
  );

  const qtyToAdd = Number(product.qty || product.quantity || 1);
  const unitPrice = !isNaN(parseFloat(product.price)) ? parseFloat(product.price) : (parseFloat(product.basePrice) || 0);

  if (existing) {
    existing.qty += qtyToAdd;
    existing.unitPrice = unitPrice;
    existing.price = unitPrice;
    existing.pricePerKg = product.pricePerKg ? Number(product.pricePerKg) : 0;
  } else {
    const newItem = {
      _id: product._id,
      name: product.name,
      image: product.image,
      unitPrice: unitPrice,
      basePrice: parseFloat(product.basePrice) || unitPrice,
      price: unitPrice,
      qty: qtyToAdd,
      unit: product.unit || 'kg',
      flashSale: product.flashSale,
      selectedCut: targetCut,
      cutPriceAdjustmentPct: Number(product.cutPriceAdjustmentPct || 0),
      orderedWeightGrams: targetWeight,
      pricePerKg: product.pricePerKg ? Number(product.pricePerKg) : 0,
    };
    cart.push(newItem);
  }

  saveCart(cart);
};

export const removeFromCart = (id, selectedCut = "", orderedWeightGrams = 0) => {
  const cart = getCart();
  const updatedCart = cart.filter(
    (item) => !(item._id === id && (item.selectedCut || "") === selectedCut && (item.orderedWeightGrams || 0) === orderedWeightGrams)
  );
  saveCart(updatedCart);
};

export const updateQty = (id, newQty, selectedCut = "", orderedWeightGrams = 0) => {
  const cart = getCart();
  const item = cart.find(
    (item) => item._id === id && (item.selectedCut || "") === selectedCut && (item.orderedWeightGrams || 0) === orderedWeightGrams
  );

  if (item) {
    if (newQty > 0) {
      item.qty = newQty;
      const stablePrice = item.unitPrice || item.price;
      item.price = stablePrice;
      item.unitPrice = stablePrice;
      saveCart(cart);
    } else {
      removeFromCart(id, selectedCut, orderedWeightGrams);
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
