import { createContext, useState, useEffect, useCallback } from "react";

// 1. Export the Context itself
export const CartContext = createContext();

// Function to calculate totals from the cart array (kept outside Provider)
const calculateTotals = (cart) => {
    let subtotal = 0;
    let count = 0;

    for (const item of cart) {
        // Ensure price and quantity are valid numbers, prioritizing 'price' saved on cart item
        const price = Number(item.price || item.basePrice || 0);
        const qty = Number(item.qty || 1);

        subtotal += price * qty;
        count += qty;
    }

    // Define your business logic for fixed tax and delivery here (adjust as needed)
    const taxRate = 0.05; // Example: 5% tax
    const deliveryFee = subtotal >= 1500 ? 0 : 75; // Example: Free delivery over ₹1500

    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax + deliveryFee;

    return {
        cartItems: cart,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        cartCount: count,
    };
};


// 2. Export the Provider component
export const CartProvider = ({ children }) => {
    const [cartState, setCartState] = useState({
        cartItems: [],
        cartCount: 0,
        subtotal: '0.00',
        grandTotal: '0.00',
        tax: '0.00',
        deliveryFee: '0.00',
    });

    // Function to read cart data from localStorage and update state
    const updateCartState = useCallback(() => {
        try {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const totals = calculateTotals(cart);

            // Set the full state object
            setCartState(totals);
        } catch (e) {
            // console.error("Failed to parse cart data from localStorage:", e);
        }
    }, []);

    // Function exposed to components (like Products.jsx) to trigger a refresh
    const refreshCartCount = updateCartState;

    // Initial load and storage listener setup
    useEffect(() => {
        updateCartState();

        window.addEventListener("storage", updateCartState);
        return () => window.removeEventListener("storage", updateCartState);
    }, [updateCartState]);

    const addToCart = (product) => {
        try {
            const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
            const existingItemIndex = currentCart.findIndex((item) => item._id === product._id);

            if (existingItemIndex > -1) {
                currentCart[existingItemIndex].qty += product.quantity || 1;
            } else {
                currentCart.push({
                    ...product,
                    qty: product.quantity || 1,
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