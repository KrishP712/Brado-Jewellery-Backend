const Cart = require("../model/cart");
const Coupon = require("../model/coupon");
// const Product = require("../model/Product.model");
const mongoose = require("mongoose");
const Product = require("../model/product");
const ObjectId = require("mongoose").Types.ObjectId;

const createCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;
    console.log(userId, productId, quantity);

    if (!productId) {
      return res.status(400).json({ success: false, error: "Product is required" });
    }

    const ProductQun = await Product.findById(productId);
    if (!ProductQun) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    let userCart = await Cart.findOne({ userId });
    if (userCart) {
      const existingProduct = userCart.products.find(
        (item) => item.productId && item.productId.toString() === productId
      );

      if (existingProduct) {
        const newTotalQuantity = existingProduct.quantity + quantity;
        const finalQuantity = Math.min(newTotalQuantity, ProductQun.stock);
        const quantityToAdd = finalQuantity - existingProduct.quantity;

        if (quantityToAdd > 0) {
          await Cart.findOneAndUpdate(
            { userId, "products.productId": productId },
            { $inc: { "products.$.quantity": quantityToAdd } },
            { new: true }
          );
        }

        return res.status(200).json({ success: true, message: "Product quantity updated successfully" });
      } else {
        // Limit quantity to stock for new product
        const finalQuantity = Math.min(quantity, ProductQun.stock);

        await Cart.findOneAndUpdate(
          { userId },
          { $push: { products: { productId, quantity: finalQuantity } } },
          { new: true }
        );
        return res.status(200).json({ success: true, message: "Product added to cart successfully" });
      }
    }

    // ✅ If no cart exists yet
    const finalQuantity = Math.min(quantity, ProductQun.stock);

    await Cart.create({
      userId,
      products: [{ productId, quantity: finalQuantity }],
    });

    return res.status(201).json({ success: true, message: "Cart created and product added successfully" });

  } catch (error) {
    console.error("Cart Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


const getAllCart = async (req, res) => {
  try {
    const { couponcode } = req.query;
    const cart = await Cart.aggregate([
      {
        $unwind: "$products"
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
          pipeline: [
            // --- Get product image ---
            {
              $lookup: {
                from: "media",
                localField: "image",
                foreignField: "_id",
                as: "imageDetails"
              }
            },

            // --- Get related offers ---
            {
              $lookup: {
                from: "offers",
                localField: "offer",
                foreignField: "_id",
                as: "offers"
              }
            },

            {
              $addFields: {
                offers: {
                  $filter: {
                    input: "$offers",
                    as: "off",
                    cond: {
                      $and: [
                        { $eq: ["$$off.active", true] },
                        { $lte: ["$$off.startDate", new Date()] },
                        { $gte: ["$$off.endDate", new Date()] }
                      ]
                    }
                  }
                }
              }
            },
            // --- Add a simple 'offer' field with title (if available) ---
            {
              $addFields: {
                offer: {
                  $cond: [
                    { $gt: [{ $size: "$offers" }, 0] },
                    { $arrayElemAt: ["$offers.title", 0] },
                    null
                  ]
                }
              }
            },

            // --- Final product projection ---
            {
              $project: {
                _id: 1,
                title: 1,
                sku: 1,
                slug: 1,
                stock: 1,
                originalPrice: 1,
                price: 1,
                discount: 1,
                image: { $arrayElemAt: ["$imageDetails.media", 0] },
                offer: 1,       // Just the offer title
                offers: 1       // Full offer object array
              }
            }
          ]
        }
      },
      { $unwind: "$productDetails" },

      // --- Add quantity and basic fields ---
      {
        $addFields: {
          "productDetails.quantity": "$products.quantity",
          "productDetails.cartItemId": "$products._id"
        }
      },

      // --- Base Price Calculations ---
      {
        $addFields: {
          "productDetails.itemMRP": {
            $multiply: ["$productDetails.originalPrice", "$productDetails.quantity"]
          },
          "productDetails.itemPrice": {
            $multiply: ["$productDetails.price", "$productDetails.quantity"]
          },
          "productDetails.itemDiscount": {
            $multiply: [
              { $subtract: ["$productDetails.originalPrice", "$productDetails.price"] },
              "$productDetails.quantity"
            ]
          }
        }
      },

      // --- Offer Discount Calculation ---
      {
        $addFields: {
          "productDetails.itemOfferDiscount": {
            $let: {
              vars: { offerObj: { $arrayElemAt: ["$productDetails.offers", 0] } },
              in: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ["$$offerObj.active", true] },
                      { $gte: ["$productDetails.quantity", "$$offerObj.minQuantity"] },
                      { $lte: ["$$offerObj.startDate", new Date()] },
                      { $gte: ["$$offerObj.endDate", new Date()] }
                    ]
                  },
                  then: {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: ["$$offerObj.offerType", "percentage"] },
                          then: {
                            $round: [
                              {
                                $multiply: [
                                  "$productDetails.itemPrice",
                                  { $divide: ["$$offerObj.value", 100] }
                                ]
                              },
                              2
                            ]
                          }
                        },
                        {
                          case: { $eq: ["$$offerObj.offerType", "fixed"] },
                          then: "$$offerObj.value"
                        }
                      ],
                      default: 0
                    }
                  },
                  else: 0
                }
              }
            }
          }
        }
      },

      // --- Final item total ---
      {
        $addFields: {
          "productDetails.itemTotal": {
            $subtract: [
              "$productDetails.itemPrice",
              { $ifNull: ["$productDetails.itemOfferDiscount", 0] }
            ]
          }
        }
      },

      // --- Group back to cart structure ---
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          products: {
            $push: {
              _id: "$productDetails.cartItemId",
              productId: "$productDetails._id",
              title: "$productDetails.title",
              sku: "$productDetails.sku",
              slug: "$productDetails.slug",
              stock: "$productDetails.stock",
              originalPrice: "$productDetails.originalPrice",
              price: "$productDetails.price",
              discount: "$productDetails.discount",
              image: "$productDetails.image",
              offer: "$productDetails.offer",   // ✅ Offer title
              offers: "$productDetails.offers", // ✅ Full offer details
              quantity: "$productDetails.quantity",
              itemMRP: "$productDetails.itemMRP",
              itemPrice: "$productDetails.itemPrice",
              itemDiscount: "$productDetails.itemDiscount",
              itemOfferDiscount: "$productDetails.itemOfferDiscount",
              itemTotal: "$productDetails.itemTotal"
            }
          },
          total_quantity: { $sum: "$productDetails.quantity" },
          total_mrp_amount: { $sum: "$productDetails.itemMRP" },
          total_product_price: { $sum: "$productDetails.itemPrice" },
          total_sale_discount: { $sum: "$productDetails.itemDiscount" },
          total_offer_discount: { $sum: "$productDetails.itemOfferDiscount" }
        }
      },

      // --- Final total calculations ---
      {
        $addFields: {
          total_amount: {
            $subtract: [
              "$total_product_price",
              { $ifNull: ["$total_offer_discount", 0] }
            ]
          }
        }
      },

      // --- Clean output ---
      {
        $project: {
          _id: 1,
          userId: 1,
          products: 1,
          total_quantity: 1,
          total_mrp_amount: { $round: ["$total_mrp_amount", 2] },
          total_product_price: { $round: ["$total_product_price", 2] },
          total_sale_discount: { $round: ["$total_sale_discount", 2] },
          total_offer_discount: { $round: ["$total_offer_discount", 2] },
          total_amount: { $round: ["$total_amount", 2] }
        }
      }
    ]);

    if (!cart || cart.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: [],
        coupon: null
      });
    }

    let appliedCoupon = null;
    let couponDiscount = 0;
    let grandTotal = cart[0].total_amount;

    // Apply coupon if code provided
    if (couponcode) {
      const coupon = await Coupon.findOne({
        code: couponcode.toUpperCase(),
        isactive: true
      });
      console.log("Coupon found:", coupon);
      if (!coupon) {
        return res.status(200).json({
          success: false,
          message: "Invalid coupon code",
          data: cart,
          coupon: null
        });
      }

      const now = new Date();
      if (now < coupon.startdate || now > coupon.enddate) {
        return res.status(200).json({
          success: false,
          message: "Coupon expired or not yet active",
          data: cart,
          coupon: null
        });
      }

      if (coupon.usageLimit <= 0) {
        return res.status(200).json({
          success: false,
          message: "Coupon usage limit reached",
          data: cart,
          coupon: null
        });
      }

      if (cart[0].total_amount < coupon.minorderamount) {
        return res.status(200).json({
          success: false,
          message: `Minimum order amount should be ₹${coupon.minorderamount} to use this coupon`,
          data: cart,
          coupon: null
        });
      }

      // Calculate discount
      if (coupon.discountType === "percentage") {
        couponDiscount = (cart[0].total_amount * coupon.discountpercentageValue) / 100;
      } else if (coupon.discountType === "fixed") {
        couponDiscount = coupon.discountfixedValue;
      }

      // Ensure discount doesn't exceed total
      couponDiscount = Math.min(couponDiscount, cart[0].total_amount);
      couponDiscount = Math.round(couponDiscount * 100) / 100;
      grandTotal = cart[0].total_amount - couponDiscount;

      appliedCoupon = {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountType === "percentage"
          ? `${coupon.discountpercentageValue}%`
          : `${coupon.discountfixedValue}%`,
        couponDiscount: couponDiscount
      }

    }

    // Add coupon info to response and update total_amount
    const cartData = cart[0];
    cartData.coupon_discount = couponDiscount;
    cartData.total_amount = Math.round(grandTotal * 100) / 100;

    res.status(200).json({
      success: true,
      message: appliedCoupon ? "Coupon applied successfully" : "Cart fetched successfully",
      data: [cartData],
      coupon: appliedCoupon
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    // Validate inputs
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required"
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
      });
    }
    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Update the quantity using arrayFilters
    const updatedCart = await Cart.findOneAndUpdate(
      {
        userId: userId,
        "products.product": productId
      },
      {
        $set: { "products.$.quantity": quantity }
      },
      {
        new: true
      }
    );

    if (!updatedCart) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart"
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: updatedCart
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: error.message
    });
  }
};

