# Application Routing Structure

This document describes the URI paths used in the restaurant ordering system.

## Public Routes

### Home Page
- **Path:** `/`
- **Description:** Main landing page with options to start as customer or access admin features

### Customer Order Flow
- **Path:** `/customer`
- **Description:** Customer table login and ordering interface
- **Query Parameters:**
  - `?table={tableNumber}` - Direct link to table (used in QR codes)
  - `?code={orderCode}` - Join existing order by code
  - `?join=true` - Show code entry form

## Admin Routes (Requires Authentication)

### Kitchen Dashboard
- **Path:** `/kitchen`
- **Description:** Real-time kitchen order management dashboard
- **Features:**
  - View pending, preparing, and ready orders
  - Update order status
  - View order details

### QR Code Generator
- **Path:** `/qr-generator`
- **Description:** Generate QR codes for tables
- **Features:**
  - Select table
  - Generate QR code
  - Download QR code image

### Admin Panel
- **Path:** `/admin`
- **Description:** Main admin dashboard with order history and analytics
- **Features:**
  - View order history
  - Filter by date range, month, or year
  - View analytics (total orders, sales, items, average order)

### Table Management
- **Path:** `/tables`
- **Description:** Manage restaurant tables
- **Features:**
  - Add new tables
  - Edit table details (number, floor, seating capacity)
  - Delete tables
  - View table status

### Menu Management
- **Path:** `/menu-management`
- **Description:** Manage menu items
- **Features:**
  - Add new menu items
  - Edit existing items
  - Toggle availability
  - Delete items
  - Organize by categories

### Admin Login
- **Path:** `/admin-login`
- **Description:** Authentication page for admin features
- **Credentials:** username: `admin`, password: `admin123`

## Navigation Features

- Browser back/forward buttons work correctly
- URL updates reflect current page
- Deep linking supported (can share URLs)
- QR codes link directly to customer order flow with table pre-filled
