// shared/schema.ts
import {
  pgTable,
  text,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ================= FOOD ================= */

export const foods = pgTable("foods", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  img: text("img").notNull(),
  category: text("category").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const foodOptions = pgTable("food_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  foodId: uuid("food_id")
    .notNull()
    .references(() => foods.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: integer("price").notNull(),
});

/* ================= SETTINGS ================= */

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  whatsappNumber: text("whatsapp_number").notNull(),
});

/* ================= RELATIONS ================= */

export const foodsRelations = relations(foods, ({ many }) => ({
  options: many(foodOptions),
}));

export const foodOptionsRelations = relations(foodOptions, ({ one }) => ({
  food: one(foods, {
    fields: [foodOptions.foodId],
    references: [foods.id],
  }),
}));
  