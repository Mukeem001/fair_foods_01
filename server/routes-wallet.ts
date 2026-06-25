import type { Express, Request } from "express";
import type { Server } from "http";
import { getDb, type WalletRequestDocument } from "./db";
import type { AuthUser } from "./auth";
import { protectUserRoute } from "./auth";
import crypto from "crypto";

export async function registerWalletRoutes(httpServer: Server, app: Express): Promise<Server> {
  const db = await getDb();

  // ===== USER ROUTES (Require JWT) =====

  // POST /api/profile/wallet-requests - Create wallet top-up request
  app.post("/api/profile/wallet-requests", protectUserRoute, async (req, res) => {
    try {
      const userId = (req as Request & { authUser?: AuthUser }).authUser!.userId;
      const { amount } = req.body ?? {};

      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (amount < 10) {
        return res.status(400).json({ message: "Minimum amount is ₹10" });
      }

      const walletRequests = db.collection<WalletRequestDocument>("walletRequests");

      const newRequest: WalletRequestDocument = {
        id: crypto.randomUUID(),
        userId,
        amount,
        status: "pending",
        createdAt: new Date(),
      };

      await walletRequests.insertOne(newRequest);

      res.json({ 
        request: newRequest,
        message: `Wallet request created for ₹${amount}. Waiting for admin approval.` 
      });
    } catch (e) {
      console.error("Failed to create wallet request:", e);
      res.status(500).json({ message: "Failed to create wallet request" });
    }
  });

  // GET /api/profile/wallet-requests - Get user's wallet requests
  app.get("/api/profile/wallet-requests", protectUserRoute, async (req, res) => {
    try {
      const userId = (req as Request & { authUser?: AuthUser }).authUser!.userId;
      const walletRequests = db.collection<WalletRequestDocument>("walletRequests");

      const list = await walletRequests
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

      res.json({ requests: list });
    } catch (e) {
      console.error("Failed to fetch wallet requests:", e);
      res.status(500).json({ message: "Failed to fetch wallet requests" });
    }
  });

  // ===== ADMIN ROUTES (Require Admin Token) =====

  // GET /api/admin/wallet-requests - Get all pending wallet requests
  app.get("/api/admin/wallet-requests", async (req, res) => {
    try {
      const walletRequests = db.collection<WalletRequestDocument>("walletRequests");
      const users = db.collection<any>("users");

      const list = await walletRequests
        .find({ status: "pending" })
        .sort({ createdAt: -1 })
        .toArray();

      // Enrich with user details
      const enriched = await Promise.all(list.map(async (req: WalletRequestDocument) => {
        const user = await users.findOne({ id: req.userId });
        return {
          ...req,
          userName: user?.fullName || "Unknown",
          userEmail: user?.email || "",
          userPhone: user?.phone || "",
        };
      }));

      res.json({ requests: enriched });
    } catch (e) {
      console.error("Failed to fetch wallet requests:", e);
      res.status(500).json({ message: "Failed to fetch wallet requests" });
    }
  });

  // PATCH /api/admin/wallet-requests/:id/approve - Approve wallet request
  app.patch("/api/admin/wallet-requests/:id/approve", async (req, res) => {
    try {
      const requestId = req.params.id;
      const walletRequests = db.collection<WalletRequestDocument>("walletRequests");
      const users = db.collection<any>("users");

      const walletReq = await walletRequests.findOne({ id: requestId });
      if (!walletReq) {
        return res.status(404).json({ message: "Wallet request not found" });
      }

      if (walletReq.status !== "pending") {
        return res.status(400).json({ message: "Request is already processed" });
      }

      // Get user and update wallet balance
      const user = await users.findOne({ id: walletReq.userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newBalance = (user.walletBalance ?? 0) + walletReq.amount;

      // Update wallet balance
      await users.updateOne({ id: walletReq.userId }, { $set: { walletBalance: newBalance } });

      // Update request status
      await walletRequests.updateOne(
        { id: requestId },
        { $set: { status: "approved", approvedAt: new Date() } }
      );

      const updated = await walletRequests.findOne({ id: requestId });
      const updatedUser = await users.findOne({ id: walletReq.userId });

      res.json({ 
        request: updated,
        user: updatedUser,
        message: `₹${walletReq.amount} approved and added to wallet` 
      });
    } catch (e) {
      console.error("Failed to approve wallet request:", e);
      res.status(500).json({ message: "Failed to approve wallet request" });
    }
  });

  // PATCH /api/admin/wallet-requests/:id/reject - Reject wallet request
  app.patch("/api/admin/wallet-requests/:id/reject", async (req, res) => {
    try {
      const requestId = req.params.id;
      const { rejectReason } = req.body ?? {};
      const walletRequests = db.collection<WalletRequestDocument>("walletRequests");

      const walletReq = await walletRequests.findOne({ id: requestId });
      if (!walletReq) {
        return res.status(404).json({ message: "Wallet request not found" });
      }

      if (walletReq.status !== "pending") {
        return res.status(400).json({ message: "Request is already processed" });
      }

      // Update request status
      await walletRequests.updateOne(
        { id: requestId },
        { 
          $set: { 
            status: "rejected", 
            rejectReason: rejectReason || "Admin rejected",
            rejectedAt: new Date() 
          } 
        }
      );

      const updated = await walletRequests.findOne({ id: requestId });

      res.json({ 
        request: updated,
        message: `Wallet request rejected` 
      });
    } catch (e) {
      console.error("Failed to reject wallet request:", e);
      res.status(500).json({ message: "Failed to reject wallet request" });
    }
  });

  return httpServer;
}
