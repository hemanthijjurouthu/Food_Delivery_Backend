import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  const frontend_url = process.env.FRONTEND_URL;

  try {
    // Save the order to the database
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });

    await newOrder.save();

    // Clear user cart
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // Create Stripe line items
    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100, 
      },
      quantity: item.quantity,
    }));

    // Add delivery charges (e.g., ₹2.00)
    line_items.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: 200, // ₹2.00
      },
      quantity: 1,
    });

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
      metadata: {
        orderId: newOrder._id.toString(),
        userId: req.body.userId,
      },
    });

    res.json({
      success: true,
      session_url: session.url,
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.json({
      success: false,
      message: "Error while placing order",
    });
  }
};

const verifyOrder = async (req,res) => {
  const {orderId,success} = req.body;
  try {
    if(success === 'true') 
    {
      await orderModel.findByIdAndUpdate(orderId,{payment:true});
      res.json({success:true,message:"Paid"});
    }
    else
    {
      await orderModel.findByIdAndDelete(orderId);
      res.json({success:false,message:"Not Paid"});
    }
  }
  catch(error)
  {
    console.log(error);
    res.json({
      success: false,
      message: "Error"
    })
  }
}

//user orders for frontend
const userOrders = async (req,res) => {
  try {
    const orders = await orderModel.find({userId:req.body.userId});
    res.json({
      success: true,
      data: orders
    })
  }
  catch(error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error"
    })
  }
}

// listing orders for admin panel

const listOrders = async (req,res) => {
  try {
    const orders = await orderModel.find({});
    res.json({
      success: true,
      data: orders
    })
  }
  catch(error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error"
    })
  }
}

// api for updating order status
const updateStatus = async (req,res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status});
    res.json({
      success: true,
      message: "Status Updated"
    })
  }
  catch(error) {
    console.log(error);
    res.json({
      success : false,
      message : "Error"
    })
  }
}

export { placeOrder,verifyOrder,userOrders,listOrders,updateStatus };
