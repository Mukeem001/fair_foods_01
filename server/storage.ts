// Admin authentication storage
// Currently using environment variable ADMIN_KEY for authentication
// This file can be extended for more complex admin user management

import { randomUUID } from "crypto";

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export interface IStorage {
  // Future: add admin user management methods if needed
}

export class MemStorage implements IStorage {
  // Placeholder for future admin user storage
}

export const storage = new MemStorage();

