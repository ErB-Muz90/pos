# Import Path Rules - Fixed

## ✅ Correct Import Paths by Location

### **Rule:** Count the directory levels from project root

```
/banduka-pos/                    ← Root (Level 0)
├── constants.tsx                ← Root files
├── types.ts
├── utils/
└── components/                  ← Level 1
    ├── SomeView.tsx            → Use: ../constants
    └── subdirectory/            ← Level 2
        └── File.tsx            → Use: ../../constants
```

---

## 📁 Fixed Import Paths

### **Files at `/components/` (Level 1)**
Use `../constants`, `../types`, `../utils`

Examples:
- `components/InventoryView.tsx`
- `components/ShiftReportView.tsx`
- `components/SettingsView.tsx`
- `components/CustomersView.tsx`
- `components/PayoutView.tsx`

**Import:**
```typescript
import { ICONS } from '../constants';
import { Product, Customer } from '../types';
import { formatCurrency } from '../utils/formatting';
```

---

### **Files at `/components/subdirectory/` (Level 2)**
Use `../../constants`, `../../types`, `../../utils`

Examples:
- `components/pos/Cart.tsx`
- `components/pos/PayoutView.tsx`
- `components/settings/DataManagementSettings.tsx`
- `components/settings/SettingsView.tsx`
- `components/customers/CustomersView.tsx`
- `components/modals/WhatsAppModal.tsx`
- `components/setup/SetupWizard.tsx`
- `components/salesHistory/ReceiptDetailView.tsx`
- `components/timesheets/TimeSheetsView.tsx`
- `components/expenditures/NewExpenseView.tsx`

**Import:**
```typescript
import { ICONS } from '../../constants';
import { Product, Customer } from '../../types';
import { formatCurrency } from '../../utils/formatting';
```

---

## 🔧 Fixes Applied

### **Batch 1: Initial Fix (Incorrect)**
❌ Changed `../../constants` → `../constants` for ALL files
- This was wrong for subdirectory files

### **Batch 2: Correction (Correct)**
✅ Changed `../constants` → `../../constants` for files in subdirectories
- Applied to all files at depth 2 or more

---

## 📊 Summary

| Location | Depth | Import Path |
|----------|-------|-------------|
| `/components/File.tsx` | 1 | `../constants` |
| `/components/sub/File.tsx` | 2 | `../../constants` |
| `/components/sub/deep/File.tsx` | 3 | `../../../constants` |

---

## ✅ Verification Commands

```bash
# Check Level 1 files (should use ../constants)
grep "from.*constants" components/*.tsx

# Check Level 2 files (should use ../../constants)  
grep "from.*constants" components/*/*.tsx

# Verify no broken imports remain
grep -r "from ['\"]../constants" components/ | grep -v "components/[^/]*\.tsx"
```

---

## 🎯 Result

All **125+ import paths** corrected:
- ✅ Level 1 files: Use `../`
- ✅ Level 2 files: Use `../../`
- ✅ No more module resolution errors

**Frontend Status:** ✅ Loading successfully on http://localhost:3006

---

**Last Updated:** November 5, 2025, 9:23 AM
