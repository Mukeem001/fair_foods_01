# Advanced UI E-Commerce Setup Guide

This is a complete e-commerce application with separate **User** and **Admin** sections, powered by **MongoDB** and **Express.js**.

## Project Structure

```
├── client/              # React frontend
│   └── src/
│       ├── pages/
│       │   ├── admin.tsx      # Admin dashboard (separate section)
│       │   ├── home.tsx       # Product listing
│       │   └── cart.tsx       # Shopping cart
│       └── components/        # Reusable UI components
├── server/              # Express backend
│   ├── db.ts            # MongoDB connection & collections
│   ├── routes.ts        # Public user APIs
│   ├── adminRoutes.ts   # Admin-only APIs
│   └── index.ts         # Server entry point
└── shared/              # Shared types & schemas
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install all dependencies including:
- **mongodb** - MongoDB driver
- **express** - Web framework
- **react** - Frontend framework
- **vite** - Build tool

### 2. MongoDB Setup

#### Option A: Local MongoDB

1. **Install MongoDB Community Edition**
   - Windows: Download from https://www.mongodb.com/try/download/community
   - macOS: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb`

2. **Start MongoDB Server**
   - Windows: `mongod` (or start from Services)
   - macOS/Linux: `brew services start mongodb-community`

3. **Verify Connection**
   ```bash
   mongosh  # Connect to MongoDB shell
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/`

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=advanced-ui

# Admin Configuration
ADMIN_KEY=admin123

# Server Port
PORT=3000

# Node Environment
NODE_ENV=development
```

**For MongoDB Atlas**, use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

### 4. Development Server

```bash
# Start backend server (Express + MongoDB)
npm run dev

# In another terminal, start frontend (Vite)
npm run dev:client
```

The application will be available at:
- Frontend: `http://localhost:5000`
- Backend: `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
npm run start
```

## Database Schema

### Collections

#### 1. **foods** - Product Catalog
```json
{
  "_id": ObjectId,
  "id": "UUID",
  "name": "Biryani",
  "img": "image-url",
  "category": "Main Course",
  "active": true,
  "options": [
    { "name": "Half", "price": 150 },
    { "name": "Full", "price": 250 }
  ],
  "createdAt": ISODate
}
```

#### 2. **orders** - Customer Orders
```json
{
  "_id": ObjectId,
  "id": "UUID",
  "items": [
    {
      "id": "product-id",
      "name": "Biryani",
      "option": "Full",
      "qty": 2,
      "price": 250
    }
  ],
  "total": 500,
  "address": "Customer address",
  "whatsappNumber": "+91XXXXXXXXXX",
  "status": "pending|processing|completed|cancelled",
  "createdAt": ISODate
}
```

#### 3. **settings** - Store Settings
```json
{
  "_id": ObjectId,
  "name": "default",
  "whatsappNumber": "+91XXXXXXXXXX"
}
```

## API Endpoints

### Public User APIs

#### Get Products
```
GET /api/foods
```
Returns all active products

#### Check Product Availability
```
POST /api/foods/check
Body: { "ids": ["id1", "id2"] }
```

#### Get Settings
```
GET /api/settings
```

#### Create Order
```
POST /api/orders
Body: {
  "items": [...],
  "total": 500,
  "address": "...",
  "whatsappNumber": "+91..."
}
```

### Admin APIs

#### Login
```
POST /api/admin/login
Body: { "password": "admin123" }
```

#### Get All Foods
```
GET /api/admin/foods
Headers: { "x-admin-key": "admin123" }
```

#### Add Product
```
POST /api/admin/foods
Body: {
  "name": "Biryani",
  "img": "url",
  "category": "Main Course",
  "options": [{ "name": "Half", "price": 150 }],
  "active": true
}
```

#### Toggle Product Active Status
```
PATCH /api/admin/foods/:id/toggle
```

#### Delete Product
```
DELETE /api/admin/foods/:id
```

#### Get All Orders
```
GET /api/admin/orders
```

#### Update Order Status
```
PATCH /api/admin/orders/:id/status
Body: { "status": "processing|completed|cancelled" }
```

#### Get Settings
```
GET /api/admin/settings
```

#### Update Settings
```
POST /api/admin/settings
Body: { "whatsappNumber": "+91XXXXXXXXXX" }
```

## Admin Dashboard Features

1. **Authentication**
   - Login with admin password
   - Secure with `x-admin-key` header

2. **Product Management**
   - Add new products with variants
   - Toggle product visibility
   - Delete products
   - Support for categories and pricing

3. **Order Management**
   - View all customer orders
   - Update order status
   - See order details and items

4. **Settings**
   - Configure WhatsApp number for customer contact

## User Flow

1. **Browse** - View products on home page
2. **Add to Cart** - Select items and variants
3. **Checkout** - Enter address and WhatsApp number
4. **Order Placed** - Order saved to MongoDB
5. **Admin Review** - Admin sees order and can update status

## Admin Flow

1. **Login** - Enter admin password
2. **Add Products** - Create menu items with options
3. **Manage Products** - Toggle visibility or delete
4. **Manage Orders** - Update status and track
5. **Settings** - Update store WhatsApp number

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongosh`
- Check `MONGODB_URI` in `.env`
- For local: `mongodb://127.0.0.1:27017`
- For Atlas: Include username, password, and cluster

### Admin Login Not Working
- Verify `ADMIN_KEY` in `.env` matches frontend
- Default: `admin123`

### Orders Not Saving
- Check MongoDB is running
- Verify `MONGODB_DB` name in `.env`
- Check browser console for API errors

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Use `npm run dev:client -- --port 5001`

## Technologies Used

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: MongoDB
- **UI Components**: Radix UI, shadcn/ui
- **Form Handling**: React Hook Form, Zod validation
- **State Management**: React Query (TanStack Query)

## Next Steps

1. ✅ Setup MongoDB
2. ✅ Configure environment variables
3. ✅ Install dependencies
4. ✅ Start development server
5. 🎯 Add products via admin dashboard
6. 🎯 Test user checkout flow
7. 🎯 Deploy to production

## Support

For issues or questions, check the console logs and MongoDB connection status.
