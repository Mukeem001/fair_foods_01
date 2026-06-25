import type { Express, Request } from "express";
import type { Server } from "http";
import { getDb, type OrderDocument } from "./db";
import type { AuthUser } from "./auth";
import { protectUserRoute } from "./auth";

export async function registerProfileOrdersRoutes(httpServer: Server, app: Express): Promise<Server> {
  const db = await getDb();
  const orders = db.collection<OrderDocument>("orders");

  // GET /api/profile/orders (Protected - Requires JWT)
  app.get("/api/profile/orders", protectUserRoute, async (req, res) => {
    try {
      const userId = (req as Request & { authUser?: AuthUser }).authUser!.userId;

      const list = await orders
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

      // Attach product image into order items so client can show original product image.
      // orders.items contains: { id, name, option, qty, price }
      // products collection contains: { id, img, ... }
      const foods = db.collection<any>("foods");

      const allFoodIds = Array.from(
        new Set(
          list
            .flatMap((o: any) => (Array.isArray(o.items) ? o.items : []))
            .map((it: any) => it?.id)
            .filter((id: any) => id !== undefined && id !== null)
        )
      );

      const foodsDocs = allFoodIds.length
        ? await foods.find({ id: { $in: allFoodIds } }).toArray()
        : [];

      const foodImgMap: Record<string, string> = {};
      for (const f of foodsDocs) {
        if (f?.id) foodImgMap[String(f.id)] = f.img;
      }

      const enriched = list.map((o: any) => {
        const items = Array.isArray(o.items) ? o.items : [];
        return {
          ...o,
          items: items.map((it: any) => ({
            ...it,
            img: it?.img ?? foodImgMap[String(it?.id ?? "")] ?? it?.image ?? undefined,
            image: it?.image ?? foodImgMap[String(it?.id ?? "")] ?? it?.img ?? undefined,
          })),
          // optional top-level convenience fields
          image: o?.image ?? (items[0]?.image || items[0]?.img),
        };
      });

      res.json({ orders: enriched });
    } catch (e) {
      console.error("Failed to fetch profile orders", e);
      res.status(500).json({ message: "Failed to fetch profile orders" });
    }
  });

  // GET /api/profile/orders/:id (Protected - Requires JWT)
  app.get("/api/profile/orders/:id", protectUserRoute, async (req, res) => {
    try {
      const userId = (req as Request & { authUser?: AuthUser }).authUser!.userId;
      const orderId = req.params.id;

      const order = await orders.findOne({ userId, id: orderId } as any);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Attach product images
      const foods = db.collection<any>("foods");
      const items = Array.isArray(order.items) ? order.items : [];
      
      const allFoodIds = Array.from(
        new Set(
          items
            .map((it: any) => it?.id)
            .filter((id: any) => id !== undefined && id !== null)
        )
      );

      const foodsDocs = allFoodIds.length
        ? await foods.find({ id: { $in: allFoodIds } }).toArray()
        : [];

      const foodImgMap: Record<string, string> = {};
      for (const f of foodsDocs) {
        if (f?.id) foodImgMap[String(f.id)] = f.img;
      }

      const enriched = {
        ...order,
        items: items.map((it: any) => ({
          ...it,
          img: it?.img ?? foodImgMap[String(it?.id ?? "")] ?? it?.image ?? undefined,
          image: it?.image ?? foodImgMap[String(it?.id ?? "")] ?? it?.img ?? undefined,
        })),
        image: order?.image ?? (items[0]?.image || items[0]?.img),
      };

      res.json(enriched);
    } catch (e) {
      console.error("Failed to fetch order by id", e);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  return httpServer;
}

