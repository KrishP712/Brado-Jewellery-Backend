// controllers/orderController.js
const Order = require("../model/order");
const Coupon = require("../model/coupon");
const Product = require("../model/product");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;


const placeOrderController = async (req, res) => {
    try {
        const userId = req.user._id;

        const { items, couponcode, paymentMethod, shippingAddress, billingAddress, isBillingAddressSame } = req.body;
        // ✅ Validation
        if (!items?.length)
            return res.status(400).json({ success: false, message: "No items found in order." });

        if (!shippingAddress?.contactPersonName || !shippingAddress?.contactNo)
            return res.status(400).json({ success: false, message: "Valid shipping address required." });

        // ✅ Fetch product details (with offers)
        const productIds = items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } })
            .populate({
                path: "offer",
                match: { active: true }
            });
        if (products.length !== items.length)
            return res.status(400).json({ success: false, message: "Some products not found." });

        // ✅ Initialize totals
        let total_mrp = 0;
        let total_product_discount = 0;
        let total_offer_discount = 0;
        let total_quantity = 0;

        // ✅ Item calculations
        const updatedItems = items.map(item => {
            const product = products.find(p => p._id.toString() === item.productId.toString());
            if (!product) throw new Error(`Product ${item.productId} not found`);
            if (product.stock < item.quantity)
                throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
            const mrp = product.originalPrice;
            const discountPrice = product.price;
            const quantity = item.quantity;

            // --- Calculations ---
            const itemMRP = mrp * quantity;
            const itemDiscount = (mrp - discountPrice) * quantity;
            const priceAfterDiscount = discountPrice * quantity;

            // ✅ Offer handling
            let itemOfferDiscount = 0;
            let applicableOffer = null;

            // Normalize offers (handle both single object and array)
            const offers = Array.isArray(product.offer)
                ? product.offer
                : product.offer
                    ? [product.offer]
                    : [];

            if (offers.length > 0) {
                // Filter valid offers
                const validOffers = offers.filter(
                    offer =>
                        offer.active &&
                        quantity >= offer.minQuantity &&
                        new Date(offer.startDate) <= new Date() &&
                        new Date(offer.endDate) >= new Date()
                );

                if (validOffers.length > 0) {
                    applicableOffer = validOffers.reduce((best, current) =>
                        current.minQuantity > best.minQuantity ? current : best
                    );

                    // Calculate discount
                    if (applicableOffer.offerType === "percentage") {
                        itemOfferDiscount = (priceAfterDiscount * applicableOffer.value) / 100;
                    } else if (applicableOffer.offerType === "fixed") {
                        const sets = Math.floor(quantity / applicableOffer.minQuantity);
                        itemOfferDiscount = applicableOffer.value * sets;
                    }
                }
            }

            // Round off
            itemOfferDiscount = Math.round(itemOfferDiscount * 100) / 100;


            // ✅ Final item price
            const finalPrice = priceAfterDiscount - itemOfferDiscount;

            // ✅ Update totals
            total_mrp += itemMRP;
            total_product_discount += itemDiscount;
            total_offer_discount += itemOfferDiscount;
            total_quantity += quantity;

            return {
                productId: product._id,
                quantity,
                price: discountPrice,
                mrp,
                totalPrice: Math.round(finalPrice * 100) / 100,
                sku: product.slug || `SKU-${product._id}`,
                itemMRP: Math.round(itemMRP * 100) / 100,
                itemDiscount: Math.round(itemDiscount * 100) / 100,
                itemOfferDiscount,
                applicableOffer: applicableOffer
                    ? {
                        offerId: applicableOffer._id,
                        offerType: applicableOffer.offerType,
                        value: applicableOffer.value,
                        minQuantity: applicableOffer.minQuantity,
                    }
                    : null,
            };
        });

        // ✅ Round totals
        total_mrp = Math.round(total_mrp * 100) / 100;
        total_product_discount = Math.round(total_product_discount * 100) / 100;
        total_offer_discount = Math.round(total_offer_discount * 100) / 100;

        // ✅ Derived totals
        const total_product_price = Math.round((total_mrp - total_product_discount) * 100) / 100;

        // ✅ Coupon Handling
        let couponDiscount = 0;
        let appliedCouponId = null;

        if (couponcode) {
            const coupon = await Coupon.findOne({ _id: couponcode, isactive: true });
            if (!coupon) return res.status(400).json({ success: false, message: "Invalid coupon code." });

            if (coupon.startdate > new Date() || coupon.enddate < new Date())
                return res.status(400).json({ success: false, message: "Coupon expired or inactive." });

            if (coupon.minorderamount && total_product_price < coupon.minorderamount)
                return res.status(400).json({
                    success: false,
                    message: `Minimum order value ₹${coupon.minorderamount} required.`,
                });

            if (coupon.discountType === "percentage") {
                // couponDiscount = (total_product_price * coupon.discountpercentageValue) / 100;
                const baseForCoupon = total_product_price - total_offer_discount;
                couponDiscount = (baseForCoupon * coupon.discountpercentageValue) / 100;
                if (coupon.maxDiscountAmount) {
                    couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
                }
            } else if (coupon.discountType === "fixed") {
                couponDiscount = coupon.discountfixedValue;
            }

            couponDiscount = Math.round(couponDiscount * 100) / 100;
            appliedCouponId = coupon._id;
            coupon.usedCount = (coupon.usedCount || 0) + 1;
            await coupon.save();
        }

        // ✅ Shipping & final calculations
        const shippingFee = 50;
        const codCharge = paymentMethod === "COD" ? 25 : 0
        const total_savings = Math.round(
            (total_product_discount + total_offer_discount + couponDiscount) * 100
        ) / 100;

        const net_payable = Math.round(
            (total_product_price - total_offer_discount - couponDiscount + shippingFee + codCharge) * 100
        ) / 100;

        const subtotal = total_product_price;
        const totalAmount = net_payable;

        // ✅ Order ID generator
        const generateOrderId = () => {
            const datePart = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            return `ORD-${datePart}-${randomPart}`;
        };

        console.log("=== FINAL ORDER CALCULATION BREAKDOWN ===");
        console.log("Total Quantity:", total_quantity);
        console.log("Total MRP:", total_mrp);
        console.log("Total Product Discount:", total_product_discount);
        console.log("Total Product Price:", total_product_price);
        console.log("Total Offer Discount:", total_offer_discount);
        console.log("Coupon Discount:", couponDiscount);
        console.log("Total Savings:", total_savings);
        console.log("Shipping Fee:", shippingFee);
        console.log("Net Payable:", net_payable);
        console.log("==========================================");
        // ✅ Create order
        const newOrder = await Order.create({
            userId,
            orderId: generateOrderId(),
            couponcode: appliedCouponId,
            items: updatedItems,
            total_quantity,
            total_mrp,
            total_product_discount,
            total_product_price,
            total_offer_discount,
            couponDiscount,
            total_savings,
            shippingFee,
            net_payable,
            subtotal,
            totalAmount,
            paymentMethod,
            shippingAddress,
            billingAddress: isBillingAddressSame ? shippingAddress : billingAddress,
            isBillingAddressSame,
            statusTimeline: [
                { title: "Order Placed", status: "completed", timestamp: new Date() },
                { title: "Order Confirmed", status: "pending", timestamp: null },
                { title: "Packed", status: "pending", timestamp: null },
                { title: "Shipped", status: "pending", timestamp: null },
                { title: "Out for Delivery", status: "pending", timestamp: null },
                { title: "Delivered", status: "pending", timestamp: null },
                { title: "Cancelled", status: "pending", timestamp: null },
            ],
        });

        // ✅ Reduce product stock
        await Promise.all(
            updatedItems.map(item =>
                Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
            )
        );

        // ✅ Populate order for response
        const order = await Order.findById(newOrder._id)
            .populate("userId", "name email phone")
            .populate("items.productId", "name slug image price discountPrice")
            .populate("couponcode", "code discountType discountpercentageValue discountfixedValue");

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order,
        });
    } catch (error) {
        console.error("Order creation error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const total = await Order.countDocuments();
        const userId = req.user._id;
        const orders = await Order.aggregate([
            {
                $match: {
                    userId: userId
                }
            },
            // === 1. Lookup coupon details ===
            {
                $lookup: {
                    from: "coupons",
                    localField: "couponcode",
                    foreignField: "_id",
                    as: "couponDetails"
                }
            },

            // === 2. Unwind items ===
            {
                $unwind: {
                    path: "$items",
                    preserveNullAndEmptyArrays: true
                }
            },

            // === 3. Lookup product details ===
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productDetails",
                    pipeline: [
                        {
                            $lookup: {
                                from: "media",
                                localField: "image",
                                foreignField: "_id",
                                as: "imageDetails",
                            }
                        },
                        {
                            $lookup: {
                                from: "offers",
                                localField: "offer",
                                foreignField: "_id",
                                as: "offerDetails"
                            }
                        }
                    ]
                }
            },

            // === 4. Unwind product details ===
            {
                $unwind: {
                    path: "$productDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    productDetails: { $ne: null }
                }
            },

            // === 5. Compute product and offer discount per item ===
            {
                $addFields: {
                    "items.title": "$productDetails.title",
                    "items.slug": "$productDetails.slug",
                    "items.mrp": "$productDetails.price",
                    "items.discountPrice": "$productDetails.discountPrice",
                    "items.discount": "$productDetails.discount",
                    "items.image": { $arrayElemAt: ["$productDetails.imageDetails.media", 0] },
                    "items.offerDetails": "$productDetails.offerDetails",
                    "items.itemMRP": { $multiply: ["$productDetails.price", "$items.quantity"] },
                    "items.itemDiscount": {
                        $multiply: [
                            { $subtract: ["$productDetails.price", "$productDetails.discountPrice"] },
                            "$items.quantity"
                        ]
                    },
                    "items.applicableOffer": {
                        $let: {
                            vars: {
                                validOffers: {
                                    $filter: {
                                        input: "$productDetails.offerDetails",
                                        as: "offer",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$offer.active", true] },
                                                { $gte: ["$items.quantity", "$$offer.minQuantity"] }
                                            ]
                                        }
                                    }
                                }
                            },
                            in: {
                                $arrayElemAt: [
                                    {
                                        $sortArray: {
                                            input: "$$validOffers",
                                            sortBy: { minQuantity: -1 }
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    }
                }
            },

            // === 6. Calculate offer discount ===
            {
                $addFields: {
                    "items.itemOfferDiscount": {
                        $cond: {
                            if: { $ne: ["$items.applicableOffer", null] },
                            then: {
                                $cond: {
                                    if: { $eq: ["$items.applicableOffer.offerType", "percentage"] },
                                    then: {
                                        $multiply: [
                                            { $multiply: ["$items.discountPrice", "$items.quantity"] },
                                            { $divide: ["$items.applicableOffer.value", 100] }
                                        ]
                                    },
                                    else: {
                                        $multiply: [
                                            "$items.applicableOffer.value",
                                            {
                                                $floor: {
                                                    $divide: ["$items.quantity", "$items.applicableOffer.minQuantity"]
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            else: 0
                        }
                    }
                }
            },

            // === 7. Group back to order ===
            {
                $group: {
                    _id: "$_id",
                    userId: { $first: "$userId" },
                    orderId: { $first: "$orderId" },
                    couponDetails: { $first: { $arrayElemAt: ["$couponDetails", 0] } },
                    shippingAddress: { $first: "$shippingAddress" },
                    billingAddress: { $first: "$billingAddress" },
                    isBillingAddressSame: { $first: "$isBillingAddressSame" },
                    items: { $push: "$items" },
                    subtotal: { $first: "$subtotal" },
                    couponDiscount: { $first: "$couponDiscount" },
                    totalAmount: { $first: "$totalAmount" },
                    shippingFee: { $first: "$shippingFee" },
                    paymentMethod: { $first: "$paymentMethod" },
                    paymentStatus: { $first: "$paymentStatus" },
                    statusTimeline: { $first: "$statusTimeline" },
                    estimatedDeliveryDate: { $first: "$estimatedDeliveryDate" },
                    orderDate: { $first: "$orderDate" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },

                    // === Summaries ===
                    total_quantity: { $sum: "$items.quantity" },
                    total_mrp: { $sum: "$items.itemMRP" },
                    total_product_discount: { $sum: "$items.itemDiscount" },
                    total_offer_discount: { $sum: "$items.itemOfferDiscount" }
                }
            },

            // === 8. Add computed totals ===
            {
                $addFields: {
                    total_product_price: { $subtract: ["$total_mrp", "$total_product_discount"] },

                    // Total savings from product + offer + coupon
                    total_savings: {
                        $add: [
                            "$total_product_discount",
                            "$total_offer_discount",
                            { $ifNull: ["$couponDiscount", 0] }
                        ]
                    },

                    // ✅ Net payable = MRP - product discount - offer discount - coupon + shipping fee
                    net_payable: {
                        $add: [
                            {
                                $subtract: [
                                    "$total_mrp",
                                    { $add: ["$total_product_discount", "$total_offer_discount", { $ifNull: ["$couponDiscount", 0] }] }
                                ]
                            },
                            { $ifNull: ["$shippingFee", 0] }
                        ]
                    }
                }
            },

            // === 9. Sort latest first ===
            { $sort: { orderDate: -1 } },
            { $skip: skip },
            { $limit: limit }

        ]);

        res.status(200).json({
            success: true,
            message: "All Orders retrieved successfully",
            data: orders,
            totalOrders: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getOrderByUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.orderId;
        const orders = await Order.aggregate([
            {
                $match: {
                    userId: userId,
                    orderId: orderId
                }
            },
            // === 1. Lookup coupon details ===
            {
                $lookup: {
                    from: "coupons",
                    localField: "couponcode",
                    foreignField: "_id",
                    as: "couponDetails"
                }
            },

            // === 2. Unwind items ===
            {
                $unwind: {
                    path: "$items",
                    preserveNullAndEmptyArrays: true
                }
            },

            // === 3. Lookup product details ===
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productDetails",
                    pipeline: [
                        {
                            $lookup: {
                                from: "media",
                                localField: "image",
                                foreignField: "_id",
                                as: "imageDetails",
                            }
                        },
                        {
                            $lookup: {
                                from: "offers",
                                localField: "offer",
                                foreignField: "_id",
                                as: "offerDetails"
                            }
                        }
                    ]
                }
            },

            // === 4. Unwind product details ===
            {
                $unwind: {
                    path: "$productDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            // === 5. Compute product and offer discount per item ===
            {
                $addFields: {
                    "items.title": "$productDetails.title",
                    "items.slug": "$productDetails.slug",
                    "items.mrp": "$productDetails.price",
                    "items.discountPrice": "$productDetails.discountPrice",
                    "items.discount": "$productDetails.discount",
                    "items.image": { $arrayElemAt: ["$productDetails.imageDetails.media", 0] },
                    "items.offerDetails": "$productDetails.offerDetails",
                    "items.itemMRP": { $multiply: ["$productDetails.price", "$items.quantity"] },
                    "items.itemDiscount": {
                        $multiply: [
                            { $subtract: ["$productDetails.price", "$productDetails.discountPrice"] },
                            "$items.quantity"
                        ]
                    },
                    "items.applicableOffer": {
                        $let: {
                            vars: {
                                validOffers: {
                                    $filter: {
                                        input: "$productDetails.offerDetails",
                                        as: "offer",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$offer.active", true] },
                                                { $gte: ["$items.quantity", "$$offer.minQuantity"] }
                                            ]
                                        }
                                    }
                                }
                            },
                            in: {
                                $arrayElemAt: [
                                    {
                                        $sortArray: {
                                            input: "$$validOffers",
                                            sortBy: { minQuantity: -1 }
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    }
                }
            },

            // === 6. Calculate offer discount ===
            {
                $addFields: {
                    "items.itemOfferDiscount": {
                        $cond: {
                            if: { $ne: ["$items.applicableOffer", null] },
                            then: {
                                $cond: {
                                    if: { $eq: ["$items.applicableOffer.offerType", "percentage"] },
                                    then: {
                                        $multiply: [
                                            { $multiply: ["$items.discountPrice", "$items.quantity"] },
                                            { $divide: ["$items.applicableOffer.value", 100] }
                                        ]
                                    },
                                    else: {
                                        $multiply: [
                                            "$items.applicableOffer.value",
                                            {
                                                $floor: {
                                                    $divide: ["$items.quantity", "$items.applicableOffer.minQuantity"]
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            else: 0
                        }
                    }
                }
            },

            // === 7. Group back to order ===
            {
                $group: {
                    _id: "$_id",
                    userId: { $first: "$userId" },
                    orderId: { $first: "$orderId" },
                    couponDetails: { $first: { $arrayElemAt: ["$couponDetails", 0] } },
                    shippingAddress: { $first: "$shippingAddress" },
                    billingAddress: { $first: "$billingAddress" },
                    isBillingAddressSame: { $first: "$isBillingAddressSame" },
                    items: { $push: "$items" },
                    subtotal: { $first: "$subtotal" },
                    couponDiscount: { $first: "$couponDiscount" },
                    totalAmount: { $first: "$totalAmount" },
                    shippingFee: { $first: "$shippingFee" },
                    paymentMethod: { $first: "$paymentMethod" },
                    paymentStatus: { $first: "$paymentStatus" },
                    statusTimeline: { $first: "$statusTimeline" },
                    estimatedDeliveryDate: { $first: "$estimatedDeliveryDate" },
                    orderDate: { $first: "$orderDate" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },

                    // === Summaries ===
                    total_quantity: { $sum: "$items.quantity" },
                    total_mrp: { $sum: "$items.itemMRP" },
                    total_product_discount: { $sum: "$items.itemDiscount" },
                    total_offer_discount: { $sum: "$items.itemOfferDiscount" }
                }
            },

            // === 8. Add computed totals ===
            {
                $addFields: {
                    total_product_price: { $subtract: ["$total_mrp", "$total_product_discount"] },

                    // Total savings from product + offer + coupon
                    total_savings: {
                        $add: [
                            "$total_product_discount",
                            "$total_offer_discount",
                            { $ifNull: ["$couponDiscount", 0] }
                        ]
                    },

                    // ✅ Net payable = MRP - product discount - offer discount - coupon + shipping fee
                    net_payable: {
                        $add: [
                            {
                                $subtract: [
                                    "$total_mrp",
                                    { $add: ["$total_product_discount", "$total_offer_discount", { $ifNull: ["$couponDiscount", 0] }] }
                                ]
                            },
                            { $ifNull: ["$shippingFee", 0] }
                        ]
                    }
                }
            },

            // === 9. Sort latest first ===
            { $sort: { orderDate: -1 } }
        ]);
        res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


const updateOrder = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        if (!orderId || !status) {
            return res
                .status(400)
                .json({ success: false, message: "Order id and status is required" });
        }

        // Try to update existing status
        let updateorder = await Order.findOneAndUpdate(
            { orderId, "statusTimeline.title": status },
            {
                $set: {
                    "statusTimeline.$[timeline].status": "completed",
                    "statusTimeline.$[timeline].timestamp": new Date(),
                },
            },
            { arrayFilters: [{ "timeline.title": status }], new: true }
        );

        // If not found, add new statusTimeline entry dynamically
        if (!updateorder) {
            updateorder = await Order.findOneAndUpdate(
                { orderId },
                {
                    $push: {
                        statusTimeline: {
                            title: status,
                            status: "completed",
                            timestamp: new Date(),
                        },
                    },
                },
                { new: true }
            );
        }
        res.status(200).json({ success: true, message: "Order updated successfully", updateorder });
    } catch (error) {
        console.error("Order update error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



module.exports = {
    placeOrderController, getOrders, getOrderByUser, updateOrder
};