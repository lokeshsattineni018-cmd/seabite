const itemTotal = 5330;
const taxRate = 5;
const deliveryFee = 99;
const freeThreshold = 1000;

// Client logic
const appliedCoupon = {
  discountType: "percent",
  value: 15,
  maxDiscount: 0
};
const spinDiscount = null;

const val = appliedCoupon.value;
const maxD = appliedCoupon.maxDiscount;
let calculated = (itemTotal * val) / 100;
if (maxD > 0 && calculated > maxD) {
  calculated = maxD;
}
const clientDiscount = Math.min(Math.floor(calculated), itemTotal);

const taxableAmount = Math.max(0, itemTotal - clientDiscount);
const gst = Math.round(taxableAmount * (taxRate / 100));
const clientDelivery = (itemTotal >= freeThreshold) ? 0 : deliveryFee;
const clientGrandTotal = Math.max(0, taxableAmount + clientDelivery + gst);

console.log("CLIENT:", { clientDiscount, taxableAmount, gst, clientDelivery, clientGrandTotal });

// Server logic
const recalculatedItemsPrice = 5330;
const couponDoc = {
  discountType: "percent",
  value: 15,
  maxDiscount: 0
};

let calculatedCouponDiscount = (recalculatedItemsPrice * couponDoc.value) / 100;
if (couponDoc.maxDiscount > 0 && calculatedCouponDiscount > couponDoc.maxDiscount) {
  calculatedCouponDiscount = couponDoc.maxDiscount;
}
calculatedCouponDiscount = Math.min(Math.floor(calculatedCouponDiscount), recalculatedItemsPrice);

const finalSubtotal = Math.max(0, recalculatedItemsPrice - calculatedCouponDiscount);
const calculatedTaxPrice = Math.round(finalSubtotal * (taxRate / 100));
const isShippingCoupon = false;
const calculatedShippingPrice = (recalculatedItemsPrice >= freeThreshold || isShippingCoupon) ? 0 : deliveryFee;
const serverTotalBeforeWallet = finalSubtotal + calculatedShippingPrice + calculatedTaxPrice;

console.log("SERVER:", { calculatedCouponDiscount, finalSubtotal, calculatedTaxPrice, calculatedShippingPrice, serverTotalBeforeWallet });
