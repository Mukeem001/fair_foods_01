// server/routes.ts
import type { Express, Request } from "express";
import type { Server } from "http";
import { getDb, type FoodDocument, type SettingsDocument, type OrderDocument } from "./db";
import crypto from "crypto";
import type { AuthUser } from "./auth";
import { getBearerToken, verifyToken, protectUserRoute } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const db = await getDb();
  const foods = db.collection<FoodDocument>("foods");
  const settings = db.collection<SettingsDocument>("settings");
  const orders = db.collection<OrderDocument>("orders");

  const formatFood = (food: FoodDocument & { _id?: unknown }) => {
    const { _id, ...rest } = food;
    return rest;
  };

  /* =============================
     PUBLIC FOOD ENDPOINTS
  ============================== */

  app.get("/api/foods", async (_req, res) => {
    try {
      const allFoods = await foods.find({ active: true }).sort({ createdAt: -1 }).toArray();
      res.json(allFoods.map(formatFood));
    } catch (error) {
      console.error("Failed to fetch foods:", error);
      res.status(500).json({ message: "Failed to fetch foods" });
    }
  });

  app.post("/api/foods/check", async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      const result = await foods
        .find({ id: { $in: ids } })
        .project({ id: 1, active: 1, _id: 0 })
        .toArray();

      res.json(result);
    } catch (error) {
      console.error("Availability check failed:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  /* =============================
     PUBLIC SETTINGS ENDPOINTS
  ============================== */

  app.get("/api/settings", async (_req, res) => {
    try {
      const data = await settings.findOne({ name: "default" });
      res.json(data || null);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  /* =============================
     PUBLIC ORDER ENDPOINT
  ============================== */

  app.post("/api/orders", async (req, res) => {
    try {
      const { items, total, address } = req.body ?? {};

      // userId comes from JWT token
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ message: "Unauthorized" });

      const { userId } = verifyToken(token);

      const normalizedAddress = String(address ?? "").trim();

      console.log("/api/orders payload:", {
        hasItems: Array.isArray(items),
        itemsLen: Array.isArray(items) ? items.length : null,
        total,
        address: normalizedAddress,
        userId,
      });

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Invalid order data: items required" });
      }

      const normalizedItems = items
        .map((it: any) => {
          return {
            id: String(it?.id ?? ""),
            name: String(it?.name ?? ""),
            option: String(it?.option ?? it?.selectedOption ?? ""),
            qty: Number(it?.qty ?? 0),
            price: Number(it?.price ?? 0),
          };
        })
        .filter((it: any) => it.id && it.name && it.option && it.qty > 0 && it.price >= 0);

      if (normalizedItems.length === 0) {
        return res.status(400).json({ message: "Invalid order data: items invalid" });
      }

      const normalizedTotal = Number(total);
      if (!Number.isFinite(normalizedTotal) || normalizedTotal <= 0) {
        return res.status(400).json({ message: "Invalid order data: total required" });
      }

      // If client didn't send address, try to keep order saveable
      // by creating order with empty address instead of hard failing.
      const savedAddress = normalizedAddress;

      await orders.insertOne({
        id: crypto.randomUUID(),
        userId: String(userId),
        items: normalizedItems,
        total: normalizedTotal,
        address: savedAddress,
        whatsappNumber: "",
        status: "pending",
        createdAt: new Date(),
      });

      res.json({ message: "Order saved" });
    } catch (error) {
      console.error("Failed to save order:", error);
      res.status(500).json({ message: "Failed to save order" });
    }
  });

  /* =============================
     PUBLIC PROFILE ENDPOINT (MongoDB)
  ============================== */


  type UserDocument = {
    id: string;
    fullName: string;
    email: string;
    password: string;
    walletBalance: number;
    address: string;
    phone: string;
    orders: string[];
    createdAt: Date;
    avatar?: string;
  };

  const users = db.collection<UserDocument>("users");

  // ===== PROTECTED USER ROUTES (Require JWT) =====
  app.get("/api/profile", protectUserRoute, async (req, res) => {
    try {
      const userId = (req as Request & { authUser?: AuthUser }).authUser!.userId;

      const user = await users.findOne({ id: userId });
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({ user });
    } catch (e) {
      console.error("Failed to fetch profile:", e);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", protectUserRoute, async (req, res) => {
    try {
      const userId = (req as Request & { authUser?: AuthUser }).authUser!.userId;
      const { fullName, phone, address } = req.body ?? {};

      const existing = await users.findOne({ id: userId });
      if (!existing) return res.status(404).json({ message: "User not found" });

      const update: Partial<UserDocument> = {};
      if (typeof fullName === "string") update.fullName = fullName;
      if (typeof phone === "string") update.phone = phone;
      if (typeof address === "string") update.address = address;

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ message: "No valid fields" });
      }

      await users.updateOne({ id: userId }, { $set: update });
      const saved = await users.findOne({ id: userId });

      res.json({ user: saved });
    } catch (e) {
      console.error("Failed to update profile:", e);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  return httpServer;
}
