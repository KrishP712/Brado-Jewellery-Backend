const Addressbook = require("../model/addressbook")
const ObjectId = require("mongoose").Types.ObjectId;
const createAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const address = await Addressbook.findOne({ userId: userId });
        if (address) {
            await Addressbook.findOneAndUpdate(
                { userId: req.user._id },
                { $push: { address: req.body } },
                { new: true, upsert: true }
            );

            res.status(200).json({ success: true, message: "Address updated successfully" });
        } else {
            await Addressbook.create({ userId: req.user._id, address: req.body });

            res.status(200).json({ success: true, message: "Address added successfully" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }

}

const getAllAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log(userId)
        const address = await Addressbook.findOne({ userId })
        res.status(200).json({ success: true, message: "Address fetched successfully", address })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
}

const getByIdAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user._id;

        const userAddress = await Addressbook.findOne({ userId });

        if (!userAddress || !userAddress.address.length) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // find sub address by id
        const address = userAddress.address.find((item) => item._id.toString() === addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: "Sub-address not found" });
        }

        res.status(200).json({ success: true, message: "Address fetched successfully", address });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
const updateAddress = async (req, res) => {

    try {
        const { addressId } = req.params;
        const userIdObj = new ObjectId(req.user._id);
        const addressIdObj = new ObjectId(addressId);
        console.log(userIdObj, addressIdObj)
        const updateData = req.body;
        const updateFields = {};
        Object.keys(updateData).forEach(key => {
            updateFields[`address.$.${key}`] = updateData[key];
        });
        const updatedAddressbook = await Addressbook.findOneAndUpdate(
            { userId: userIdObj, 'address._id': addressIdObj },
            { $set: updateFields },
            { new: true }
        );
        if (!updatedAddressbook) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            address: updatedAddressbook
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

}
const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user._id;

        const updatedAddress = await Addressbook.findOneAndUpdate(
            { userId: userId },
            { $pull: { address: { _id: addressId } } },
        );

        if (!updatedAddress) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Address deleted successfully",
            remainingAddresses: updatedAddress.address.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
const setDefaultAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user._id;

        await Addressbook.findOneAndUpdate(
            { userId },
            { $set: { "address.$[].isDefault": false } }
        );

        const updatedAddress = await Addressbook.findOneAndUpdate(
            { userId, "address._id": addressId },
            { $set: { "address.$.isDefault": true } },
            { new: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Default address updated successfully",
            address: updatedAddress
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
module.exports = { createAddress, getAllAddress, getByIdAddress, updateAddress, deleteAddress, setDefaultAddress }
