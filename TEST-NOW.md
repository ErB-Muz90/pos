# 🚀 START TESTING NOW!

## ⚡ 3 Simple Steps

### STEP 1: Start Everything (1 command)
```bash
./start-dev.sh
```

Wait for:
```
✨ Banduka POS Development Environment Started! ✨

📍 Backend API:    http://localhost:3000
📍 Swagger Docs:   http://localhost:3000/api
📍 Frontend App:   http://localhost:5173
```

---

### STEP 2: Open Swagger UI
Click this link: **http://localhost:3000/api**

You should see a beautiful API documentation page with all your endpoints!

---

### STEP 3: Test Your First Sale

#### 3.1 Register a User
1. Find `POST /auth/register` in Swagger
2. Click "Try it out"
3. Copy this:
```json
{
  "email": "admin@banduka.com",
  "password": "Admin@123",
  "fullName": "Test Admin",
  "username": "admin",
  "role": "admin"
}
```
4. Click "Execute"
5. **Copy the `access_token`** from response

#### 3.2 Authorize
1. Click green "Authorize" button at top
2. Enter: `Bearer YOUR_ACCESS_TOKEN`
3. Click "Authorize" then "Close"

#### 3.3 Create Your First Sale
1. Find `POST /sales` endpoint
2. Click "Try it out"
3. Copy this (update IDs as needed):
```json
{
  "branchId": "your-branch-id",
  "items": [
    {
      "productId": "your-product-id",
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
4. Click "Execute"
5. **Success!** You should see HTTP 201 with sale details!

---

## 🎉 What to Test Next

### ✅ Core Features:
- [ ] Open a shift
- [ ] Create multiple sales
- [ ] Generate receipts
- [ ] Void a sale
- [ ] Close shift

### ✅ Other Modules:
- [ ] Add products
- [ ] Manage inventory
- [ ] Add customers
- [ ] View reports

---

## 🆘 Quick Fixes

### Backend not starting?
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

### Can't connect to database?
```bash
sudo systemctl start postgresql
```

### Need to reset everything?
```bash
# Stop servers (Ctrl+C)
cd backend
npx prisma migrate reset
npm run start:dev
```

---

## 📊 Check Your Progress

### View Logs:
```bash
# Backend
tail -f backend.log

# Frontend  
tail -f frontend.log
```

### Check Database:
```bash
psql -U postgres -d banduka_pos
SELECT * FROM "Sale" ORDER BY "createdAt" DESC LIMIT 5;
\q
```

---

## 🎯 Success Indicators

You'll know it's working when:

✅ Swagger UI shows all endpoints
✅ Can register and login
✅ Can create a sale
✅ Receipt number generated
✅ Inventory deducted
✅ No errors in logs

---

## 📞 Need Help?

1. **Check logs:** `tail -f backend.log`
2. **Read full guide:** `TESTING-GUIDE.md`
3. **API tests:** `./test-api.sh`
4. **Quick start:** `QUICK-START.md`

---

## 🎊 You're Ready!

Your POS system has:
- ✅ 80+ API endpoints
- ✅ ACID-compliant transactions
- ✅ Complete sales system
- ✅ Inventory management
- ✅ Customer management
- ✅ Receipt generation
- ✅ Shift management

**Now go test it!** 🚀
