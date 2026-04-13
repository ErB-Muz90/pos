# ✅ ESC/POS Printer Setup Complete!

## 🎉 Your Gprinter is Ready for Direct Access

---

## 📋 Printer Configuration

**Detected Printer:** Gprinter USB Printer  
**Vendor ID:** `0x0471` (decimal: 1137)  
**Product ID:** `0x0055` (decimal: 85)

---

## ✅ What Was Done

1. ✅ **CUPS service stopped** - Prevents driver conflicts
2. ✅ **usblp module unloaded** - Frees USB access
3. ✅ **usblp module blacklisted** - Prevents auto-loading on boot
4. ✅ **udev rule created** - Allows direct USB access
5. ✅ **User added to plugdev group** - Grants permissions
6. ✅ **CUPS restarted** - System printer service available

---

## 🔄 IMPORTANT: Restart Required

**You MUST log out and log back in** (or restart) for the group permissions to take effect.

```bash
# Option 1: Log out and back in (recommended)
# Click your user menu → Log Out

# Option 2: Restart computer
sudo reboot
```

---

## 📝 After Restart - Connect Your Printer

### **Step 1: Open Banduka POS**
```
http://localhost:3006
```

### **Step 2: Go to Hardware Settings**
1. Click **Settings** (gear icon)
2. Click **Hardware** tab

### **Step 3: Connect Printer**
1. Make sure **"ESC/POS Direct"** is selected (not "Browser Print")
2. Click **"Connect Printer"** button
3. Browser will show a device selection dialog
4. Select **"Gprinter USB Printer"**
5. Click **"Connect"**

### **Step 4: Test the Connection**
1. Click **"Test Print"** button
2. Your printer should print a test receipt
3. Click **"Test Drawer"** button
4. Your cash drawer should open (if connected)

### **Step 5: Save Settings**
1. Click **"Save Hardware Settings"**
2. Your printer is now configured!

---

## 🎯 Using Your Printer

### **Automatic Receipt Printing:**
When you complete a sale:
1. ✅ Receipt prints automatically
2. ✅ Cash drawer opens automatically
3. ✅ No print dialog needed
4. ✅ Fast thermal printing

### **Manual Receipt Printing:**
From Sales History:
1. Click on any sale
2. Click **"Print Receipt"**
3. Receipt prints directly to thermal printer

---

## 🔧 Troubleshooting

### **Issue: "Printer not connected" after restart**
**Solution:** Click "Connect Printer" again in Hardware Settings

### **Issue: "Unable to claim interface"**
**Solution:** 
```bash
# Stop CUPS again
sudo systemctl stop cups

# Try connecting again in the app
```

### **Issue: Cash drawer not opening**
**Solution:**
- Ensure drawer is connected to printer's RJ11/RJ12 port
- Test with "Test Drawer" button
- Check drawer cable connection

### **Issue: Printer prints but drawer doesn't open**
**Solution:**
- Some printers have drawer kick disabled by default
- Check printer DIP switches or settings
- Consult printer manual for cash drawer configuration

---

## 💡 Performance Tips

### **For Best ESC/POS Performance:**

Keep CUPS stopped when using the POS:
```bash
# Stop CUPS
sudo systemctl stop cups

# Disable CUPS from auto-starting (optional)
sudo systemctl disable cups
```

### **To Re-enable CUPS (for other printing):**
```bash
# Start CUPS
sudo systemctl start cups

# Enable CUPS auto-start
sudo systemctl enable cups
```

---

## 📊 Your Printer IDs (Save These)

Use these values if you need to manually configure:

```
Vendor ID (Hex):     0x0471
Vendor ID (Decimal): 1137

Product ID (Hex):    0x0055
Product ID (Decimal): 85
```

---

## 🎨 Receipt Format

Your receipts are configured with:
- ✅ Professional thermal printer layout
- ✅ 80mm paper width (48 characters)
- ✅ ESC/POS commands for formatting
- ✅ Bold headers and totals
- ✅ Proper text alignment
- ✅ Auto paper cut
- ✅ Cash drawer kick command

---

## 🔐 Security Note

The udev rule created allows **any user in the plugdev group** to access this specific printer. This is safe for a POS system but be aware of the permission.

**Rule Location:** `/etc/udev/rules.d/99-banduka-escpos.rules`

---

## 🚀 Quick Start Commands

```bash
# Check if printer is detected
lsusb | grep Gprinter

# Check if usblp module is loaded (should be empty)
lsmod | grep usblp

# Check CUPS status
systemctl status cups

# Stop CUPS for POS use
sudo systemctl stop cups

# View udev rule
cat /etc/udev/rules.d/99-banduka-escpos.rules

# Check your groups (should include plugdev)
groups
```

---

## ✅ Next Steps

1. **Log out and log back in** (or restart)
2. **Open Banduka POS** at http://localhost:3006
3. **Connect printer** in Settings → Hardware
4. **Test print** to verify everything works
5. **Make a test sale** to see automatic printing!

---

## 🎉 You're All Set!

Your Gprinter is now configured for direct ESC/POS access. After you log back in, you'll have:

- ⚡ Fast direct printing
- 🔓 Automatic cash drawer opening
- 📄 Professional thermal receipts
- 🚫 No print dialogs
- ✨ True POS experience

**Enjoy your Banduka POS system!** 🎊
