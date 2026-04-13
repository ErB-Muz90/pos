# 🧪 Banduka POS - Complete Testing Guide

## 📋 Prerequisites Checklist

### Backend Requirements:
- [x] Node.js 18+ installed
- [x] PostgreSQL 16+ running
- [x] Redis running (optional for now)
- [ ] Environment variables configured

### Frontend Requirements:
- [x] Node.js 18+ installed
- [ ] Backend API URL configured
- [ ] Environment variables set

---

## 🚀 STEP 1: Backend Setup & Start

### 1.1 Configure Backend Environment

```bash
cd /home/elb/Pictures/banduka-pos/backend

# Create .env file if not exists
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/banduka_pos?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development

# Redis (optional for now)
REDIS_HOST=localhost
REDIS_PORT=6379

# eTIMS (Phase 6 - not needed yet)
ETIMS_API_URL=https://etims-api-sbx.kra.go.ke
ETIMS_API_KEY=your-etims-key
EOF
```

### 1.2 Install Dependencies

```bash
cd /home/elb/Pictures/banduka-pos/backend

# Install packages
npm install

# Generate Prisma client
npx prisma generate
```

### 1.3 Setup Database

```bash
# Create database (if not exists)
createdb banduka_pos

# Run migrations
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed
```

### 1.4 Start Backend Server

```bash
# Development mode with hot reload
npm run start:dev

# You should see:
# [Nest] 12345  - 11/05/2025, 7:35:00 AM     LOG [NestApplication] Nest application successfully started
# [Nest] 12345  - 11/05/2025, 7:35:00 AM     LOG Application is running on: http://localhost:3000
```

### 1.5 Verify Backend is Running

Open browser and visit:
- **API Health:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api
- **Expected Response:** `{"message": "Banduka POS API is running"}`

---

## 🎨 STEP 2: Frontend Setup & Start

### 2.1 Configure Frontend Environment

```bash
cd /home/elb/Pictures/banduka-pos

# Create .env.local file
cat > .env.local << 'EOF'
# Backend API URL
VITE_API_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# App Configuration
VITE_APP_NAME=Banduka POS
VITE_APP_VERSION=1.0.0

# Environment
NODE_ENV=development
EOF
```

### 2.2 Install Frontend Dependencies

```bash
cd /home/elb/Pictures/banduka-pos

# Install packages
npm install
```

### 2.3 Start Frontend Development Server

```bash
# Start with Vite
npm run dev

# OR if using Next.js
npm run dev

# You should see:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

### 2.4 Verify Frontend is Running

Open browser and visit:
- **Frontend:** http://localhost:5173 (Vite) or http://localhost:3000 (Next.js)
- **Expected:** Login page or dashboard

---

## 🔗 STEP 3: Test Backend-Frontend Connection

### 3.1 Test API Connection from Browser Console

Open browser console (F12) and run:

```javascript
// Test 1: Check API is reachable
fetch('http://localhost:3000')
  .then(r => r.json())
  .then(data => console.log('✅ API Connected:', data))
  .catch(err => console.error('❌ API Error:', err));

// Test 2: Check CORS is configured
fetch('http://localhost:3000/api', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(r => console.log('✅ CORS OK:', r.status))
  .catch(err => console.error('❌ CORS Error:', err));
```

### 3.2 Fix CORS Issues (if needed)

If you get CORS errors, update backend CORS configuration:

**File:** `/home/elb/Pictures/banduka-pos/backend/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-idempotency-key'],
  });

  await app.listen(3000);
}
```

---

## 🧪 STEP 4: End-to-End Testing Flow

### 4.1 User Registration & Login

#### Option A: Using Swagger UI (http://localhost:3000/api)

1. **Register User:**
   - Navigate to `POST /auth/register`
   - Click "Try it out"
   - Enter:
   ```json
   {
     "organizationId": "create-new-org",
     "email": "admin@test.com",
     "password": "Admin@123",
     "fullName": "Test Admin",
     "username": "admin"
   }
   ```
   - Click "Execute"
   - Copy the `access_token` from response

2. **Login:**
   - Navigate to `POST /auth/login`
   - Enter:
   ```json
   {
     "username": "admin",
     "password": "Admin@123"
   }
   ```
   - Copy the `access_token`

3. **Authorize:**
   - Click the "Authorize" button at top
   - Enter: `Bearer YOUR_TOKEN_HERE`
   - Click "Authorize"

#### Option B: Using Frontend

1. Open http://localhost:5173
2. Click "Register" or "Sign Up"
3. Fill in registration form
4. Login with credentials
5. Token should be stored automatically

### 4.2 Test Complete Sales Flow

#### Step 1: Open a Shift

**API Request:**
```bash
curl -X POST http://localhost:3000/sales/shifts/open \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": "YOUR_BRANCH_ID",
    "openingCash": 5000
  }'
```

**Expected Response:**
```json
{
  "id": "shift-uuid",
  "shiftNumber": "SH-20241105-ADMIN-001",
  "openingCash": 5000,
  "status": "open"
}
```

#### Step 2: Create a Sale

**API Request:**
```bash
curl -X POST http://localhost:3000/sales \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: sale-001" \
  -d '{
    "branchId": "YOUR_BRANCH_ID",
    "shiftId": "YOUR_SHIFT_ID",
    "items": [
      {
        "productId": "YOUR_PRODUCT_ID",
        "quantity": 2,
        "unitPrice": 100,
        "taxRate": 16,
        "discount": 0
      }
    ],
    "paymentMethod": "cash",
    "discount": 0
  }'
