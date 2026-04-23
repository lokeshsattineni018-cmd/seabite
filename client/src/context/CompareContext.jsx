import { createContext, useState, useEffect } from "react";
import toast from "../utils/toast";

export const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
  const [compareItems, setCompareItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("seabite_compare");
    if (saved) {
      try {
        setCompareItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse comparison data");
      }
    }
  }, []);

  const toggleCompare = (product) => {
    setCompareItems((prev) => {
      const exists = prev.find((item) => item._id === product._id);
      let newItems;
      if (exists) {
        newItems = prev.filter((item) => item._id !== product._id);
        toast.info(`Removed ${product.name} from comparison`);
      } else {
        if (prev.length >= 4) {
          toast.error("You can compare up to 4 products at once.");
          return prev;
        }
        newItems = [...prev, product];
        toast.success(`Added ${product.name} to comparison`);
      }
      localStorage.setItem("seabite_compare", JSON.stringify(newItems));
      return newItems;
    });
  };

  const clearCompare = () => {
    setCompareItems([]);
    localStorage.removeItem("seabite_compare");
  };

  return (
    <CompareContext.Provider value={{ compareItems, toggleCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
};
