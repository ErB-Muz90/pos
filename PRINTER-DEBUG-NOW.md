# 🔧 Printer Connection Debugging - IMMEDIATE STEPS

## 📊 Current Status

**Issue:** Empty error `{}` when connecting printer  
**Printer:** Gprinter (VID: 0x0471, PID: 0x0055)  
**System:** Linux, CUPS stopped, usblp removed  

---

## 🎯 Step-by-Step Debugging

### **Step 1: Test with Diagnostic Tool**

I've created a standalone WebUSB test page. Open it now:

```
http://localhost:8080/test-webusb.html
```

**In the diagnostic tool:**
1. Click **"1. Check WebUSB Support"** - Should show ✅
2. Click **"2. List Permitted Devices"** - Shows if printer already has permission
3. Click **"3. Request Printer"** - Browser dialog to select printer
4. Click **"4. Test Connection"** - Sends test print

**This will show detailed error messages!**

---

### **Step 2: Check Current System Status**

Run these commands to verify setup:

```bash
# 1. Verify printer is connected
lsusb | grep Gprinter
# Should show: Bus 001 Device 004: ID 0471:0055 Philips (or NXP) Gprinter

# 2. Verify usblp is NOT loaded
lsmod | grep usblp
# Should be empty (no output)

# 3. Verify CUPS is stopped
systemctl status cups
# Should show: inactive (dead)

# 4. Check udev rule
cat /etc/udev/rules.d/99-banduka-escpos.rules
# Should show rule for 0471:0055

# 5. Verify you're in plugdev group
groups
# Should include: plugdev
```

---

### **Step 3: Try Manual Connection Test**

Open browser console (F12) and run:

```javascript
// Check WebUSB
console.log('WebUSB available:', !!navigator.usb);

// List devices
navigator.usb.getDevices().then(devices => {
    console.log('Permitted devices:', devices);
    devices.forEach(d => {
        console.log(`  - ${d.productName} (${d.vendorId}:${d.productId})`);
    });
});

// Request device
navigator.usb.requestDevice({ filters: [] })
    .then(device => {
        console.log('Selected device:', device);
        return device.open();
    })
    .then(() => console.log('Device opened'))
    .catch(err => {
        console.error('Error:', err);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
    });
```

---

### **Step 4: Common Issues & Fixes**

#### **Issue: "NotFoundError" or user cancels**
**Cause:** User cancelled the device selection dialog  
**Fix:** Click "Connect Printer" again and select the device

#### **Issue: "SecurityError" or "Access denied"**
**Cause:** Browser security or permissions  
**Fix:**
```bash
# Ensure you're on localhost or HTTPS
# Current URL should be: http://localhost:3006
```

#### **Issue: "Unable to claim interface"**
**Cause:** Another process is using the printer  
**Fix:**
```bash
# Stop CUPS completely
sudo systemctl stop cups cups.socket cups.path

# Remove usblp module
sudo rmmod usblp

# Kill any other printer processes
sudo pkill -f cups
sudo pkill -f usblp

# Unplug and replug the printer
```

#### **Issue: Empty error `{}`**
**Cause:** Error not being caught properly  
**Fix:** I've added detailed logging - refresh the page and try again

---

### **Step 5: Fresh Start (Nuclear Option)**

If nothing works, do a complete reset:

```bash
# 1. Unplug printer physically

# 2. Stop all printer services
sudo systemctl stop cups cups.socket cups.path
sudo pkill -f cups

# 3. Remove kernel module
sudo rmmod usblp

# 4. Clear browser permissions
# In Chrome: Settings → Privacy → Site Settings → USB devices
# Remove all devices

# 5. Plug printer back in

# 6. Wait 5 seconds

# 7. Open http://localhost:3006

# 8. Go to Settings → Hardware

# 9. Click "Connect Printer"

# 10. Select Gprinter from dialog
```

---

## 🔍 What the Updated Code Does

I've added detailed error logging to `/utils/escpos.ts`:

```typescript
console.log("Full error object:", error);
console.log("Error name:", error?.name);
console.log("Error message:", error?.message);
console.log("Error type:", typeof error);
console.log("Error keys:", Object.keys(error || {}));
```

**Now when you try to connect, check the browser console (F12) for:**
- Full error details
- Error type
- Error properties

---

## 📱 Browser Console Shortcuts

- **Chrome/Edge:** `F12` or `Ctrl+Shift+I`
- **Console tab:** Shows all logs
- **Look for:** Red error messages with details

---

## ✅ Success Indicators

When connection works, you'll see:

```
✅ Printer connected: Gprinter USB Printer
✅ Interface claimed
✅ Found OUT endpoint: 1
```

---

## 🎯 Next Steps After Debugging

Once you identify the specific error:

1. **NotFoundError** → User cancelled, try again
2. **SecurityError** → Check HTTPS/localhost
3. **NetworkError** → Driver conflict, stop CUPS
4. **InvalidStateError** → Device busy, unplug/replug
5. **Other** → Share the error message for specific fix

---

## 🚀 Quick Test Commands

```bash
# Test 1: Diagnostic tool
open http://localhost:8080/test-webusb.html

# Test 2: Main app
open http://localhost:3006

# Test 3: Check printer
lsusb | grep -i printer

# Test 4: Check module
lsmod | grep usblp

# Test 5: Check CUPS
systemctl is-active cups
```

---

## 📞 Report Back

After testing, share:
1. ✅ What the diagnostic tool shows
2. ✅ Any error messages from browser console
3. ✅ Output of the verification commands
4. ✅ Whether test print worked

**Let's get your printer working!** 🎉
