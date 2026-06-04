import type { Express, Request } from "express";
import type { Server } from "http";
import { getDb, type AddressDocument } from "./db";
import type { AuthUser } from "./auth";
import { protectUserRoute } from "./auth";
import crypto from "crypto";

export async function registerAddressRoutes(httpServer: Server, app: Express): Promise<Server> {
  const db = await getDb();
  const addresses = db.collection<AddressDocument>("addresses");

  // ===== PROTECTED ADDRESS ROUTES (Require JWT) =====
  
  // POST /api/profile/addresses
  app.post("/api/profile/addresses", protectUserRoute, async (req, res) => {
    try {
      const userId = (req as Request & { authUser?: AuthUser }).authUser!.userId;
      const { name, phone, house, area, city, pincode, isDefault } = req.body ?? {};

      if (!name || !phone || !house || !area || !city || !pincode) {
        return res.status(400).json({ message: "Invalid address data" });
      }

      const shouldBeDefault = Boolean(isDefault);

      if (shouldBeDefault) {
        await addresses.updateMany(
          { userId },
          { $set: { isDefault: false } }
        );
      }

      const newAddress: AddressDocument = {
        id: crypto.randomUUID(),
        userId,
        name,
        phone,
        house,
        area,
        city,
        pincode,
        isDefault: shouldBeDefault,
        createdAt: new Date(),
      };

      await addresses.insertOne(newAddress);

      res.json({ address: newAddress });
    } catch (e) {
      console.error("Failed to create address", e);
      res.status(500).json({ message: "Failed to create address" });
    }
  });

  // GET /api/profile/addresses
  app.get("/api/profile/addresses", protectUserRoute, async (req, res) => {
    try {
      const userId = (req as Request & { authUser?: AuthUser }).authUser!.userId;

      const list = await addresses
        .find({ userId })
        .sort({ isDefault: -1, createdAt: -1 })
        .toArray();

      res.json({ addresses: list });
    } catch (e) {
      console.error("Failed to fetch addresses", e);
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });

  // DELETE /api/profile/addresses/:id
  app.delete("/api/profile/addresses/:id", protectUserRoute, async (req, res) => {
    try {
      const userId = (req as Request & { authUser?: AuthUser }).authUser!.userId;
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: "id required" });

      const existing = await addresses.findOne({ id });
      if (!existing) return res.status(404).json({ message: "Address not found" });

      // Ensure user owns this address
      if (existing.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: Cannot delete another user's address" });
      }

      await addresses.deleteOne({ id });

      // If deleted address was default, pick the newest one as new default
      if (existing.isDefault) {
        const next = await addresses
          .find({ userId })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray();

        if (next[0]) {
          await addresses.updateOne({ id: next[0].id }, { $set: { isDefault: true } });
        }
      }

      res.json({ message: "Address deleted" });
    } catch (e) {
      console.error("Failed to delete address", e);
      res.status(500).json({ message: "Failed to delete address" });
    }
  });

  return httpServer;
}

