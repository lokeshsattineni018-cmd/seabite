import User from "../models/User.js";

// @desc    Add a new address
// @route   POST /api/user/address
// @access  Private
export const addAddress = async (req, res) => {
    try {
        const { name, phone, houseNo, street, landmark, city, state, postalCode, isDefault } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

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

        res.status(201).json(user.addresses);
    } catch (error) {
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
