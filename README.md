# ZephyrDrive - Car Dealership Inventory System

A luxury-styled, full-stack Car Dealership Inventory System built with **Next.js (App Router)**, **Tailwind CSS**, **MongoDB Atlas**, and **JWT-based authentication** (via cookies). This project is built entirely in **JavaScript** (no TypeScript) and runs a robust backend API and client dashboard inside a single Next.js codebase.

---

## Core Features

- **Dynamic Inventory Catalog:** View high-performance and luxury vehicles, displaying make, model, category, pricing, and stock quantity.
- **Search & Filter Controls:** Clean search bar filtering vehicles dynamically by make, model, category, and minimum/maximum price bounds.
- **Transactional Stock Operations:** 
  - **Purchase Vehicle:** Users can buy vehicles, instantly decrementing stock quantity. Prevents and blocks purchases if stock is 0.
  - **Manual Restocks:** Admins can restock vehicle quantities directly from the table interface.
- **Role-Based Admin Controls:** Toggled panels enabling creators to add, edit, delete, and restock vehicles. Protected both on the client UI and the server API.
- **Secure JWT Authentication:** JWT-based user login/registration with secure `httpOnly` cookie persistence. 
- **Premium Interface Design:** Custom Midnight Amethyst & Neon Indigo theme, category quick pills, dynamic spec gauges, and slide-in notifications.

---

## Technical Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** Vanilla JavaScript (.js, .jsx)
- **Database:** MongoDB Atlas (via Mongoose)
- **Styling:** Tailwind CSS (with custom theme extensions)
- **Auth:** Cookies, `jsonwebtoken`, and `bcryptjs`
- **Testing:** Vitest

---

## Setup & Running Locally

Follow these steps to configure and run the application on your local machine:

### 1. Install Dependencies
In the root directory, install all package requirements:
```bash
npm install
```

### 2. Configure Environment Variables
Create a file named `.env.local` in the root of the project:
```ini
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/dealership?retryWrites=true&w=majority

# Secret key used for signing JWT tokens (min 32 characters recommended)
JWT_SECRET=your_super_secret_jwt_sign_key_goes_here
```

### 3. Start Development Server
Launch the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 4. Running the Test Suite
Execute the automated test suite testing auth, CRUD, purchase limits, and admin gates:
```bash
npm run test
```

---

## API Documentation

All backend routes are implemented under `/api/...` and enforce token-based session checks.

### Authentication Endpoints (Public)

#### **POST** `/api/auth/register`
Creates a new user account.
- **Expected Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "role": "user" // 'user' or 'admin'
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "message": "Registration successful.",
    "user": {
      "id": "60d0fe4f5311236168a109a1",
      "email": "user@example.com",
      "role": "user"
    }
  }
  ```

#### **POST** `/api/auth/login`
Validates credentials and sets a secure `httpOnly` cookie named `token`.
- **Expected Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "Login successful.",
    "user": {
      "id": "60d0fe4f5311236168a109a1",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt-token-string"
  }
  ```

#### **POST** `/api/auth/logout`
Clears the session authentication cookie.
- **Success Response (200 OK):**
  ```json
  { "message": "Logged out successfully." }
  ```

---

### Vehicles API (Protected — Valid JWT Required)

#### **GET** `/api/vehicles`
Retrieves list of all active vehicles.
- **Auth Required:** Valid JWT token
- **Success Response (200 OK):**
  ```json
  [
    {
      "_id": "60d0fe4f5311236168a109b5",
      "make": "Porsche",
      "model": "911 GT3",
      "category": "Coupe",
      "price": 169700,
      "quantity": 2,
      "createdAt": "2026-07-10T19:00:00.000Z",
      "updatedAt": "2026-07-10T19:00:00.000Z"
    }
  ]
  ```

