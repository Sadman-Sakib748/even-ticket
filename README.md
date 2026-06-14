# EventWave Backend API

RESTful API for EventWave platform built with Express.js, MongoDB, Mongoose, and JWT authentication.

## 📋 Features

- ✅ JWT-based authentication with refresh tokens
- ✅ User management (User, Organizer, Admin roles)
- ✅ Event CRUD operations with filters
- ✅ Category management
- ✅ Transaction & Payment handling
- ✅ Ticket generation with QR codes
- ✅ Coupon system
- ✅ Role-based access control (RBAC)
- ✅ Input validation with Zod
- ✅ Error handling middleware
- ✅ Rate limiting & security headers
- ✅ CORS enabled

## 🛠 Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.0+
- **Database**: MongoDB 6.0+
- **ODM**: Mongoose 7.0+
- **Authentication**: JWT (JSON Web Token)
- **Password**: bcryptjs
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting
- **Utilities**: Slugify, QRCode, PDFKit, Nodemailer

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- npm or yarn

### Steps

1. **Clone and navigate to backend**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eventwave
JWT_SECRET=your_secret_key_here
CORS_ORIGIN=http://localhost:3000
```

4. **Start MongoDB**
```bash
# If using MongoDB locally
mongod
```

5. **Run development server**
```bash
npm run dev
```

Server will start on `http://localhost:5000`

6. **Build for production**
```bash
npm run build
npm start
```

## 🗂 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.config.ts       # MongoDB connection
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Event.model.ts
│   │   ├── Category.model.ts
│   │   ├── Transaction.model.ts
│   │   ├── Ticket.model.ts
│   │   └── Coupon.model.ts
│   ├── services/
│   │   ├── auth.service.ts          # Business logic
│   │   ├── event.service.ts
│   │   └── category.service.ts
│   ├── controllers/
│   │   ├── auth.controller.ts       # Request handling
│   │   ├── event.controller.ts
│   │   └── category.controller.ts
│   ├── routes/
│   │   └── v1/
│   │       ├── auth.routes.ts
│   │       ├── event.routes.ts
│   │       └── category.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT verification
│   │   └── error.middleware.ts      # Error handling
│   ├── validations/
│   │   ├── auth.validation.ts       # Zod schemas
│   │   └── event.validation.ts
│   ├── utils/
│   │   ├── jwt.util.ts
│   │   ├── password.util.ts
│   │   └── response.util.ts
│   └── app.ts                       # Entry point
├── .env                             # Environment variables
├── .env.example
├── tsconfig.json
├── nodemon.json
└── package.json
```

## 🔐 Authentication

### Register
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Using Token
```bash
Authorization: Bearer eyJhbGc...
```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/profile` - Update profile
- `PUT /api/v1/auth/change-password` - Change password

### Events
- `GET /api/v1/events` - Get all events (with filters)
- `GET /api/v1/events/:id` - Get event by ID
- `GET /api/v1/events/slug/:slug` - Get event by slug
- `POST /api/v1/events` - Create event (Organizer)
- `PUT /api/v1/events/:id` - Update event (Organizer)
- `DELETE /api/v1/events/:id` - Delete event (Organizer)
- `GET /api/v1/events/my-events` - Get organizer's events
- `GET /api/v1/events/featured` - Get featured events

### Categories
- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories` - Create category (Admin)
- `PUT /api/v1/categories/:id` - Update category (Admin)
- `DELETE /api/v1/categories/:id` - Delete category (Admin)

## 📊 Event Filters

```bash
GET /api/v1/events?search=tech&category=Technology&minPrice=0&maxPrice=100&page=1&limit=10
```

Query Parameters:
- `search` - Search in title/description
- `category` - Filter by category slug
- `location` - Filter by location
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `sortBy` - Sort field (default: date)
- `sortOrder` - asc or desc
- `page` - Page number
- `limit` - Items per page

## 🔒 Roles & Permissions

### User
- Register & login
- View events
- Register for events
- Like & rate events

### Organizer
- All User permissions
- Create & manage own events
- View attendees
- Manage tickets

### Admin
- All permissions
- Manage all users
- Manage all events
- View analytics
- Manage categories & coupons

## ✅ Validation

All inputs are validated using Zod. Invalid data returns:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 2,
      "type": "string",
      "path": ["name"],
      "message": "String must contain at least 2 character(s)"
    }
  ]
}
```

## 🐛 Error Handling

Standard error responses:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "error": "Additional details"
}
```

HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 📝 Environment Variables

```
# Server
PORT=5000
NODE_ENV=development
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/eventwave

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Services (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🚀 Deployment

### Prepare for Production
1. Build TypeScript:
```bash
npm run build
```

2. Update environment variables:
```bash
NODE_ENV=production
MONGODB_URI=your_production_db_uri
```

3. Start server:
```bash
npm start
```

### Vercel Deployment
```bash
vercel deploy
```

## 📞 Support

For issues and questions, please create an issue in the repository.

## 📄 License

MIT License