const increaseCart = async (req, res) => {
  try {
    const { productId } = req.body
    const userId = new ObjectId(req.user._id);
    const productsId = new ObjectId(productId);
    const cart = await Cart.findOneAndUpdate({ userId: userId, "products.productId": productsId }, { $inc: { "products.$.quantity": 1 } }, { new: true })
    if (cart) { return res.status(200).json({ success: true, message: "Product added to cart", cart }) }
    return res.status(404).json(
      { success: false, message: "Product not found" })
  } catch (error) { res.status(500).json({ success: false, message: error.message }) }
}
const decreaseProduct = async (req, res) => {
  try {
    const { productId } = req.body
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user, "products.productId": productId },
      { $inc: { "products.$.quantity": -1 } },
      { new: true })
    console.log(cart, "cart")
    if (cart) { return res.status(200).json({ success: true, message: "Product decrease to cart", cart }) }
    return res.status(404).json(
      { success: false, message: "Product not found" })
  } catch (error) { res.status(500).json({ success: false, message: error.message }) }
}
const removeCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = new ObjectId(req.user._id);
    const productsId = new ObjectId(productId);
    console.log("🧠 userId:", userId);
    console.log("🧠 productId:", productId);
    const cart = await Cart.findOneAndUpdate({ userId: userId, "products.productId": productsId },
      { $pull: { products: { productId: productsId } } },
      { new: true }); if (!cart) {
        console.log("❌ No matching cart or product found");
        return res.status(404).json({ success: false, message: "Product not found" });
      }
    console.log("✅ Updated Cart:", cart);
    return res.status(200).json({ success: true, message: "Product removed from cart", cart });
  } catch (error) { console.error("❌ removeCart Error:", error); res.status(500).json({ success: false, message: error.message }); }
};


module.exports = {
  createCart,
  getAllCart,
  removeCart,
  increaseCart,
  decreaseProduct,
  updateCart
};