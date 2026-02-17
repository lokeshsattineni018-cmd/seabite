import { createContext, useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

// 1. Export the Context itself
export const CartContext = createContext();

// Function to calculate totals from the cart array (kept outside Provider)
// Function to calculate totals from the cart array (kept outside Provider)
const calculateTotals = (cart, globalDiscount = 0) => {
    let subtotal = 0;
    let count = 0;

    const updatedCart = cart.map(item => {
        let price = parseFloat(item.basePrice); // Always start from basePrice
        if (isNaN(price)) price = parseFloat(item.price) || 0;

        // Check for Flash Sale (need to ensure item has flashSale data)
        const isFlashSale = item.flashSale?.isFlashSale && new Date(item.flashSale.saleEndDate) > new Date();

        if (isFlashSale) {
            price = parseFloat(item.flashSale.discountPrice);
        } else if (globalDiscount > 0) {
            price = Math.round(price * (1 - globalDiscount / 100));
        }

        const qty = Number(item.qty || 1);

        if (!isNaN(price) && !isNaN(qty)) {
            subtotal += price * qty;
            count += qty;
        }

        return { ...item, price }; // Return item with effective price
    });

    // Define your business logic for fixed tax and delivery here (adjust as needed)
    const taxRate = 0.05; // Example: 5% tax
    const deliveryFee = subtotal >= 1000 ? 0 : 99; // Updated to match Checkout logic (1000)

    const tax = Math.round(subtotal * taxRate);
    const grandTotal = subtotal + tax + deliveryFee;

    return {
        cartItems: updatedCart,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        cartCount: count,
        globalDiscount, // Expose it
    };
};


// 2. Export the Provider component
export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cartState, setCartState] = useState({
        cartItems: [],
        cartCount: 0,
        subtotal: '0.00',
        grandTotal: '0.00',
        tax: '0.00',
        deliveryFee: '0.00',
        globalDiscount: 0, // 🟢 NEW
    });

    // Fetch Global Discount
    const [globalDiscount, setGlobalDiscount] = useState(0);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // We'll use the products endpoint since it returns globalDiscount
                // Or ideally a dedicated settings endpoint. For now, products is safe.
                const res = await axios.get(`${API_URL}/api/products?limit=1`);
                if (res.data.globalDiscount) {
                    setGlobalDiscount(res.data.globalDiscount);
                }
            } catch (err) {
                // console.error(err);
            }
        };
        fetchSettings();
    }, []);

    // Recalculate totals whenever cart OR discount changes
    useEffect(() => {
        updateCartState();
    }, [globalDiscount]); // Add discount dependency

    // Function to read cart data from localStorage and update state
    const updateCartState = useCallback(() => {
        try {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const totals = calculateTotals(cart, globalDiscount); // Pass discount

            // Set the full state object
            setCartState(totals);
        } catch (e) {
            // console.error("Failed to parse cart data from localStorage:", e);
        }
    }, [globalDiscount]); // Add dependency

    // Function exposed to components (like Products.jsx) to trigger a refresh
    const refreshCartCount = updateCartState;

    // Initial load and storage listener setup
    useEffect(() => {
        updateCartState();

        window.addEventListener("storage", updateCartState);
        return () => window.removeEventListener("storage", updateCartState);
    }, [updateCartState]);

    // 🟢 SYNC: On Login, Merge/Sync Cart
    useEffect(() => {
        if (!user) return;

        const syncCart = async () => {
            const localCart = JSON.parse(localStorage.getItem("cart") || "[]");

            // If local cart is empty, try to fetch from DB
            if (localCart.length === 0) {
                try {
                    const res = await axios.get(`${API_URL}/api/user/cart`, { withCredentials: true });
                    if (res.data && res.data.length > 0) {
                        // Transform DB cart format to Local format if needed (usually flatten product object)
                        const dbCart = res.data.map(item => ({
                            ...item.product,
                            qty: item.qty,
                            // Ensure we use the correct price from product (or historical? usually current)
                            price: item.product.price || item.product.basePrice // Simplified
                        }));
                        localStorage.setItem("cart", JSON.stringify(dbCart));
                        updateCartState();
                    }
                } catch (err) {
                    console.error("Failed to fetch cart", err);
                }
            } else {
                // If local cart has items, push to DB (Simple Overwrite for now)
                try {
                    // We send minimal data: product ID and qty
                    const payload = localCart.map(item => ({ product: item._id, qty: item.qty }));
                    await axios.post(`${API_URL}/api/user/cart`, { cart: payload }, { withCredentials: true });
                } catch (err) {
                    console.error("Failed to sync cart", err);
                }
            }
        };

        syncCart();
    }, [user, updateCartState]);

    // 🟢 SYNC: Debounce sync when cart changes if logged in
    useEffect(() => {
        if (!user) return;

        const timeout = setTimeout(async () => {
            const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
            // Only sync if there are changes (we could track dirty state, but simple overwrite is safer for consistency)
            // Check if local matches state to avoid infinite loops?
            // Actually, updateCartState updates cartState. 
            // We can just trust that whenever cartState changes, we sync.

            try {
                const payload = localCart.map(item => ({ product: item._id, qty: item.qty }));
                await axios.post(`${API_URL}/api/user/cart`, { cart: payload }, { withCredentials: true });
            } catch (err) {
                // Silent fail
            }
        }, 2000); // 2s debounce

        return () => clearTimeout(timeout);
    }, [cartState, user]);


    const addToCart = (product) => {
        try {
            const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
            const existingItemIndex = currentCart.findIndex((item) => item._id === product._id);

            if (existingItemIndex > -1) {
                currentCart[existingItemIndex].qty += product.quantity || 1;
            } else {
                // Ensure price is valid before saving
                let finalPrice = parseFloat(product.price);
                if (isNaN(finalPrice)) finalPrice = parseFloat(product.basePrice);
                if (isNaN(finalPrice)) finalPrice = 0;

                currentCart.push({
                    ...product,
                    qty: product.quantity || 1,
                    price: finalPrice
                });
            }

            localStorage.setItem("cart", JSON.stringify(currentCart));
            updateCartState();

            // Dispatch custom event for other listeners
            window.dispatchEvent(new Event("storage"));
        } catch (error) {
            console.error("Error adding to cart:", error);
        }
    };

    const removeFromCart = (productId) => {
        try {
            const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
            const updatedCart = currentCart.filter((item) => item._id !== productId);

            localStorage.setItem("cart", JSON.stringify(updatedCart));
            updateCartState();
            window.dispatchEvent(new Event("storage"));
        } catch (error) {
            console.error("Error removing from cart:", error);
        }
    };

    const updateQuantity = (productId, newQty) => {
        try {
            if (newQty < 1) return;
            const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
            const itemIndex = currentCart.findIndex((item) => item._id === productId);

            if (itemIndex > -1) {
                currentCart[itemIndex].qty = newQty;
                localStorage.setItem("cart", JSON.stringify(currentCart));
                updateCartState();
                window.dispatchEvent(new Event("storage"));
            }
        } catch (error) {
            console.error("Error updating quantity:", error);
        }
    };

    const clearCart = () => {
        localStorage.removeItem("cart");
        updateCartState();
        window.dispatchEvent(new Event("storage"));
    };

    // Value provided to consuming components
    const contextValue = {
        ...cartState,
        refreshCartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartItems: cartState.cartItems
    };

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};