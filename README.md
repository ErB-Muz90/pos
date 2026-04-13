# 🏪 Bandu POS

A modern, responsive, and offline-capable Point of Sale (POS) system built with React and TypeScript. Optimized for Netlify deployment and designed for retail businesses, restaurants, and service providers.

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status.svg)](https://app.netlify.com/sites/bandu-pos/deploys)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ErB-Muz90/bandu-pos)

## ✨ Features

### 🛒 **Core POS Functionality**
- **Sales Processing**: Fast and intuitive checkout process
- **Product Management**: Comprehensive inventory with categories, variants, and pricing
- **Receipt Printing**: ESC/POS thermal printer support via WebUSB
- **Payment Methods**: Cash, card, mobile money (M-Pesa), and custom payment types
- **Tax Management**: Configurable tax rates and VAT calculations

### 📊 **Business Management**
- **Inventory Control**: Real-time stock tracking with low stock alerts
- **Customer Management**: Customer profiles with purchase history
- **Supplier Management**: Purchase orders and supplier relationships
- **Sales Reports**: Comprehensive analytics and reporting
- **Multi-User System**: Role-based access control and permissions

### 💼 **Advanced Features**
- **Layaway System**: Hold items for customers with payment plans
- **Quotations**: Create and manage customer quotes
- **Work Orders**: Service-based business management
- **Accounts Payable**: Supplier invoice and payment tracking
- **Time Sheets**: Employee time tracking and payroll support

### 🌐 **Technical Features**
- **Offline Capable**: Works without internet connection (PWA)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Sync**: Automatic data synchronization when online
- **Backup & Restore**: Automated data backup to Google Drive
- **Multi-language Support**: Configurable language settings

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ErB-Muz90/bandu-pos.git
   cd bandu-pos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3006
   ```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Build Tool**: Vite
- **State Management**: React Hooks + Local Storage
- **Offline Storage**: IndexedDB
- **Printing**: ESC/POS via WebUSB
- **PWA**: Service Workers for offline functionality

## 📱 Browser Support

- **Chrome/Chromium**: Full support (recommended)
- **Firefox**: Core functionality (limited WebUSB support)
- **Safari**: Core functionality (limited WebUSB support)
- **Edge**: Full support

## 🖨️ Printer Setup

Banduka POS supports ESC/POS thermal printers via WebUSB:

1. Connect your ESC/POS printer via USB
2. Open the application in Chrome/Chromium
3. Go to Settings → Hardware → Printer Setup
4. Click "Connect Printer" and select your device
5. Test print to verify connection

**Supported Printers**: Most ESC/POS compatible thermal printers (58mm, 80mm)

## 🚀 Deployment

### Netlify Deployment (Recommended)

**One-Click Deploy:**
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ErB-Muz90/bandu-pos)

**Manual Deployment:**
1. Fork this repository
2. Connect to Netlify
3. Deploy automatically with these settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

**See [NETLIFY-DEPLOYMENT.md](NETLIFY-DEPLOYMENT.md) for detailed instructions.**

### Other Hosting Services

Deploy to any static hosting service:

```bash
# Build the application
npm run build

# Deploy the dist/ folder to:
# - Vercel, GitHub Pages
# - Apache, Nginx, or any web server
```

### PWA Installation

Users can install Banduka POS as a Progressive Web App:
1. Open the application in a supported browser
2. Click the "Install" button in the address bar
3. The app will be available as a desktop/mobile app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/ErB-Muz90/bandu-pos/issues)
- **Community**: [Discussions](https://github.com/ErB-Muz90/bandu-pos/discussions)

---

**Built with ❤️ for small and medium businesses**
