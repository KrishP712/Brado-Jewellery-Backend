const Wishlist = require("../model/wishlist");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// 🧩 CREATE OR ADD PRODUCT TO WISHLIST
const createWishList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    console.log(productId, "productId");

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID and Product ID are required" });
    }

    if (!ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product ID format" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (wishlist) {
      const alreadyExists = wishlist.product.some(
        (item) => item.toString() === productId.toString()
      );

      if (alreadyExists) {
        return res
          .status(200)
          .json({ success: true, message: "Product already in wishlist" });
      }

      wishlist.product.push(productId);
      await wishlist.save();

      return res
        .status(200)
        .json({ success: true, message: "Product added to wishlist" });
    } else {
      // Create new wishlist
      const newWishlist = await Wishlist.create({
        user: userId,
        product: [productId],
      });

      return res.status(200).json({
        success: true,
        message: "Wishlist created and product added",
        data: newWishlist,
      });
    }
  } catch (error) {
    console.error("Error in createWishList:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getWishList = async (req, res) => {
  try {
    const userId = req.user._id;

    const list = await Wishlist.aggregate([
      { $match: { user: new ObjectId(userId) } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "products",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "products.category",
          foreignField: "_id",
          as: "categories",
        },
      },
      {
        $lookup: {
          from: "media",
          localField: "products.image",
          foreignField: "_id",
          as: "media",
        },
      },
      {
        $project: {
          _id: 1,
          user: 1,
          product: {
            $map: {
              input: "$products",
              as: "p",
              in: {
                _id: "$$p._id",
                sku: "$$p.sku",
                slug: "$$p.slug",
                name: "$$p.name",
                title: "$$p.title",
                price: "$$p.price",
                originalPrice: "$$p.originalPrice",
                discountPrice: "$$p.discountPrice",
                discount: "$$p.discount",
                stock: "$$p.stock",
                categoryName: {
                  $arrayElemAt: ["$categories.categoryName", 0],
                },
                image: { $arrayElemAt: ["$media.media", 0] },
              },
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      data: list?.[0] || {},
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const removeList = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ message: "Invalid Product ID format" });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { product: new ObjectId(productId) } },
      { new: true }
    );

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    return res
      .status(200)
      .json({ message: "Product removed successfully", wishlist });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { createWishList, getWishList, removeList };
