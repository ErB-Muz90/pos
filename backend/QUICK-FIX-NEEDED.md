# Backend Quick Fixes Needed

## 🔴 Current Status: Backend Won't Start

TypeScript compilation errors due to Prisma schema mismatches.

---

## 🐛 Errors Found:

### **1. UserSession Model Missing**
**Error:** `Property 'userSession' does not exist on type 'PrismaService'`
**Files:** `auth.service.ts` lines 342, 388, 400
**Fix:** Add `UserSession` model to Prisma schema OR remove session tracking code

### **2. Customer Model Field Mismatches**
**Error:** `Property 'code' does not exist` / `Property 'type' does not exist`
**Files:** `customers.service.ts` lines 20, 173, 258, 261
**Issue:** Schema has `customerCode` but code expects `code`
**Fix:** Update code to use `customerCode` instead of `code`

### **3. Sales Model Field Mismatches**
**Error:** Various property mismatches
**Files:** `sales.service.ts`
**Fix:** Align code with Prisma schema fields

---

## ⚡ Quick Fix Strategy

### **Option 1: Update Code to Match Schema** (Recommended - 30 mins)
- Fix field names in service files
- Remove UserSession references
- Regenerate Prisma client
- Restart backend

### **Option 2: Update Schema to Match Code** (1 hour)
- Add missing models (UserSession)
- Rename fields to match code expectations
- Run migrations
- Regenerate Prisma client

---

## 🎯 Immediate Action

Let me fix the code to match the existing Prisma schema (Option 1).

This will get the backend running quickly so we can then implement Phase 6 (Cloud Sync).

---

**Fixing now...**
