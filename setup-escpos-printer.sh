#!/bin/bash

# ESC/POS Printer Setup Script for Banduka POS
# This script configures your system to allow direct USB access to thermal printers

echo "================================================"
echo "  ESC/POS Printer Setup for Banduka POS"
echo "================================================"
echo ""

# Detect the printer
echo "🔍 Detecting thermal printer..."
PRINTER_INFO=$(lsusb | grep -i "printer\|pos\|thermal\|epson\|star\|bixolon\|citizen\|gprinter")

if [ -z "$PRINTER_INFO" ]; then
    echo "❌ No thermal printer detected!"
    echo "   Please ensure your printer is plugged in via USB."
    exit 1
fi

echo "✅ Found printer:"
echo "   $PRINTER_INFO"
echo ""

# Extract Vendor ID and Product ID
VENDOR_ID=$(echo "$PRINTER_INFO" | grep -oP 'ID \K[0-9a-f]{4}(?=:)')
PRODUCT_ID=$(echo "$PRINTER_INFO" | grep -oP 'ID [0-9a-f]{4}:\K[0-9a-f]{4}')

echo "📋 Printer Details:"
echo "   Vendor ID:  $VENDOR_ID"
echo "   Product ID: $PRODUCT_ID"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script needs sudo privileges to configure USB access."
    echo "   Please run: sudo ./setup-escpos-printer.sh"
    exit 1
fi

echo "🔧 Configuring system for ESC/POS access..."
echo ""

# Step 1: Stop CUPS temporarily
echo "1️⃣  Stopping CUPS printer service..."
systemctl stop cups
echo "   ✅ CUPS stopped"
echo ""

# Step 2: Unload USB printer kernel module
echo "2️⃣  Unloading USB printer kernel module..."
if lsmod | grep -q usblp; then
    rmmod usblp 2>/dev/null
    echo "   ✅ usblp module unloaded"
else
    echo "   ℹ️  usblp module not loaded"
fi
echo ""

# Step 3: Blacklist usblp module to prevent auto-loading
echo "3️⃣  Preventing automatic loading of usblp module..."
if ! grep -q "blacklist usblp" /etc/modprobe.d/blacklist-usblp.conf 2>/dev/null; then
    echo "blacklist usblp" > /etc/modprobe.d/blacklist-usblp.conf
    echo "   ✅ usblp module blacklisted"
else
    echo "   ℹ️  usblp already blacklisted"
fi
echo ""

# Step 4: Create udev rule for the printer
echo "4️⃣  Creating udev rule for direct USB access..."
UDEV_RULE="# Banduka POS - ESC/POS Printer Access
SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"$VENDOR_ID\", ATTRS{idProduct}==\"$PRODUCT_ID\", MODE=\"0666\", GROUP=\"plugdev\"
"

echo "$UDEV_RULE" > /etc/udev/rules.d/99-banduka-escpos.rules
echo "   ✅ udev rule created"
echo ""

# Step 5: Reload udev rules
echo "5️⃣  Reloading udev rules..."
udevadm control --reload-rules
udevadm trigger
echo "   ✅ udev rules reloaded"
echo ""

# Step 6: Add user to plugdev group
echo "6️⃣  Adding user to plugdev group..."
ACTUAL_USER=${SUDO_USER:-$USER}
if groups "$ACTUAL_USER" | grep -q plugdev; then
    echo "   ℹ️  User $ACTUAL_USER already in plugdev group"
else
    usermod -a -G plugdev "$ACTUAL_USER"
    echo "   ✅ User $ACTUAL_USER added to plugdev group"
fi
echo ""

# Step 7: Restart CUPS (optional - can stay off for POS use)
echo "7️⃣  CUPS service status..."
read -p "   Do you want to restart CUPS? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    systemctl start cups
    echo "   ✅ CUPS restarted"
else
    echo "   ℹ️  CUPS left stopped (recommended for ESC/POS)"
fi
echo ""

echo "================================================"
echo "  ✅ Setup Complete!"
echo "================================================"
echo ""
echo "📋 Your Printer Configuration:"
echo "   Vendor ID:  0x$VENDOR_ID (decimal: $((16#$VENDOR_ID)))"
echo "   Product ID: 0x$PRODUCT_ID (decimal: $((16#$PRODUCT_ID)))"
echo ""
echo "🔄 IMPORTANT: You must LOG OUT and LOG BACK IN"
echo "   (or restart your computer) for group changes to take effect."
echo ""
echo "📝 Next Steps:"
echo "   1. Log out and log back in"
echo "   2. Open Banduka POS at http://localhost:3006"
echo "   3. Go to Settings → Hardware"
echo "   4. Click 'Connect Printer'"
echo "   5. Select your printer from the dialog"
echo "   6. Click 'Test Print' to verify"
echo ""
echo "💡 Tip: Keep CUPS stopped for best ESC/POS performance"
echo "   To stop CUPS: sudo systemctl stop cups"
echo "   To disable CUPS: sudo systemctl disable cups"
echo ""