#### **POST** `/api/vehicles`
Adds a new vehicle to the dealership inventory.
- **Auth Required:** Valid JWT token & Admin Role
- **Expected Request Body:**
  ```json
  {
    "make": "Porsche",
    "model": "911 GT3",
    "category": "Coupe",
    "price": 169700,
    "quantity": 2
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "_id": "60d0fe4f5311236168a109b5",
    "make": "Porsche",
    "model": "911 GT3",
    "category": "Coupe",
    "price": 169700,
    "quantity": 2
  }
  ```

#### **GET** `/api/vehicles/search`
Filters vehicles by queries.
- **Query Parameters:** `make`, `model`, `category`, `minPrice`, `maxPrice`
- **Auth Required:** Valid JWT token
- **Success Response (200 OK):**
  - Array of matching vehicles.

#### **PUT** `/api/vehicles/:id`
Updates fields of a specific vehicle.
- **Auth Required:** Valid JWT token & Admin Role
- **Expected Request Body:**
  ```json
  {
    "price": 172000,
    "quantity": 4
  }
  ```
- **Success Response (200 OK):**
  - Updated vehicle details.

#### **DELETE** `/api/vehicles/:id`
Removes a vehicle from the catalog.
- **Auth Required:** Valid JWT token & Admin Role
- **Success Response (200 OK):**
  ```json
  { "message": "Vehicle deleted successfully." }
  ```

---

### Inventory Control (Protected — Valid JWT Required)

#### **POST** `/api/vehicles/:id/purchase`
Decrements vehicle quantity stock by 1. Rejects with 400 error if quantity is already 0.
- **Auth Required:** Valid JWT token (Any Role)
- **Success Response (200 OK):**
  ```json
  {
    "message": "Purchase successful.",
    "vehicle": {
      "_id": "60d0fe4f5311236168a109b5",
      "quantity": 1
    }
  }
  ```

#### **POST** `/api/vehicles/:id/restock`
Increments vehicle quantity stock by a user-specified positive integer amount.
- **Auth Required:** Valid JWT token & Admin Role
- **Expected Request Body:**
  ```json
  {
    "quantity": 10
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "Restock successful.",
    "vehicle": {
      "_id": "60d0fe4f5311236168a109b5",
      "quantity": 11
    }
  }
  ```

---

## Screenshots

*Place screenshots demonstrating responsive layouts, admin catalog creation, search filters, and successful restock actions here.*

---

## My AI Usage

### Which AI tools were used
- **Google Antigravity (Gemini):** Used as the primary pair-programming assistant to build, test, and debug the entire application.

### How they were used
- **Code Generation & Boilerplate:** Used to generate Mongoose schema definitions for Users and Vehicles, Next.js API route handlers, and frontend components.
- **Unit & Integration Testing:** Helped design mock architectures for standard HTTP requests and Mongoose operations to run fully-isolated tests using Vitest.
- **Bug Resolution:** Assisted in diagnosing and fixing path alias resolution issues in Vitest config and optional-chaining guards for request cookie headers.

### Reflection on how AI impacted the workflow
- **Efficiency:** Drastically reduced implementation time from hours to minutes, creating a ready-to-run Next.js full-stack app with unit tests.
- **Coverage:** Allowed quick writing of granular edge-case tests (like zero-stock purchase limits and admin-only restock controls) to maintain TDD standards.
- **Guidance:** Kept the codebase strictly aligned to project constraints (no TypeScript, specific MongoDB schemas, cookie-based JWT sessions).

---

## Test Execution Report

Running `npm test` triggers our Vitest suite, executing 23 comprehensive tests covering authentication, database CRUD operations, and inventory bounds:

```text
 RUN  v1.6.1 C:/Users/yugsa/.gemini/antigravity/scratch/car-dealership-inventory

 ✓ tests/inventory.test.js  (5 tests) 21ms
 ✓ tests/vehicles.test.js  (9 tests) 33ms
 ✓ tests/auth.test.js  (9 tests) 570ms

 Test Files  3 passed (3)
      Tests  23 passed (23)
   Start at  01:09:10
   Duration  1.72s
```

