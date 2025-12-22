const CART_KEY = "cart"; 

export const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("storage"));
};

export const getCart = () => {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
};

export const addToCart = (product) => {
  const cart = getCart();
  const existing = cart.find((item) => item._id === product._id); 
  
  // 🔴 CRITICAL: Determine the actual unit price. 
  // We assume 'product' passed here is a clean product object from the server.
  // We will store the stable price in `unitPrice` and use `price` for the total if needed.
  
  // Assuming the `product.price` passed from ProductDetails is the TOTAL price (qty * unitPrice), 
  // we must derive the unitPrice from it:
  const derivedUnitPrice = product.qty > 0 ? (product.price / product.qty) : product.price;

  if (existing) {
    // 🔴 FIX 1: If item exists, increase quantity and use the stored stable unitPrice
    existing.qty += product.qty; // Assumes you want to add the quantity
    
    // Safety check: ensure unitPrice is stored if it wasn't before
    if (!existing.unitPrice) {
        existing.unitPrice = derivedUnitPrice;
    }
    
  } else {
    // 🔴 FIX 2: Add the new item, ensuring the stable unit price is saved.
    
    // We create a new clean item for storage
    const newItem = {
        ...product,
        // Store the stable unit price separately
        unitPrice: derivedUnitPrice, 
        // We will now ensure components use unitPrice * qty
        price: derivedUnitPrice // For backward compatibility, make item.price the unit price
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

  if (item && newQty > 0) {
    item.qty = newQty;
    
    // 🔴 FIX 3: Ensure the item has unitPrice. 
    const stablePrice = item.unitPrice || item.price; // Use unitPrice if available, otherwise use existing price (which should now be the unit price)
    
    // IMPORTANT: DO NOT set item.price = stablePrice * newQty here! 
    // This is where the corruption was happening.
    // The components will handle the calculation: (stablePrice * item.qty).
    
    // If you absolutely need item.price to reflect the total (not recommended):
    // item.price = stablePrice * newQty; 
    
    // We will assume item.price MUST hold the unit price for the component reduce to work correctly:
    item.price = stablePrice; // Ensure item.price holds the unit price after update
    item.unitPrice = stablePrice; // Ensure unitPrice is saved

    saveCart(cart);
  } else if (item && newQty === 0) {
      // If quantity drops to zero, remove the item
      removeFromCart(id);
  }
};

export const clearCart = () => {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("storage"));
};