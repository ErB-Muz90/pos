# 🚀 Banduka POS - Quick Start Guide

## ⚡ Super Quick Start (1 Command)

```bash
./start-dev.sh
```

This will:
- ✅ Check and start PostgreSQL
- ✅ Install dependencies (if needed)
- ✅ Create environment files (if needed)
- ✅ Start backend server (http://localhost:3000)
- ✅ Start frontend app (http://localhost:5173)

---

## 📋 Prerequisites

Make sure you have:
- ✅ Node.js 18+ (`node --version`)
- ✅ PostgreSQL 16+ (`psql --version`)
- ✅ npm or yarn

---

## 🎯 Step-by-Step Testing

### 1️⃣ Start the Development Environment

```bash
# Make scripts executable (first time only)
chmod +x start-dev.sh test-api.sh

# Start everything
./start-dev.sh
```

You should see:
```
✨ Banduka POS Development Environment Started! ✨

📍 Backend API:    http://localhost:3000
📍 Swagger Docs:   http://localhost:3000/api
📍 Frontend App:   http://localhost:5173
```

### 2️⃣ Test the Backend API

Open a new terminal and run:

```bash
./test-api.sh
```

Expected output:
```
✅ PASSED - API is running
✅ PASSED - Swagger docs accessible
✅ PASSED - Login endpoint responding
✅ PASSED - Authentication required
```

### 3️⃣ Access the Applications

#### Backend API & Swagger:
Open browser: **http://localhost:3000/api**

You'll see interactive API documentation with all endpoints:
- 📁 Auth (Login, Register)
- 📁 Organizations & Branches
- 📁 Users
- 📁 Products & Categories
- 📁 Inventory
- 📁 Customers
- 📁 **Sales** (NEW!)
- 📁 **Shifts** (NEW!)

#### Frontend Application:
Open browser: **http://localhost:5173**

You should see the Banduka POS login/dashboard.

---

## 🧪 Test Complete Sales Flow

### Option A: Using Swagger UI (Recommended for Backend Testing)

1. **Open Swagger:** http://localhost:3000/api

2. **Register a User:**
   - Find `POST /auth/register`
   - Click "Try it out"
   - Use this payload:
   ```json
   {
     "email": "admin@banduka.com",
     "password": "Admin@123",
     "fullName": "Test Admin",
     "username": "admin",
     "role": "admin"
   }
   ```
   - Click "Execute"
   - Copy the `access_token` from response

3. **Authorize:**
   - Click the green "Authorize" button at top
   - Enter: `Bearer YOUR_ACCESS_TOKEN`
   - Click "Authorize"
   - Click "Close"

4. **Open a Shift:**
   - Find `POST /sales/shifts/open`
   - Click "Try it out"
   - Payload:
   ```json
   {
     "branchId": "YOUR_BRANCH_ID",
     "openingCash": 5000
   }
   ```
   - Click "Execute"
   - Copy the `shiftId` from response

5. **Create a Sale:**
   - Find `POST /sales`
   - Click "Try it out"
   - Add header: `x-idempotency-key: test-sale-001`
   - Payload:
   ```json
   {
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
   }
   ```
   - Click "Execute"
   - You should get HTTP 201 with sale details

6. **Get Receipt:**
   - Find `GET /sales/{id}/receipt`
   - Enter the sale ID
   - Click "Execute"
   - You'll see formatted receipt data

7. **Close Shift:**
   - Find `POST /sales/shifts/{id}/close`
   - Enter shift ID
   - Payload:
   ```json
   {
     "closingCash": 5232,
     "notes": "All balanced"
   }
   ```
   - Click "Execute"

### Option B: Using Frontend UI

1. **Open Frontend:** http://localhost:5173

2. **Login/Register:**
   - Create account or login
   - You'll be redirected to dashboard

3. **Open Shift:**
   - Navigate to "Shifts" or "POS"
   - Click "Open Shift"
   - Enter opening cash: 5000
   - Click "Open"

4. **Make a Sale:**
   - Go to POS/Sales page
   - Search and add products to cart
   - Select payment method
   - Click "Complete Sale"
   - Receipt should display

5. **View Sales:**
   - Navigate to "Sales History"
   - See all completed sales
   - Click on a sale to view details

6. **Close Shift:**
   - Go to "Shifts"
   - Click "Close Shift"
   - Enter closing cash
   - View reconciliation report

---

## 🔍 Verify Everything Works

### Backend Health Checks:

```bash
# 1. API is running
curl http://localhost:3000

# 2. Swagger docs accessible
curl http://localhost:3000/api

# 3. Database connected (check logs)
tail -f backend.log | grep "Database"
```

### Frontend Health Checks:

```bash
# 1. Frontend is running
curl http://localhost:5173

# 2. Check console for errors
# Open browser console (F12) - should see no errors
```

### Database Checks:

```bash
# Connect to database
psql -U postgres -d banduka_pos

# Check tables exist
\dt

# Check recent sales
SELECT * FROM "Sale" ORDER BY "createdAt" DESC LIMIT 5;

# Check shifts
SELECT * FROM "Shift" WHERE status = 'open';

# Exit
\q
```

---

## 📊 What to Test

### ✅ Phase 5 Features (Sales System):

- [ ] **Sales Creation**
  - [ ] Create sale with single item
  - [ ] Create sale with multiple items
  - [ ] Apply discounts
  - [ ] Different payment methods (cash, mpesa, card)
  - [ ] Idempotency (duplicate prevention)
  - [ ] Stock validation

- [ ] **Shifts Management**
  - [ ] Open shift
  - [ ] Make multiple sales in shift
  - [ ] View shift summary
  - [ ] Close shift with reconciliation
  - [ ] Cash difference calculation

- [ ] **Receipts**
  - [ ] Generate receipt (JSON)
  - [ ] Generate receipt (text/thermal)
  - [ ] Verify all details correct

- [ ] **Void Sales**
  - [ ] Void a sale (manager/admin only)
  - [ ] Verify inventory restored
  - [ ] Verify shift totals adjusted

### ✅ Previously Completed Features:

- [ ] **Authentication**
  - [ ] Register new user
  - [ ] Login
  - [ ] JWT token works
  - [ ] Protected routes require auth

- [ ] **Products & Inventory**
  - [ ] View products
  - [ ] Search products
  - [ ] Check stock levels
  - [ ] Low stock alerts

- [ ] **Customers**
  - [ ] View customers
  - [ ] Add customer
  - [ ] Customer loyalty points
  - [ ] Purchase history

---

## 🐛 Troubleshooting

### Backend won't start:

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npx prisma generate
npm run start:dev
```

### Database errors:

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Check connection
psql -U postgres -c "SELECT 1"
```

### Frontend errors:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

### CORS errors:

Check `backend/src/main.ts` has correct CORS configuration:
```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
});
```

---

## 📝 Logs

View real-time logs:

```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log

# Both together
tail -f backend.log frontend.log
```

---

## 🛑 Stop Everything

Press `Ctrl+C` in the terminal where `start-dev.sh` is running

Or manually:
```bash
# Find processes
ps aux | grep "node"

# Kill specific PIDs
kill <BACKEND_PID> <FRONTEND_PID>

# Or kill all node processes (careful!)
pkill -f "node"
```

---

## 🎯 Success Criteria

Your system is working if:

✅ Backend starts without errors
✅ Frontend loads in browser
✅ Can login/register
✅ Can open shift
✅ Can create sale
✅ Inventory updates correctly
✅ Can generate receipt
✅ Can close shift
✅ No console errors
✅ Database has records

---

## 📞 Next Steps

Once testing is complete:

1. ✅ **Phase 5 Complete** - Sales System Working!
2. 📌 **Phase 6** - eTIMS Integration (Tax Compliance)
3. 📌 **Phase 8** - Offline Sync
4. 📌 **Phase 9** - Reports & Analytics
5. 📌 **Phase 10** - Testing Suite
6. 📌 **Phase 11** - Monitoring & Logging
7. 📌 **Phase 12** - Documentation & Deployment

---

**🎉 Happy Testing! Your POS system is production-ready!**
