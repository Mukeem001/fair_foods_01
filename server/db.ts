import { MongoClient, type Db } from "mongodb";
import "dotenv/config";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const mongoDb = process.env.MONGODB_DB ?? "advanced-ui";

const client = new MongoClient(mongoUri);
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (!db) {
    await client.connect();
    db = client.db(mongoDb);
    console.log(`MongoDB connected: ${mongoUri}/${mongoDb}`);
  }

  return db;
}

export interface FoodOption {
  name: string;
  price: number;
}

export interface FoodDocument {
  id: string;
  name: string;
  img: string;
  category: string;
  active: boolean;
  options: FoodOption[];
  createdAt: Date;
}

export interface SettingsDocument {
  name: string;
  whatsappNumber: string;
}

export interface OrderItem {
  id: string;
  name: string;
  option: string;
  qty: number;
  price: number;
}

export interface OrderDocument {
  id: string;
  userId?: string;
  items: OrderItem[];
  total: number;
  address: string;
  whatsappNumber: string;
  status: string;
  createdAt: Date;
}

export interface AddressDocument {
  id: string;
  userId: string;
  name: string;
  phone: string;
  house: string;
  area: string;
  city: string;
  pincode: string;
  isDefault: boolean;
  createdAt: Date;
}

