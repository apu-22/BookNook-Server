<div align="center">

# ⚙️ BookNook — REST API Backend Server

  <p align="center">
    <strong>Robust, scalable, and secure RESTful backend service powering the BookNook community book exchange platform.</strong>
  </p>

  <p align="center">
    <a href="https://booknook-server-api.onrender.com">
      <img src="https://img.shields.io/badge/Live%20API-Render-brightgreen?style=for-the-badge&logo=render&logoColor=white" alt="Live API" />
    </a>
    <a href="https://booknook-client-lilac.vercel.app">
      <img src="https://img.shields.io/badge/Live%20Client-Vercel-emerald?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Client" />
    </a>
    <a href="https://github.com/apu-22/BookNook-Client">
      <img src="https://img.shields.io/badge/Frontend%20Repo-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Frontend Repo" />
    </a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js%205-000000?style=flat-square&logo=express&logoColor=white" alt="Express.js" />
    <img src="https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/JWT%20(Jose)-FF5722?style=flat-square&logo=json-web-tokens&logoColor=white" alt="JWT" />
    <img src="https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black" alt="Render" />
    <img src="https://img.shields.io/badge/CORS-Enabled-blue?style=flat-square" alt="CORS" />
  </p>

</div>

---

## 🌐 Live Deployments & Cross Links

