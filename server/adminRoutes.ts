import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { getDb, type FoodDocument, type OrderDocument } from "./db";
import { getBearerToken, verifyToken } from "./auth";
import crypto from "crypto";

const ADMIN_KEY = process.env.ADMIN_KEY ?? "admin123";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Allow either the pre-shared ADMIN_KEY (via x-admin-key or Authorization)
  console.log('[requireAdmin] called for', req.method, req.originalUrl);
  // or a valid Bearer JWT for the admin user.
  const adminKeyHeader = String(req.headers["x-admin-key"] ?? "");
  const authHeader = String(req.headers["authorization"] ?? "");

  // Direct admin key matches
  if (adminKeyHeader === ADMIN_KEY) return next();
  if (authHeader === ADMIN_KEY) return next();

  // Support legacy `admin-token` header carrying a Bearer JWT (sent by frontend)
  const adminTokenHeader = String(req.headers["admin-token"] ?? "");
  console.log('[requireAdmin] headers:', { adminKeyHeader, authHeader, adminTokenHeader });

  // Support passing ADMIN_KEY directly via `admin-token` as well
  if (adminTokenHeader && adminTokenHeader === ADMIN_KEY) return next();

  // Otherwise treat admin-token as legacy JWT
  if (adminTokenHeader) {
    try {
      const authUser = verifyToken(adminTokenHeader as string);
      if (authUser && String(authUser.userId) === "admin") return next();
    } catch (e) {
      // fall through
    }
  }


  // Use shared extraction logic to accept token from Authorization header, query, or cookies
  try {
    const token = getBearerToken(req);
    console.log('[requireAdmin] extracted token length=', token ? String(token).length : 0);
    if (token) {
      const authUser = verifyToken(token as string);
      console.log('[requireAdmin] token verify result:', authUser);
      if (authUser && String(authUser.userId) === 'admin') return next();
    }
  } catch (e) {
    console.log('[requireAdmin] token verify failed', String(e));
  }

  return res.status(401).json({ message: "Unauthorized" });
}

const formatFood = (food: FoodDocument & { _id?: unknown }) => {
  const { _id, ...rest } = food;
  return rest;
};

