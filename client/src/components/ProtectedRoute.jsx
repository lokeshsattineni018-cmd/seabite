import { createContext, useState, useEffect, useCallback } from "react";

// 1. Export the Context itself
export const CartContext = createContext();

// Function to calculate totals from the cart array (kept outside Provider)
const calculateTotals = (cart) => {
    let subtotal = 0;
    let count = 0;

    for (const item of cart) {
        // Ensure price and quantity are valid numbers
        const price = Number(item.price || item.basePrice || 0);
        const qty = Number(item.qty || 1);
        
        subtotal += price * qty;
        count += qty;
    }
    
    // Simple fixed tax and delivery logic (adjust as needed)
    const taxRate = 0.05; // 5% tax
    const deliveryFee = subtotal > 1000 ? 0 : 50; // Free delivery over ₹1000
    
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
        // ... other totals (tax, deliveryFee)
    });

    // Function to read cart data from localStorage and update state
    const updateCartState = useCallback(() => {
        try {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const totals = calculateTotals(cart);
            
            // Set the full state object
            setCartState(totals); 
        } catch (e) {
            console.error("Failed to parse cart data from localStorage:", e);
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

    // Value provided to consuming components
    const contextValue = {
        // Expose the entire state object, allowing access to cartItems, subtotal, etc.
        ...cartState,
        // Keep the old function name for backward compatibility
        refreshCartCount,
        // The core item data is cartItems
        cartItems: cartState.cartItems
    };

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};