- ⚙️ **API Service (Backend):** [https://booknook-server-api.onrender.com](https://booknook-server-api.onrender.com)
- 🚀 **Client Application (Frontend):** [https://booknook-client-lilac.vercel.app](https://booknook-client-lilac.vercel.app)
- 💻 **Frontend Repository:** [https://github.com/apu-22/BookNook-Client](https://github.com/apu-22/BookNook-Client)

---

## 📖 Overview

**BookNook Server** is the core RESTful API engine managing book collections, real-time inventory counts, user borrowings, and security. It implements MongoDB Atlas native drivers for optimal database throughput and utilizes JSON Web Key Sets (JWKS) via `jose` for decentralized, zero-trust token verification from Better-Auth client sessions.

---

## ✨ Key Backend Capabilities

- **📚 Full Book Lifecycle (CRUD):**
  Provides complete lifecycle operations for community books including batch retrieval, single book inspection with ObjectId validation, title/copies patching, and owner deletion.

- **🔄 Automatic Inventory & Stock Reconciliation:**
  Maintains inventory integrity. When a book is borrowed, its available copies count decrements automatically (`$inc: { totalCopies: -1 }`). Returning the book immediately restores stock (`$inc: { totalCopies: 1 }`).

- **🛡️ Secure Decentralized Token Verification (JWKS + Jose):**
  Protected endpoints require a verified Bearer token. Tokens are cryptographically validated against the client's JWKS endpoint with memory-cached key sets, eliminating unauthorized mutations without latency penalties.

- **⏱️ Automated 7-Day Lending Lifecycle & Concurrency Guard:**
  Automatically computes 7-day lending periods. Validates that a user cannot duplicate-borrow the same title concurrently until the active borrow is returned.

- **📊 High-Efficiency Projections & Sorting:**
  Specialized endpoints like `/new-arrivals` leverage indexed sorting (`{ addedAt: -1, _id: -1 }`) with `.limit(6)` to deliver rapid responses for landing pages.

- **🌐 Visual Health Check & Landing Page:**
  Root route (`GET /`) serves an interactive, dark-themed server status card with live health pulse, endpoints guide, and direct links to the frontend.

---

## 🛠️ Technology Stack

- **Runtime:** Node.js (ES Module syntax)
- **Web Framework:** Express.js 5
- **Database:** MongoDB Atlas (Native `mongodb` Driver v7)
- **Authentication & Cryptography:** `jose` (JWT verification & JWKS remote set)
- **Environment Management:** `dotenv`
- **Security & Headers:** `cors` middleware
- **Hosting Platform:** Render

---

## 📋 API Endpoints Specification

### 1. Root & Health
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | No | Renders modern HTML API health status card |

### 2. Books Management
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/all-books` | No | Get all books in catalog |
| `GET` | `/all-books/:id` | **Yes** | Get detailed book data by MongoDB ObjectId |
| `PATCH`| `/all-books/:id` | **Yes** | Update book details (title, copies, genre, etc.) |
| `DELETE`| `/all-books/:id` | **Yes** | Delete a book from catalog |
| `GET` | `/new-arrivals` | No | Fetch the 6 most recently added titles |
| `GET` | `/my-books` | **Yes** | Fetch books contributed by user (`?email=user@example.com`) |
| `POST` | `/add-book` | **Yes** | Add a new book into the community catalog |

#### Sample Request Body (`POST /add-book`):
```json
{
  "title": "The Silent Patient",
  "author": "Alex Michaelides",
  "genre": "Thriller",
  "totalCopies": 3,
  "image": "https://example.com/cover.jpg",
  "summary": "A gripping psychological thriller...",
  "userEmail": "reader@example.com",
  "userName": "Alex"
}
```

### 3. Borrow & Return Operations
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/borrow-book` | **Yes** | Borrow a book (checks stock, decrements copy count) |
| `GET` | `/my-borrows` | **Yes** | Retrieve user's borrowed books (`?email=user@example.com`) |
| `DELETE`| `/my-borrows/:id` | **Yes** | Return book (removes borrow record, increments copy count) |

#### Sample Request Body (`POST /borrow-book`):
```json
{
  "bookId": "654c8a1b2f3e4d5c6b7a8901",
  "bookTitle": "Atomic Habits",
  "bookImage": "https://example.com/atomic.jpg",
  "userName": "Jane Doe",
  "userEmail": "jane@example.com",
  "returnDate": "2026-11-28"
}
```

---

## 💾 Database Schema

### `Books` Collection
```json
{
  "_id": "ObjectId",
  "title": "String",
  "author": "String",
  "genre": "String",
  "totalCopies": "Number",
  "image": "String",
  "summary": "String",
  "userEmail": "String",
  "userName": "String",
  "addedAt": "Date"
}
```

### `borrows` Collection
```json
{
  "_id": "ObjectId",
  "bookId": "String (ObjectId ref)",
  "bookTitle": "String",
  "bookImage": "String",
  "userName": "String",
  "userEmail": "String",
  "borrowDate": "String (YYYY-MM-DD)",
  "returnDate": "String (YYYY-MM-DD)",
  "borrowedAt": "Date"
}
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `v18.0.0` or higher
- **MongoDB Atlas:** Connection URI string

### 1. Clone the Server Repository
```bash
git clone https://github.com/apu-22/BookNook-Server.git
cd BookNook-Server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root of `booknook-server`:

```env
PORT=8000
MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
CLIENT_URL=https://booknook-client-lilac.vercel.app
```

### 4. Run Server Locally
```bash
# Production mode
npm start

# Development mode (with live reload)
npm run dev
```

Server runs on: [http://localhost:8000](http://localhost:8000)

---

## 🔒 Security Practices

- **Bearer Token Authorization:** Protects destructive and user-specific endpoints against impersonation.
- **Payload Sanitization:** Rejects mutation of immutable MongoDB `_id` fields.
- **Stock Validation:** Prevents borrowing out-of-stock titles and blocks simultaneous duplicate borrow records.
- **CORS Protection:** Configured to accept authorized client headers and methods.

---

## 🤝 Related Repositories

- 🖥️ **Frontend Client:** [BookNook-Client](https://github.com/apu-22/BookNook-Client)
- ⚙️ **Backend API:** [BookNook-Server](https://github.com/apu-22/BookNook-Server)

---

## 👨‍💻 Developed By

**Apu Rayhan**  
- GitHub: [@apu-22](https://github.com/apu-22)
- Project: [BookNook](https://booknook-client-lilac.vercel.app)