export async function registerAdminRoutes(httpServer: Server, app: Express): Promise<Server> {
  const db = await getDb();
  const foods = db.collection<FoodDocument>("foods");
  const settings = db.collection<any>("settings");
  const orders = db.collection<OrderDocument>("orders");
  const users = db.collection<any>("users");

  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { password } = req.body ?? {};

      // NOTE: This endpoint expects ADMIN_KEY as "password".
      // Frontend code may send either `ADMIN_KEY` or the legacy `ADMIN_PASS`.
      // Support both for compatibility.
      const expected = process.env.ADMIN_KEY ?? ADMIN_KEY;
      const legacyPass = process.env.ADMIN_PASS ?? null;

      if (password !== expected && legacyPass && password !== legacyPass) {
        console.log("[admin/login] invalid password. expected:", expected, "got:", password);
        return res.status(401).json({ message: "Invalid password" });
      }

      // If authUser/token is required by frontend, return a JWT.
      // Current backend uses `requireAdmin` which verifies tokens with `verifyToken`.
      // Reuse existing verifyToken/signToken logic from ./auth.
      const { signToken } = await import("./auth");
      const token = signToken("admin");

      // Frontend usually stores token under localStorage key "token".
      return res.json({ message: "ok", token });
    } catch (e) {
      console.error("[admin/login] failed", e);
      return res.status(500).json({ message: "Login failed" });
    }
  });


  app.use("/api/admin", requireAdmin);

  app.get("/api/admin/foods", async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit || 10)));

    const total = await foods.countDocuments({}).catch(() => 0);
    const docs = await foods
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const foodsPage = Array.isArray(docs) ? docs.map(formatFood) : [];

    return res.json({ foods: foodsPage, pagination: { page, limit, total } });
  });


  app.post("/api/admin/foods", async (req: Request, res: Response) => {
    try {
      const { name, img, category, options, active } = req.body;

      if (!name || !img || !category || !options?.length) {
        return res.status(400).json({ message: "Invalid data" });
      }

      const normalizedCategory = String(category).trim();
      const normalizedOptions = (Array.isArray(options) ? options : [])
        .map((o: any) => ({
          name: String(o?.name ?? "").trim(),
          price: Number(o?.price ?? 0),
        }))
        .filter((o: any) => o.name && Number.isFinite(o.price));

      if (!normalizedOptions.length) {
        return res.status(400).json({ message: "Invalid options" });
      }

      const newFood: FoodDocument = {
        id: crypto.randomUUID(),
        name,
        img,
        category: normalizedCategory,
        options: normalizedOptions,
        active: Boolean(active),
        createdAt: new Date(),
      };


      await foods.insertOne(newFood);
      res.json({ message: "Food added" });
    } catch (error) {
      console.error("Admin add food failed:", error);
      res.status(500).json({ message: "Add failed" });
    }
  });

  app.delete("/api/admin/foods/:id", async (req: Request, res: Response) => {
    await foods.deleteOne({ id: req.params.id });
    res.json({ message: "Deleted" });
  });

  app.patch("/api/admin/foods/:id/toggle", async (req: Request, res: Response) => {
    const existing = await foods.findOne({ id: req.params.id });

    if (!existing) {
      return res.status(404).json({ message: "Food not found" });
    }

    const newActive = !existing.active;
    await foods.updateOne(
      { id: req.params.id },
      { $set: { active: newActive } }
    );

    res.json({ active: newActive });
  });

  app.get("/api/admin/settings", async (_req: Request, res: Response) => {
    const data = await settings.findOne({ name: "default" });
    res.json(data || null);
  });

  // Update settings (PUT) - accepts many fields and upiMethods array
  app.put("/api/admin/settings", async (req: Request, res: Response) => {
    try {
      const update = req.body ?? {};
      // Only allow expected fields
      const allowed: any = {};
      const keys = [
        "appName",
        "supportPhone",
        "upiId",
        "bankName",
        "bankAccountNumber",
        "bankIfscCode",
        "adminUsername",
        "adminPassword",
        "whatsappNumber",
        "upiMethods",
      ];

      keys.forEach((k) => {
        if (k in update) allowed[k] = update[k];
      });

      await settings.updateOne(
        { name: "default" },
        { $set: { ...allowed, name: "default" } },
        { upsert: true }
      );

      const saved = await settings.findOne({ name: "default" });
      res.json({ message: "Settings saved", data: saved });
    } catch (error) {
      console.error("Save settings failed:", error);
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // UPI methods CRUD under settings
  app.get("/api/admin/settings/upi-methods", async (_req: Request, res: Response) => {
    try {
      const data = await settings.findOne({ name: "default" });
      res.json(data?.upiMethods || []);
    } catch (e) {
      console.error('Failed to fetch upi methods', e);
      res.status(500).json([]);
    }
  });

  app.post("/api/admin/settings/upi-methods", async (req: Request, res: Response) => {
    try {
      const { name: upiName, upiId } = req.body ?? {};
      if (!upiName || !upiId) return res.status(400).json({ message: 'Invalid data' });

      const data = await settings.findOne({ name: "default" });
      const methods = Array.isArray(data?.upiMethods) ? data.upiMethods : [];
      const id = Date.now();
      const next = [...methods, { id, name: String(upiName), upiId: String(upiId) }];

      await settings.updateOne({ name: "default" }, { $set: { upiMethods: next, name: "default" } }, { upsert: true });
      res.json({ message: 'Added', id });
    } catch (e) {
      console.error('Add upi failed', e);
      res.status(500).json({ message: 'Failed' });
    }
  });

  app.delete("/api/admin/settings/upi-methods/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await settings.findOne({ name: "default" });
      const methods = Array.isArray(data?.upiMethods) ? data.upiMethods : [];
      const next = methods.filter((m: any) => Number(m.id) !== id);
      await settings.updateOne({ name: "default" }, { $set: { upiMethods: next, name: "default" } }, { upsert: true });
      res.json({ message: 'Deleted' });
    } catch (e) {
      console.error('Delete upi failed', e);
      res.status(500).json({ message: 'Failed' });
    }
  });

  app.get("/api/admin/orders", async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
      const skip = (page - 1) * limit;

      const total = await orders.countDocuments({}).catch(() => 0);
      const all = await orders.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

      // Join user data for the admin orders UI.
      // orders docs store: { userId, items, total, address, status, createdAt, ... }
      const userIds = Array.from(
        new Set(
          all
            .map((o: any) => o.userId)
            .filter((id: any) => id !== undefined && id !== null)
        )
      );

      const usersMap: Record<string, any> = {};
      const addressesMap: Record<string, any[]> = {};
      
      if (userIds.length) {
        const usersDocs = await users.find({ id: { $in: userIds as any } }).toArray();
        for (const u of usersDocs as any[]) {
          usersMap[String(u.id ?? u._id)] = u;
        }
        
        // Fetch addresses for all users
        const addressDocs = await db.collection("addresses").find({ userId: { $in: userIds as any } }).toArray();
        for (const addr of addressDocs as any[]) {
          const uid = String(addr.userId ?? "");
          if (!addressesMap[uid]) addressesMap[uid] = [];
          addressesMap[uid].push(addr);
        }
      }

      const enriched = all.map((o: any) => {
        const userDoc = usersMap[String(o.userId ?? "")];
        const userAddresses = addressesMap[String(o.userId ?? "")] ?? [];
        
        // Find default address or use first one
        const selectedAddress = userAddresses.find((a: any) => a.isDefault) ?? userAddresses[0];
        
        // Construct full address string from components
        const fullAddressString = selectedAddress 
          ? `${selectedAddress.house ?? ""} ${selectedAddress.area ?? ""} ${selectedAddress.city ?? ""} ${selectedAddress.pincode ?? ""}`.trim()
          : "";
        
        return {
          ...o,
          user: userDoc
            ? {
                fullName: userDoc.fullName ?? userDoc.name,
                email: userDoc.email,
                phone: userDoc.phone ?? userDoc.usernumber,
                walletBalance: userDoc.walletBalance ?? userDoc.userbalance ?? 0,
              }
            : null,
          // keep backward compatibility with UI fields
          // address priority: order.address > constructed from user's addresses > user.address field > ""
          address: o.address ?? fullAddressString ?? userDoc?.address ?? userDoc?.userAddress ?? "",
          userAddress: fullAddressString ?? userDoc?.address ?? userDoc?.userAddress ?? "",
          items: o.items ?? [],
          userName: userDoc?.fullName ?? userDoc?.name,
          walletBalance: userDoc?.walletBalance ?? userDoc?.userbalance ?? 0,
          userEmail: userDoc?.email,
          userPhone: userDoc?.phone ?? userDoc?.usernumber,
        };
      });

      res.json({ orders: enriched, pagination: { page, limit, total } });
    } catch (e) {
      console.error("GET /api/admin/orders failed", e);
      res.status(500).json({ message: "Failed to load orders" });
    }
  });


  // ===============================
  // Deposits (Admin)
  // ===============================
  // NOTE: server folder me deposits related routes/schemas exist nahi karte the,
  // isliye ye endpoints minimal working mock + best-effort Mongo mapping ke saath add kiye gaye hain.
  // Frontend expectations:
  // - GET /api/admin/deposits -> { deposits: Deposit[] } or Deposit[]
  // - DELETE /api/admin/deposits (all)
  // - DELETE /api/admin/deposits/:id
  // - POST /api/pay/admin-approve/:id
  // - POST /api/pay/admin-reject/:id

  function resolveDepositsCollection(dbConn: any) {
    // Try common names (best-effort). If none found, fallback to `deposits`.
    const candidates = ["deposits", "depositRequests", "walletDeposits", "deposit_requests", "depositrequest"];
    const existing = (dbConn as any).collections ? (dbConn as any).collections : null;
    // Mongo driver doesn't expose sync listing in types, so use try-catch queries instead.
    // We'll just return the first candidate we can query.
    return candidates;
  }

  async function getDepositsCursor() {
    const candidates = resolveDepositsCollection(db) as string[];
    for (const name of candidates) {
      try {
        const col = (db as any).collection(name);
        const sample = await col.findOne({});
        // If we can read any doc (or collection exists), use this collection.
        // Even if sample is null, collection likely exists.
        if (col) return col;
      } catch (e) {
        // ignore and try next
      }
    }
    // fallback
    return (db as any).collection("deposits");
  }

  function toFrontendDeposit(doc: any) {
    const user = doc?.userId;
    const createdAt = doc?.createdAt || doc?.created_at || new Date();
    const rawStatus = doc?.status;

    const status =
      rawStatus === "utr_submitted" || rawStatus === "pending"
        ? "pending"
        : rawStatus === "approved"
          ? "approved"
          : rawStatus === "rejected"
            ? "rejected"
            : "pending";

    const screenshotUrl = doc?.barcode || doc?.screenshot || doc?.screenshotBase64
      ? `data:image/png;base64,${doc.barcode || doc.screenshotBase64 || doc.screenshot}`
      : null;

    return {
      id: doc?._id || doc?.id,
      userId: user?._id || user?.id || doc?.userId,
      userName: user?.usernumber || user?.name || user?.fullName || doc?.userName || "Unknown",
      amount: Number(doc?.amount || doc?.depositAmount || 0),
      status,
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
      paymentMethod: doc?.paymentMethod || doc?.paymentChannel || doc?.method || "UPI",
      orderNumber: doc?.orderNumber || doc?.order_id || "-",
      utrNumber: doc?.utrNumber || doc?.utrNumber || doc?.utr || "-",
      screenshotUrl,
    };
  }

  app.get("/api/admin/deposits", async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(1000, Math.max(1, Number(req.query.limit || 50)));
      const status = String(req.query.status || "all");
      const createdType = String(req.query.createdType || "");

      const col = await getDepositsCursor();

      const filter: any = {};
      if (status !== "all") {
        // frontend uses pending/approved/rejected, backend may store utr_submitted.
        if (status === "pending") filter.status = { $in: ["utr_submitted", "pending"] };
        else if (status === "approved") filter.status = "approved";
        else if (status === "rejected") filter.status = "rejected";
      }

      // simple date filter support (matches frontend buttons)
      const now = new Date();
      if (createdType) {
        const from = new Date(now);
        if (createdType === "today") {
          from.setHours(0, 0, 0, 0);
        } else if (createdType === "yesterday") {
          from.setDate(now.getDate() - 1);
          from.setHours(0, 0, 0, 0);
        } else if (createdType === "last3days") {
          from.setDate(now.getDate() - 3);
        } else if (createdType === "last7days") {
          from.setDate(now.getDate() - 7);
        } else if (createdType === "lastMonth") {
          from.setDate(now.getDate() - 30);
        }
        filter.createdAt = { $gte: from };
      }

      if (req.query.createdAfter) {
        filter.createdAt = { ...(filter.createdAt || {}), $gte: new Date(String(req.query.createdAfter)) };
      }
      if (req.query.createdBefore) {
        filter.createdAt = { ...(filter.createdAt || {}), $lte: new Date(String(req.query.createdBefore)) };
      }

      const total = await col.countDocuments(filter).catch(() => 0);
      const docs = await col
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const deposits = Array.isArray(docs) ? docs.map(toFrontendDeposit) : [];
      return res.json({ deposits, pagination: { page, limit, total } });
    } catch (e) {
      console.error("GET /api/admin/deposits failed", e);
      return res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });

  app.delete("/api/admin/deposits", async (_req: Request, res: Response) => {
    try {
      const col = await getDepositsCursor();
      const r = await col.deleteMany({});
      return res.json({ message: "Deleted", deletedCount: r?.deletedCount || 0 });
    } catch (e) {
      console.error("DELETE /api/admin/deposits failed", e);
      return res.status(500).json({ message: "Failed to delete deposits" });
    }
  });

  app.delete("/api/admin/deposits/:id", async (req: Request, res: Response) => {
    try {
      const col = await getDepositsCursor();
      const { id } = req.params;

      // Try _id and fallback to id field
      const r = await col.deleteOne({ _id: id as any }).catch(async () => {
        return col.deleteOne({ id: id as any });
      });

      return res.json({ message: "Deleted", deletedCount: (r as any)?.deletedCount || 0 });
    } catch (e) {
      console.error("DELETE /api/admin/deposits/:id failed", e);
      return res.status(500).json({ message: "Failed to delete deposit" });
    }
  });

  app.post("/api/pay/admin-approve/:id", async (req: Request, res: Response) => {
    try {
      const col = await getDepositsCursor();
      const { id } = req.params;

      await col.updateOne(
        { _id: id as any },
        { $set: { status: "approved", approvedAt: new Date() } }
      ).catch(async () => {
        await col.updateOne({ id: id as any }, { $set: { status: "approved", approvedAt: new Date() } });
      });

      return res.json({ message: "Deposit approved" });
    } catch (e) {
      console.error("admin-approve failed", e);
      return res.status(500).json({ message: "Approve failed" });
    }
  });

  app.post("/api/pay/admin-reject/:id", async (req: Request, res: Response) => {
    try {
      const col = await getDepositsCursor();
      const { id } = req.params;
      const reason = req.body?.reason;

      await col.updateOne(
        { _id: id as any },
        { $set: { status: "rejected", rejectedAt: new Date(), rejectReason: reason || "" } }
      ).catch(async () => {
        await col.updateOne({ id: id as any }, { $set: { status: "rejected", rejectedAt: new Date(), rejectReason: reason || "" } });
      });

      return res.json({ message: "Deposit rejected" });
    } catch (e) {
      console.error("admin-reject failed", e);
      return res.status(500).json({ message: "Reject failed" });
    }
  });


  // Admin: list users with optional search & pagination
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(1000, Math.max(1, Number(req.query.limit || 100)));
      const search = String(req.query.search || "").trim();

      const filter: any = {};
      if (search) {
        const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [
          { fullName: re },
          { email: re },
          { phone: re },
        ];
      }

      const total = await users.countDocuments(filter);
      const list = await users.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray();

      // Normalize fields for admin client
      const mapped = list.map((u: any) => ({
        _id: u._id,
        id: u.id,
        name: u.fullName || u.name || "",
        email: u.email || "",
        phone: u.phone || u.usernumber || "",
        walletBalance: u.walletBalance ?? u.userbalance ?? 0,
        isBlocked: !!u.isBlocked,
        createdAt: u.createdAt || new Date(),
      }));

      res.json({ users: mapped, total, page, limit });
    } catch (error) {
      console.error("Admin users list failed:", error);
      res.status(500).json({ message: "Failed to list users" });
    }
  });

  // E-commerce dashboard stats
  app.get("/api/admin/dashboard/stats", async (_req: Request, res: Response) => {
    try {
      const totalProducts = await foods.countDocuments();
      const totalOrders = await orders.countDocuments();

      // Sum total revenue from orders (orders may store `total`)
      const revenueAgg = await orders.aggregate([
        { $match: { total: { $exists: true } } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
      ]).toArray();
      const totalRevenue = (revenueAgg[0] && revenueAgg[0].totalRevenue) || 0;

      const pendingOrders = await orders.countDocuments({ status: { $in: ["pending", "processing"] } });

      // Count unique users from orders
      const usersAgg = await orders.aggregate([
        { $match: { userId: { $exists: true, $ne: null } } },
        { $group: { _id: "$userId" } },
        { $count: "uniqueUsers" }
      ]).toArray();
      const totalUsers = (usersAgg[0] && usersAgg[0].uniqueUsers) || 0;

      const recentOrders = await orders.find({}).sort({ createdAt: -1 }).limit(6).toArray();

      return res.json({
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders,
        totalUsers,
        recentOrders,
      });
    } catch (error) {
      console.error('Failed to compute dashboard stats', error);
      return res.status(500).json({ message: 'Failed to load stats' });
    }
  });

  app.patch("/api/admin/orders/:id/status", async (req: Request, res: Response) => {
    const { status } = req.body;
    const allowed = ["pending", "processing", "completed", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existing = await orders.findOne({ id: req.params.id });
    if (!existing) {
      return res.status(404).json({ message: "Order not found" });
    }

    await orders.updateOne(
      { id: req.params.id },
      { $set: { status } }
    );

    const updated = await orders.findOne({ id: req.params.id });
    res.json({ message: "Order status updated", order: updated });
  });

  return httpServer;
}
