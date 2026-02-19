import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CartProvider, CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

// Mock axios
vi.mock('axios', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: { deliveryFee: 50, taxRate: 5, freeDeliveryThreshold: 500 } }),
        post: vi.fn(),
    },
}));

// Helper component
const TestComponent = () => {
    const { subtotal, deliveryFee, tax, grandTotal, storeSettings } = useContext(CartContext);
    return (
        <div>
            <div data-testid="subtotal">{subtotal}</div>
            <div data-testid="deliveryFee">{deliveryFee}</div>
            <div data-testid="tax">{tax}</div>
            <div data-testid="grandTotal">{grandTotal}</div>
            <div data-testid="settings-fee">{storeSettings?.deliveryFee}</div>
        </div>
    );
};

describe('CartContext Logic', () => {
    it('provides default values and fetches settings', async () => {

        render(
            <AuthContext.Provider value={{ user: null }}>
                <CartProvider>
                    <TestComponent />
                </CartProvider>
            </AuthContext.Provider>
        );

        // Initial state should be zero/empty, but delivery fee defaults to 99
        expect(screen.getByTestId('subtotal')).toHaveTextContent('0.00');
        expect(screen.getByTestId('deliveryFee')).toHaveTextContent('99.00');

        // Wait for settings to load (useEffect)
        // The context fetches settings on mount.
        // We expect storeSettings to be populated eventually.
        await waitFor(() => {
            expect(screen.getByTestId('settings-fee')).toHaveTextContent('50');
            // Once settings load, the delivery fee logic re-runs with new fee (50)
            expect(screen.getByTestId('deliveryFee')).toHaveTextContent('50.00');
        });
    });
});
