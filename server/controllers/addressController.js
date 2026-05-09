import User from "../models/User.js";

// @desc    Add a new address
// @route   POST /api/user/address
// @access  Private
export const addAddress = async (req, res) => {
    try {
        const { name, phone, houseNo, street, landmark, city, state, postalCode, isDefault } = req.body;
        console.log(`🔍 [DEBUG] addAddress triggered for user: ${req.user?._id}`);
        console.log("📦 Payload Summary:", JSON.stringify({ name, phone, houseNo, street, city, state, postalCode }));

        if (!name || !phone || !houseNo || !street || !city || !state || !postalCode) {
            console.log("❌ [ADDRESS] Validation failed: Missing required fields");
            return res.status(400).json({ message: "All fields except landmark are required" });
        }

        if (phone.length < 10) {
            console.log("❌ [ADDRESS] Validation failed: Phone too short", phone);
            return res.status(400).json({ message: "Valid 10-digit phone number is required" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            console.log("❌ [ADDRESS] User not found:", req.user?._id);
            return res.status(404).json({ message: "User not found" });
        }

        const newAddress = {
            name,
            phone,
            houseNo,
            street,
            landmark,
            city,
            state,
            postalCode,
            isDefault: isDefault || false,
        };

        // If set as default, unset others
        if (isDefault) {
            user.addresses.forEach((addr) => (addr.isDefault = false));
        } else if (user.addresses.length === 0) {
            // First address is always default
            newAddress.isDefault = true;
        }

        user.addresses.push(newAddress);
        await user.save();
        console.log("✅ [ADDRESS] Address added successfully");

        res.status(201).json(user.addresses);
    } catch (error) {
        console.error("❌ [ADDRESS] Add Address Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Get all addresses
// @route   GET /api/user/address
// @access  Private
export const getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Delete an address
// @route   DELETE /api/user/address/:id
// @access  Private
export const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.addresses = user.addresses.filter(
            (addr) => addr._id.toString() !== req.params.id
        );

        await user.save();
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Update an address
// @route   PUT /api/user/address/:id
// @access  Private
export const updateAddress = async (req, res) => {
    try {
        const { name, phone, houseNo, street, landmark, city, state, postalCode, isDefault } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const address = user.addresses.id(req.params.id);
        if (!address) return res.status(404).json({ message: "Address not found" });

        address.name = name || address.name;
        address.phone = phone || address.phone;
        address.houseNo = houseNo || address.houseNo;
        address.street = street || address.street;
        address.landmark = landmark || address.landmark;
        address.city = city || address.city;
        address.state = state || address.state;
        address.postalCode = postalCode || address.postalCode;
        
        if (isDefault !== undefined) {
            address.isDefault = isDefault;
            if (isDefault) {
                user.addresses.forEach((addr) => {
                    if (addr._id.toString() !== req.params.id) addr.isDefault = false;
                });
            }
        }

        await user.save();
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
