import { useState, useEffect } from 'react';

/**
 * useABTest Hook
 * @param {string} testKey - Unique key for the A/B test (e.g., 'home_cta_color')
 * @param {Array} variants - Array of variants, e.g. ['control', 'test'] or ['primary', 'accent']
 * @returns {string} - The selected variant for the current user
 */
const useABTest = (testKey, variants = ['A', 'B']) => {
  const [variant, setVariant] = useState(null);

  useEffect(() => {
    const storageKey = `ab_test_${testKey}`;
    let savedVariant = localStorage.getItem(storageKey);

    if (!savedVariant || !variants.includes(savedVariant)) {
      // Assign a random variant if not already assigned
      const randomIndex = Math.floor(Math.random() * variants.length);
      savedVariant = variants[randomIndex];
      localStorage.setItem(storageKey, savedVariant);
      
      // Log for analytics (mock)
      console.log(`[AB-Test] Assigned ${savedVariant} to ${testKey}`);
    }

    setVariant(savedVariant);
  }, [testKey, variants]);

  return variant;
};

export default useABTest;
