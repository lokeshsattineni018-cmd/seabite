import { z } from "zod";

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.errors ? err.errors[0].message : "Validation Error",
      errors: err.errors
        ? err.errors.map((e) => ({
            path: e.path.slice(1).join("."), // strip the "body" prefix
            message: e.message,
          }))
        : [],
    });
  }
};

// ── SCHEMA DEFINITIONS ──

// Login Schema
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email address" }),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, { message: "Password cannot be empty" }),
  }),
});

// Signup Schema
export const signupSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .min(2, { message: "Name must be at least 2 characters long" }),
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email address" }),
    phone: z
      .string({ required_error: "Phone number is required" })
      .regex(/^\d{10}$/, { message: "Phone number must be exactly 10 digits" }),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters long" })
      .refine((val) => /[a-zA-Z]/.test(val) && /[0-9]/.test(val), {
        message: "Password must contain both letters and numbers",
      }),
    otp: z
      .string({ required_error: "OTP is required" })
      .length(6, { message: "OTP must be exactly 6 digits" }),
    referralCode: z.string().optional(),
  }),
});

// Checkout Schema
export const checkoutSchema = z.object({
  body: z.object({
    amount: z.coerce.number({ required_error: "Total amount is required" }),
    itemsPrice: z.coerce.number().optional(),
    taxPrice: z.coerce.number().optional(),
    shippingPrice: z.coerce.number().optional(),
    discount: z.coerce.number().optional(),
    paymentMethod: z.string().optional(),
    deliverySlot: z.string().optional(),
    deliveryDate: z.string().optional(),
    items: z.array(z.any()).min(1, { message: "Cart must contain at least one item" }),
    shippingAddress: z.object({
      fullName: z.string().optional(),
      name: z.string().optional(),
      phone: z.string().optional(),
      houseNo: z.string().optional(),
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
    }).passthrough().optional(),
    isGift: z.boolean().optional(),
    giftMessage: z.string().optional(),
    useWallet: z.boolean().optional(),
    walletAppliedAmount: z.coerce.number().optional(),
    loyaltyPointsToRedeem: z.coerce.number().optional(),
    giftCardCode: z.string().optional(),
    couponCode: z.string().optional(),
    visitorId: z.string().optional(),
  }).passthrough(),
});

// Reset Password Schema
export const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email address" }),
    otp: z
      .string({ required_error: "OTP is required" })
      .length(6, { message: "OTP must be exactly 6 digits" }),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, { message: "Password must be at least 8 characters long" })
      .refine((val) => /[a-zA-Z]/.test(val) && /[0-9]/.test(val), {
        message: "Password must contain both letters and numbers",
      }),
  }),
});

// Coupon Validate Schema
export const couponValidateSchema = z.object({
  body: z.object({
    code: z
      .string({ required_error: "Coupon code is required" })
      .min(1, { message: "Coupon code cannot be empty" }),
    cartTotal: z.number({ required_error: "Cart total is required" }),
    email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  }),
});

// Adjust Wallet Schema
export const adjustWalletSchema = z.object({
  body: z.object({
    amount: z.number({ required_error: "Amount is required" }),
    reason: z.string().optional(),
  }),
});
