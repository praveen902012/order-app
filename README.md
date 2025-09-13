# Restaurant Ordering System

A comprehensive restaurant ordering application with QR code functionality, collaborative ordering, and real-time kitchen dashboard.

## Features

### Customer Features
- **QR Code Scanning**: Scan table QR codes to start ordering
- **Manual Table Entry**: Enter table number and mobile manually
- **Collaborative Ordering**: Share unique codes with tablemates
- **Real-time Menu**: Browse categorized menu with live availability
- **Cart Management**: Add/remove items with quantity control
- **Order Tracking**: Real-time order status updates

### Kitchen Features
- **Real-time Dashboard**: Live view of all active orders
- **Order Management**: Update status from Pending → Preparing → Ready → Served
- **Auto-refresh**: Automatic updates without page reload
- **Order Details**: View items, quantities, and timestamps
- **Table Management**: See table assignments and order codes

### Admin Features
- **QR Code Generator**: Generate and download QR codes for tables
- **Table Management**: View and manage restaurant tables

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS  
- **Backend**: SQLite with better-sqlite3
- **QR Codes**: qrcode + qr-scanner libraries
- **Icons**: Lucide React
- **Build Tool**: Vite

## Database Schema

The application uses the following SQLite tables:

- **users**: Customer information
- **tables**: Restaurant table management
- **menu**: Food items and categories
- **orders**: Order tracking and status
- **order_items**: Individual order items

## Getting Started

### Prerequisites
- Node.js 16+

### Setup Instructions

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Start Development**
   ```bash
   npm run dev
   ```
   - The SQLite database will be automatically created with sample data

### Application Modes

Access different parts of the application:

- **Customer Interface**: Default mode - scan QR or enter table details
- **Kitchen Dashboard**: Add `?kitchen=true` to URL
- **QR Generator**: Add `?qr=true` to URL

### Sample Data

The database is pre-populated with:
- 10 sample tables (T01-T10)
- Complete menu with starters, mains, drinks, and desserts
- Proper categorization and pricing

## Usage Guide

### For Customers

1. **Start Ordering**
   - Scan the QR code at your table
   - Or manually enter table number and mobile

2. **Browse Menu**
   - View items by category
   - Add items to cart with quantity
   - See real-time total

3. **Collaborative Ordering**
   - Share the 6-digit order code with tablemates
   - Others can join using "Join Existing Order"
   - All participants can add items

### For Kitchen Staff

1. **View Orders**
   - Access kitchen dashboard at `?kitchen=true`
   - See all active orders in real-time

2. **Update Status**
   - Click buttons to move orders through workflow
   - Pending → Preparing → Ready → Served

3. **Order Details**
   - View table numbers, order codes
   - See itemized lists with quantities
   - Track order timing

### For Restaurant Admin

1. **Generate QR Codes**
   - Access QR generator at `?qr=true`
   - Select table and generate code
   - Download for printing

## Key Business Logic

- **Table Locking**: Only one active order per table
- **Unique Codes**: 6-digit alphanumeric codes for sharing
- **Status Flow**: Enforced order progression
- **Real-time Updates**: Live synchronization across all clients
- **Auto-unlock**: Tables unlock when orders are served

## API Architecture

The application uses a service-based architecture with:
- **ApiService**: Centralized data operations
- **Real-time updates**: Event-based system for live updates
- **Error handling**: Comprehensive error management
- **Type safety**: Full TypeScript coverage

## Security

- **Public access**: Appropriate for restaurant context
- **Input validation**: Client and server-side validation
- **SQL injection protection**: Prepared statements

## Performance

- **Optimized queries**: Proper indexing and joins
- **Real-time efficiency**: Event-based updates
- **Responsive design**: Mobile-first approach
- **Local database**: Fast SQLite operations

## Deployment

The application is ready for production deployment. Note that SQLite database will be created locally:
- Node.js applications
- File system access for SQLite database

Recommended platforms:
- Vercel
- Netlify
- Railway
- Heroku

## Support

For technical issues or feature requests, check the browser console and application logs. The SQLite database file (`restaurant.db`) will be created in the project root.