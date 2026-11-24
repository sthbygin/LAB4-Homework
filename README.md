# ShopAdmin – Fullstack E-Commerce Admin & Storefront (Lab 4 Homework)

This project contains the complete backend REST API and frontend interface for the Lab 4 Homework (**Advanced API Integration: File Upload, External APIs & JWT Authentication**).

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Node.js & Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Stateless JSON Web Tokens (`jsonwebtoken`)
- **Password Security**: One-way salt hashing with `bcryptjs`
- **File Upload**: `multer` with disk storage and static file serving (`/uploads`)
- **Cross-Origin**: `cors` configured for local development and client integration

---

## 📁 Project Structure

```text
Lab4-Homework/
├── .env                  # Environment configuration (ignored in git)
├── .env.example          # Environment template
├── .gitignore            # Git ignore file
├── package.json          # Node dependencies and scripts
├── server.js             # Express application entry point
├── test_api.js           # Automated test suite (27 test cases)
├── uploads/              # Storage directory for user avatars
├── src/
│   ├── config/
│   │   └── db.js         # MongoDB connection setup
│   ├── controllers/
│   │   ├── auth.controller.js      # Register, login, get current user
│   │   ├── user.controller.js      # Update profile, upload avatar
│   │   ├── category.controller.js  # CRUD operations for categories
│   │   └── product.controller.js   # CRUD operations for products
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verification & Admin RBAC check
│   │   ├── upload.middleware.js    # Multer configuration & file filter
│   │   └── error.middleware.js     # Centralized error handler
│   ├── models/
│   │   ├── User.js       # User schema (fullName, age, gender, email, passwordHash, avatarUrl, type)
│   │   ├── Category.js   # Category schema (name)
│   │   └── Product.js    # Product schema (name, categoryId, quantity, price)
│   └── routes/
│       ├── auth.routes.js
│       ├── user.routes.js
│       ├── category.routes.js
│       └── product.routes.js
├── index.html            # Provided frontend client
├── app.js                # Frontend client logic
├── config.js             # Frontend API configuration
└── style.css             # Frontend styling
```

---

## 🗄️ Database Design (Mongoose)

### 1. User Entity
- `fullName` (String, required)
- `age` (Number, required)
- `gender` (String, enum: `['male', 'female', 'other']`, required)
- `email` (String, required, unique, lowercase)
- `passwordHash` (String, required) - **Never exposed in API responses**
- `avatarUrl` (String, default: `''`)
- `type` (String, enum: `['normal', 'admin']`, default: `'normal'`)

### 2. Category Entity
- `name` (String, required, unique)

### 3. Product Entity
- `name` (String, required)
- `categoryId` (ObjectId references `Category`, required)
- `quantity` (Number, required, default: 0)
- `price` (Number, required, default: 0)

---

## 🚀 Setup & Execution Guide

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance running locally on `localhost:27017`

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (or verify `.env` values):
```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/shopadmin
JWT_SECRET=super_secret_jwt_key_lab4_web2_2026
JWT_EXPIRES_IN=1d
```

### 3. Start Backend Server
```bash
npm start
# or development mode:
npm run dev
```
The server will start at: `http://localhost:4000`

### 4. Run Automated Test Suite
To verify all 27 automated tests:
```bash
node test_api.js
```

### 5. Launch Frontend UI
- Verify `config.js` has `API_BASE: 'http://localhost:4000/api/v1'`.
- Open `index.html` with Live Server / Five Server (e.g. `http://127.0.0.1:5500`) or open directly in your browser.

---

## 📡 API Specification

| Method | Endpoint | Protection | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Anyone | Register account (`normal` or `admin`) |
| `POST` | `/api/v1/auth/login` | Public | Anyone | Verify credentials and receive JWT |
| `GET` | `/api/v1/auth/me` | Protected | Any logged-in | Get current user's profile |
| `PUT` | `/api/v1/users/me` | Protected | Any logged-in | Update profile (`fullName`, `age`, `gender`) |
| `POST` | `/api/v1/users/me/avatar` | Protected | Any logged-in | Upload user avatar (multipart/form-data) |
| `GET` | `/api/v1/categories` | Protected | Any logged-in | List all categories |
| `POST` | `/api/v1/categories` | Protected | **Admin only** | Create a new category |
| `PUT` | `/api/v1/categories/:id` | Protected | **Admin only** | Update category name |
| `DELETE`| `/api/v1/categories/:id` | Protected | **Admin only** | Delete category and associated products |
| `GET` | `/api/v1/products` | Protected | Any logged-in | List products (supports `?categoryId=`) |
| `POST` | `/api/v1/products` | Protected | **Admin only** | Create a new product |
| `PUT` | `/api/v1/products/:id` | Protected | **Admin only** | Update product |
| `DELETE`| `/api/v1/products/:id` | Protected | **Admin only** | Delete product |

---

## 🎥 Video Demo Checklist Instructions

Follow this exact sequence for your video demonstration:

1. **Sign up two accounts**:
   - One with Account type: `Normal user` (e.g., `user@test.com`).
   - One with Account type: `Admin` (e.g., `admin@test.com`).
2. **Log in as the normal user**:
   - Observe the storefront view, product list, and categories navigation.
3. **Show 403 Forbidden enforcement**:
   - Try to add, edit, or delete a category or product.
   - Observe the red toast displaying `403 Forbidden` and check the DevTools Network panel showing the `403` status response.
4. **Change the normal user's avatar**:
   - Navigate to **My profile**.
   - Choose an image file (JPG, PNG, or WEBP up to 2MB) and click **Upload avatar**.
   - Observe the updated avatar in both the header and profile card.
5. **Log out, then log in as Admin**:
   - Log out from the normal user account.
   - Log in using the admin account created in step 1. Notice the `ADMIN` role badge.
6. **Perform Admin CRUD operations**:
   - Navigate to **Categories**: Create a new category, edit its name, and verify changes.
   - Navigate to **Products**: Create a new product, edit its quantity/price, filter by category, and delete a product.
7. **Inspect the JWT in DevTools**:
   - Open DevTools (`F12`) → **Application** → **Local Storage** → click `token` to show the stored JWT.
   - Switch to **Network** tab, click any request, and show the `Authorization: Bearer <token>` header proving that token-based role verification controls the backend authorization.