```

**Expected Response:**
```json
{
  "id": "sale-uuid",
  "receiptNumber": "SALE-20241105-BR1-000001",
  "totalAmount": 232,
  "status": "completed"
}
```

#### Step 3: Get Receipt

**API Request:**
```bash
curl -X GET http://localhost:3000/sales/SALE_ID/receipt \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Step 4: Close Shift

**API Request:**
```bash
curl -X POST http://localhost:3000/sales/shifts/SHIFT_ID/close \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "closingCash": 5232,
    "notes": "All balanced"
  }'
```

---

## 🎯 STEP 5: Frontend Testing Checklist

### Dashboard Tests:
- [ ] Login page loads
- [ ] Login with credentials works
- [ ] Dashboard displays after login
- [ ] User profile shows in header
- [ ] Navigation menu works

### Sales Module Tests:
- [ ] POS/Sales page loads
- [ ] Product search works
- [ ] Add items to cart
- [ ] Apply discounts
- [ ] Select payment method
- [ ] Complete sale
- [ ] Print receipt
- [ ] View sale history

### Inventory Tests:
- [ ] View product list
- [ ] Search products
- [ ] View product details
- [ ] Check stock levels
- [ ] Low stock alerts show

### Customers Tests:
- [ ] View customer list
- [ ] Search customers
- [ ] Add new customer
- [ ] View customer details
- [ ] View purchase history

### Shifts Tests:
- [ ] Open shift button works
- [ ] Current shift displays
- [ ] Sales count updates
- [ ] Close shift works
- [ ] Cash reconciliation calculates

---

## 🐛 STEP 6: Common Issues & Solutions

### Issue 1: Backend won't start

**Error:** `Cannot find module '@nestjs/common'`

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: Database connection error

**Error:** `Connection refused to localhost:5432`

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U postgres -c "SELECT version();"
```

### Issue 3: Prisma client not generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
cd backend
npx prisma generate
```

### Issue 4: CORS errors in browser

**Error:** `Access to fetch blocked by CORS policy`

**Solution:**
- Update `main.ts` CORS configuration (see Step 3.2)
- Restart backend server

### Issue 5: Frontend can't connect to backend

**Error:** `Network Error` or `Failed to fetch`

**Solution:**
```bash
# Check backend is running
curl http://localhost:3000

# Check environment variables
cat .env.local

# Verify API URL is correct
echo $VITE_API_URL
```

### Issue 6: Authentication errors

**Error:** `401 Unauthorized`

**Solution:**
- Check JWT token is valid
- Token might be expired (7 days default)
- Login again to get new token
- Check token is sent in Authorization header

---

## 📊 STEP 7: Verify Data in Database

### Connect to Database:
```bash
# Using psql
psql -U postgres -d banduka_pos

# OR using Prisma Studio
cd backend
npx prisma studio
```

### Check Tables:
```sql
-- View all tables
\dt

-- Check sales
SELECT * FROM "Sale" ORDER BY "createdAt" DESC LIMIT 5;

-- Check inventory movements
SELECT * FROM "InventoryMovement" ORDER BY "createdAt" DESC LIMIT 10;

-- Check shifts
SELECT * FROM "Shift" WHERE status = 'open';

-- Check users
SELECT id, username, email, role FROM "User";
```

---

## 🎬 STEP 8: Quick Start Script

Create a quick start script:

**File:** `/home/elb/Pictures/banduka-pos/start-dev.sh`

```bash
#!/bin/bash

echo "🚀 Starting Banduka POS Development Environment..."

# Start PostgreSQL (if not running)
sudo systemctl start postgresql

# Start Backend
echo "📦 Starting Backend..."
cd backend
npm run start:dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start Frontend
echo "🎨 Starting Frontend..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo ""
echo "📍 Backend:  http://localhost:3000"
echo "📍 Frontend: http://localhost:5173"
echo "📍 Swagger:  http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
```

**Make it executable:**
```bash
chmod +x start-dev.sh
```

**Run it:**
```bash
./start-dev.sh
```

---

## ✅ STEP 9: Success Criteria

Your system is working correctly if:

### Backend:
- ✅ Server starts without errors
- ✅ Swagger UI accessible at http://localhost:3000/api
- ✅ Database connection successful
- ✅ All endpoints return 200/201 (with auth)
- ✅ Sales transactions complete successfully
- ✅ Inventory updates correctly
- ✅ Receipts generate properly

### Frontend:
- ✅ App loads without errors
- ✅ Login/Register works
- ✅ Dashboard displays data
- ✅ Can create sales
- ✅ Can view products/customers
- ✅ Real-time updates work
- ✅ No console errors

### Integration:
- ✅ Frontend can call backend APIs
- ✅ Authentication works end-to-end
- ✅ Data syncs between frontend and backend
- ✅ Real-time updates reflect in UI
- ✅ Receipts print/display correctly

---

## 🎯 Next Steps After Testing

Once everything is working:

1. **Phase 6:** Implement eTIMS Integration
2. **Phase 8:** Add Offline Sync
3. **Phase 9:** Build Reports Module
4. **Phase 10:** Write comprehensive tests
5. **Phase 11:** Add monitoring & logging
6. **Phase 12:** Create deployment docs

---

## 📞 Need Help?

If you encounter issues:

1. Check logs:
   - Backend: Terminal where `npm run start:dev` is running
   - Frontend: Browser console (F12)
   - Database: PostgreSQL logs

2. Verify environment:
   ```bash
   node --version  # Should be 18+
   npm --version
   psql --version  # Should be 16+
   ```

3. Check all services are running:
   ```bash
   # Backend
   curl http://localhost:3000
   
   # Frontend
   curl http://localhost:5173
   
   # Database
   psql -U postgres -c "SELECT 1"
   ```

---

**🎉 Happy Testing! Your POS system is ready to go!**
