import { Request, Response } from "express";
import { stripe } from "../config/stripe";
import User from "../models/user";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "Email and name are required.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User Already Exists",
        message: "A user with this email already exists.",
        data: {
          user_id: existingUser._id,
          stripe_customer_id: existingUser.stripe_customer_id,
        },
      });
    }

    const stripeCustomer = await stripe.customers.create({
      email: email.toLowerCase(),
      name: name,
      metadata: {
        source: "JobPsych API",
        created_at: new Date().toISOString(),
      },
    });

    const user = new User({
      email: email.toLowerCase(),
      name: name,
      stripe_customer_id: stripeCustomer.id,
      plan_type: "free",
      subscription_status: "inactive",
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user_id: user._id,
        email: user.email,
        name: user.name,
        stripe_customer_id: user.stripe_customer_id,
        plan_type: user.plan_type,
        subscription_status: user.subscription_status,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: "User Creation Failed",
      message: error.message || "Failed to create user",
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User Not Found",
        message: "User with the specified ID does not exist.",
      });
    }

    res.json({
      success: true,
      data: {
        user_id: user._id,
        email: user.email,
        name: user.name,
        stripe_customer_id: user.stripe_customer_id,
        plan_type: user.plan_type,
        subscription_status: user.subscription_status,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error getting user:", error);
    res.status(500).json({
      success: false,
      error: "User Retrieval Failed",
      message: error.message || "Failed to retrieve user",
    });
  }
};

export const getUserByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User Not Found",
        message: "User with the specified email does not exist.",
      });
    }

    res.json({
      success: true,
      data: {
        user_id: user._id,
        email: user.email,
        name: user.name,
        stripe_customer_id: user.stripe_customer_id,
        plan_type: user.plan_type,
        subscription_status: user.subscription_status,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error getting user by email:", error);
    res.status(500).json({
      success: false,
      error: "User Retrieval Failed",
      message: error.message || "Failed to retrieve user",
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, plan_type, subscription_status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User Not Found",
        message: "User with the specified ID does not exist.",
      });
    }

    if (name) user.name = name;
    if (plan_type) user.plan_type = plan_type;
    if (subscription_status) user.subscription_status = subscription_status;

    await user.save();

    if (name) {
      await stripe.customers.update(user.stripe_customer_id, {
        name: name,
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: {
        user_id: user._id,
        email: user.email,
        name: user.name,
        stripe_customer_id: user.stripe_customer_id,
        plan_type: user.plan_type,
        subscription_status: user.subscription_status,
        updated_at: user.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "User Update Failed",
      message: error.message || "Failed to update user",
    });
  }
};
