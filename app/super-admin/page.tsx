"use client";

import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type IconProps = {
  size?: number;
  className?: string;
};

const IconBase = ({ size = 16, className = "", children }: IconProps & { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const LayoutDashboard = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="11" width="7" height="10" rx="1.5" />
    <rect x="3" y="13" width="7" height="8" rx="1.5" />
  </IconBase>
);

const Building2 = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
    <path d="M11 21v-3h2v3" />
  </IconBase>
);

const CreditCard = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </IconBase>
);

const Flag = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 4 2 4H5" />
  </IconBase>
);

const Settings = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
  </IconBase>
);

const FileText = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M8 3h7l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M15 3v5h5M10 12h6M10 16h6" />
  </IconBase>
);

const Users = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="10" r="2.5" />
    <path d="M4 19c0-3 3-5 5-5s5 2 5 5M14 19c.2-1.8 1.8-3.3 4-3.8" />
  </IconBase>
);

const Search = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4-4" />
  </IconBase>
);

const Bell = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M7 9a5 5 0 1 1 10 0v4l2 3H5l2-3Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </IconBase>
);

const Sun = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </IconBase>
);

const Moon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z" />
  </IconBase>
);

const Menu = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </IconBase>
);

const ChevronRight = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m9 6 6 6-6 6" />
  </IconBase>
);

const LogOut = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </IconBase>
);

const Plus = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 5v14M5 12h14" />
  </IconBase>
);

const Edit = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m4 20 4.5-1 9-9-3.5-3.5-9 9L4 20Z" />
    <path d="m13.5 6.5 3.5 3.5" />
  </IconBase>
);

const Trash2 = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v6M14 11v6" />
  </IconBase>
);

const Eye = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.5" />
  </IconBase>
);

const EyeOff = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M3 3l18 18" />
    <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
    <path d="M9.1 4.8A11.4 11.4 0 0 1 12 4.5c6.5 0 10 7.5 10 7.5a18.6 18.6 0 0 1-4.1 4.9" />
    <path d="M6.2 6.2A18.7 18.7 0 0 0 2 12s3.5 7.5 10 7.5c1.2 0 2.4-.2 3.5-.6" />
  </IconBase>
);

const CheckCircle = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.2 2.2 4.8-5" />
  </IconBase>
);

const XCircle = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </IconBase>
);

const AlertCircle = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </IconBase>
);

const TrendingUp = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 16l6-6 4 4 6-7" />
    <path d="M15 7h5v5" />
  </IconBase>
);

const TrendingDown = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 8l6 6 4-4 6 7" />
    <path d="M15 17h5v-5" />
  </IconBase>
);

const Wallet = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 7h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
    <path d="M4 9V7a2 2 0 0 1 2-2h11" />
    <circle cx="16" cy="13" r="1" />
  </IconBase>
);

const Calendar = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </IconBase>
);

const Download = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 4v10M8 10l4 4 4-4M5 19h14" />
  </IconBase>
);

const RefreshCw = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M20 11a8 8 0 0 0-14-4M4 13a8 8 0 0 0 14 4" />
    <path d="M6 7H3V4M18 17h3v3" />
  </IconBase>
);

const Filter = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 6h16l-6 7v5l-4 2v-7L4 6Z" />
  </IconBase>
);

const Server = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="4" y="4" width="16" height="6" rx="1.5" />
    <rect x="4" y="14" width="16" height="6" rx="1.5" />
    <path d="M8 7h.01M8 17h.01" />
  </IconBase>
);

const Shield = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z" />
  </IconBase>
);

const Lock = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
  </IconBase>
);

const UserPlus = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="9" cy="8" r="3" />
    <path d="M4 19c0-3 3-5 5-5s5 2 5 5M18 8v6M15 11h6" />
  </IconBase>
);

const Crown = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m4 17 2-9 6 5 6-5 2 9H4Z" />
    <path d="M4 17h16v3H4Z" />
  </IconBase>
);

const Star = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m12 3 2.7 5.4 6 1-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-1L12 3Z" />
  </IconBase>
);

const Store = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 10V7l2-3h12l2 3v3" />
    <path d="M5 10h14v10H5z" />
    <path d="M9 14h2v6H9z" />
  </IconBase>
);

const DollarSign = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 3v18M16 7c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 3 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />
  </IconBase>
);

const Zap = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M13 2 5 13h5l-1 9 8-11h-5l1-9Z" />
  </IconBase>
);

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const tenants = [
  {
    id: "1",
    name: "ERUNS TECHNOLOGIES",
    pin: "PIN-1776161447346",
    plan: "Starter",
    status: "Active",
    users: 1,
    sales: 0,
    joined: "4/14/2026",
  },
  {
    id: "2",
    name: "Acme Corp Kenya",
    pin: "PIN-1776161447890",
    plan: "Professional",
    status: "Trial",
    users: 8,
    sales: 12450,
    joined: "4/10/2026",
  },
  {
    id: "3",
    name: "Nairobi Retail Hub",
    pin: "PIN-1776161448123",
    plan: "Enterprise",
    status: "Active",
    users: 45,
    sales: 89200,
    joined: "3/28/2026",
  },
  {
    id: "4",
    name: "Coast Distributors",
    pin: "PIN-1776161448456",
    plan: "Starter",
    status: "Expired",
    users: 3,
    sales: 0,
    joined: "1/15/2026",
  },
];

const plans = [
  {
    name: "Starter",
    status: "Active",
    maxUsers: 5,
    maxBranches: 1,
    maxProducts: 500,
    price: "Ksh 2,500",
    features: ["Basic Reports", "Email Support", "5GB Storage"],
  },
  {
    name: "Professional",
    status: "Active",
    maxUsers: 20,
    maxBranches: 3,
    maxProducts: 5000,
    price: "Ksh 7,500",
    features: ["Advanced Reports", "Priority Support", "50GB Storage", "API Access"],
  },
  {
    name: "Enterprise",
    status: "Active",
    maxUsers: 100,
    maxBranches: 10,
    maxProducts: 99999,
    price: "Custom",
    features: ["Custom Reports", "24/7 Support", "Unlimited Storage", "API Access", "Custom Branding", "Dedicated Server"],
  },
];

const featureFlags = [
  { name: "Advanced Reporting", key: "advanced_reporting", starter: true, professional: true, enterprise: true },
  { name: "API Access", key: "api_access", starter: false, professional: true, enterprise: true },
  { name: "Custom Branding", key: "custom_branding", starter: false, professional: true, enterprise: true },
  { name: "eTIMS Integration", key: "etims_integration", starter: false, professional: false, enterprise: true },
  { name: "Layaway System", key: "layaway", starter: true, professional: true, enterprise: true },
  { name: "WhatsApp Orders", key: "whatsapp_orders", starter: false, professional: true, enterprise: true },
  { name: "Work Orders", key: "work_orders", starter: true, professional: true, enterprise: true },
  { name: "Multi-Branch Support", key: "multi_branch", starter: false, professional: true, enterprise: true },
  { name: "Inventory Forecasting", key: "inventory_forecast", starter: false, professional: false, enterprise: true },
  { name: "Customer Loyalty", key: "customer_loyalty", starter: false, professional: true, enterprise: true },
];

const auditLogs = [
  { time: "4/14/2026, 1:15:52 PM", admin: "superadmin", action: "UNSUSPEND_ORG", target: "organization c047f2c3", ip: "::1", severity: "info" },
  { time: "4/14/2026, 1:15:12 PM", admin: "superadmin", action: "SUSPEND_ORG", target: "organization c047f2c3", ip: "::1", severity: "warning" },
  { time: "4/14/2026, 1:13:03 PM", admin: "superadmin", action: "CHANGE_SUBSCRIPTION", target: "organization c047f2c3", ip: "::1", severity: "info" },
  { time: "4/14/2026, 1:12:50 PM", admin: "superadmin", action: "UNSUSPEND_ORG", target: "organization c047f2c3", ip: "::1", severity: "info" },
  { time: "4/14/2026, 1:12:16 PM", admin: "superadmin", action: "CHANGE_SUBSCRIPTION", target: "organization c047f2c3", ip: "::1", severity: "info" },
  { time: "4/14/2026, 11:08:22 AM", admin: "superadmin", action: "CREATE_TENANT", target: "New tenant created", ip: "192.168.1.1", severity: "success" },
  { time: "4/13/2026, 9:45:12 AM", admin: "superadmin", action: "UPDATE_FEATURE_FLAG", target: "whatsapp_orders enabled", ip: "192.168.1.1", severity: "info" },
];

const saUsers = [
  { username: "superadmin", email: "admin@banduka.local", status: "Active", lastLogin: "4/14/2026, 1:07:02 PM", role: "Super Admin" },
  { username: "john.otieno", email: "john@banduka.com", status: "Active", lastLogin: "4/13/2026, 5:30:22 PM", role: "Admin" },
  { username: "mary.wanjiku", email: "mary@banduka.com", status: "Inactive", lastLogin: "4/10/2026, 10:15:00 AM", role: "Viewer" },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Building2, label: "Tenants", id: "tenants" },
  { icon: CreditCard, label: "Plans", id: "plans" },
  { icon: Flag, label: "Feature Flags", id: "features" },
  { icon: Settings, label: "Platform Settings", id: "settings" },
  { icon: FileText, label: "Audit Log", id: "audit" },
  { icon: Users, label: "SA Users", id: "users" },
] as const;

type TabId = (typeof menuItems)[number]["id"];

const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Trial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Expired: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    Suspended: "bg-red-500/10 text-red-400 border-red-500/20",
    Inactive: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        variants[status as keyof typeof variants] ?? variants.Inactive
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status === "Active" ? "bg-emerald-400 animate-pulse" : "bg-current"}`} />
      {status}
    </span>
  );
};

const ActionButton = ({
  icon: Icon,
  onClick,
  variant = "default",
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  onClick?: () => void;
  variant?: "default" | "danger";
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`rounded-lg p-1.5 transition-colors ${
      variant === "danger" ? "text-rose-400 hover:bg-rose-500/10" : "text-white/40 hover:bg-white/10 hover:text-white"
    }`}
  >
    <Icon size={16} />
  </motion.button>
);

export default function SuperAdminDashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const filteredTenants = useMemo(
    () =>
      tenants.filter((tenant) => {
        const q = searchTerm.toLowerCase();
        const matchesSearch = tenant.name.toLowerCase().includes(q) || tenant.pin.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "All" || tenant.status === statusFilter;
        const matchesPlan = planFilter === "All" || tenant.plan === planFilter;
        return matchesSearch && matchesStatus && matchesPlan;
      }),
    [planFilter, searchTerm, statusFilter]
  );

  const dashboardKPIs = [
    { label: "Total Orgs", value: "4", change: "+1", trend: "up", icon: Building2 },
    { label: "Active", value: "2", change: "0", trend: "neutral", icon: CheckCircle },
    { label: "Trial", value: "1", change: "+1", trend: "up", icon: AlertCircle },
    { label: "Expired", value: "1", change: "0", trend: "neutral", icon: XCircle },
    { label: "Total Users", value: "57", change: "+12", trend: "up", icon: Users },
    { label: "New Orgs (30d)", value: "2", change: "+2", trend: "up", icon: Calendar },
    { label: "Sales (30d)", value: "Ksh 101,650", change: "+45%", trend: "up", icon: DollarSign },
    { label: "Revenue (30d)", value: "Ksh 15,500", change: "+23%", trend: "up", icon: Wallet },
  ] as const;

  const byPlanData = [
    { plan: "Starter", count: 2, color: "from-blue-500 to-cyan-500" },
    { plan: "Professional", count: 1, color: "from-fuchsia-500 to-violet-500" },
    { plan: "Enterprise", count: 1, color: "from-emerald-500 to-teal-500" },
  ];

  const shellClass = darkMode ? "dark" : "";
  const panelClass = darkMode
    ? "bg-white/5 border-white/10 text-white"
    : "bg-white/80 border-slate-200 text-slate-900 shadow-sm";
  const subtleTextClass = darkMode ? "text-white/40" : "text-slate-500";
  const sidebarClass = darkMode ? "bg-slate-900/40 border-white/10" : "bg-white/85 border-slate-200";
  const topbarClass = darkMode ? "bg-slate-900/50 border-white/10" : "bg-white/85 border-slate-200";
  const inputClass = darkMode
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/40"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400";
  const mutedSurfaceClass = darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200";

  return (
    <div className={shellClass}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_28%),radial-gradient(circle_at_right,_rgba(217,119,6,0.14),_transparent_24%)] dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 bg-slate-100 transition-colors duration-300">
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className={`fixed left-0 right-0 top-0 z-50 border-b backdrop-blur-xl ${topbarClass}`}
        >
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarCollapsed((value) => !value)}
                className={`rounded-lg p-2 transition-colors ${darkMode ? "text-white/70 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Menu size={20} />
              </motion.button>

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                  <span className="text-xs font-bold text-white">B</span>
                </div>
                <div className="min-w-0">
                  <span className={`bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent sm:text-xl ${darkMode ? "from-white to-amber-200" : "from-slate-900 to-orange-700"}`}>
                    Banduka POS
                  </span>
                  <span className="ml-2 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs text-orange-500">Super Admin</span>
                </div>
              </div>

              <div className={`hidden items-center gap-2 rounded-xl border px-3 py-1.5 md:flex ${mutedSurfaceClass}`}>
                <Search size={16} className={darkMode ? "text-white/40" : "text-slate-400"} />
                <input
                  type="text"
                  placeholder="Search tenants, users, audit logs..."
                  className={`w-80 bg-transparent text-sm focus:outline-none ${darkMode ? "text-white" : "text-slate-900"}`}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <kbd className={`hidden rounded px-1.5 py-0.5 text-xs lg:inline-block ${darkMode ? "bg-white/10 text-white/40" : "bg-slate-100 text-slate-500"}`}>⌘K</kbd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative rounded-lg p-2 transition-colors ${darkMode ? "text-white/70 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Bell size={18} />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDarkMode((value) => !value)}
                className={`rounded-lg p-2 transition-colors ${darkMode ? "text-white/70 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>

              <div className={`h-8 w-px ${darkMode ? "bg-white/10" : "bg-slate-200"}`} />

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className={darkMode ? "text-sm font-medium text-white" : "text-sm font-medium text-slate-900"}>superadmin</p>
                  <p className={darkMode ? "text-xs text-white/40" : "text-xs text-slate-500"}>Super Administrator</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                  <span className="text-sm font-bold text-white">SA</span>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 80 : 280 }}
          className={`fixed bottom-0 left-0 top-16 z-40 border-r backdrop-blur-xl ${sidebarClass}`}
        >
          <nav className="flex h-full flex-col gap-1 p-4">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                whileHover={{ x: 4 }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  activeTab === item.id
                    ? "border border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white shadow-lg"
                    : darkMode
                      ? "text-white/60 hover:bg-white/5 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon size={18} />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {!sidebarCollapsed && activeTab === item.id && <ChevronRight size={14} className="ml-auto" />}
              </motion.button>
            ))}

            <div className="mt-auto pt-8">
              <div className={`my-4 h-px ${darkMode ? "bg-white/10" : "bg-slate-200"}`} />
              <motion.button
                whileHover={{ x: 4 }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut size={18} />
                {!sidebarCollapsed && <span>Sign out</span>}
              </motion.button>
            </div>
          </nav>
        </motion.aside>

        <main
          className={`px-4 pb-6 pt-24 transition-all duration-300 sm:px-6 ${sidebarCollapsed ? "pl-24" : "pl-72"}`}
          style={{ paddingLeft: sidebarCollapsed ? "5rem" : "18rem" }}
        >
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" variants={staggerContainer} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className={darkMode ? "text-2xl font-bold text-white" : "text-2xl font-bold text-slate-900"}>Platform Dashboard</h1>
                    <p className={`${subtleTextClass} text-sm`}>Multi-tenant overview & analytics</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${mutedSurfaceClass}`}>
                      <Calendar size={14} className={subtleTextClass} />
                      <span className={darkMode ? "text-sm text-white" : "text-sm text-slate-900"}>Last 30 days</span>
                      <ChevronRight size={14} className={`${subtleTextClass} rotate-90`} />
                    </div>
                    <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }} className={`rounded-xl border p-2 ${mutedSurfaceClass}`}>
                      <RefreshCw size={16} className={darkMode ? "text-white/60" : "text-slate-500"} />
                    </motion.button>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {dashboardKPIs.map((kpi) => (
                    <motion.div
                      key={kpi.label}
                      variants={fadeInUp}
                      whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
                      className={`group relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm ${panelClass}`}
                    >
                      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="rounded-xl bg-orange-500/10 p-2">
                            <kpi.icon size={18} className="text-orange-400" />
                          </div>
                          {kpi.change !== "0" && (
                            <span className={`flex items-center gap-0.5 text-xs ${kpi.trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
                              {kpi.trend === "up" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                              {kpi.change}
                            </span>
                          )}
                        </div>
                        <p className={darkMode ? "mt-3 text-2xl font-bold text-white" : "mt-3 text-2xl font-bold text-slate-900"}>{kpi.value}</p>
                        <p className={`mt-0.5 text-xs ${subtleTextClass}`}>{kpi.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <motion.div variants={fadeInUp} className={`rounded-2xl border p-6 backdrop-blur-sm ${panelClass}`}>
                    <h3 className={darkMode ? "mb-4 text-lg font-semibold text-white" : "mb-4 text-lg font-semibold text-slate-900"}>By Plan</h3>
                    <div className="space-y-4">
                      {byPlanData.map((item) => (
                        <div key={item.plan}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className={darkMode ? "text-white" : "text-slate-900"}>{item.plan}</span>
                            <span className={subtleTextClass}>{item.count} organizations</span>
                          </div>
                          <div className={`h-2 w-full overflow-hidden rounded-full ${darkMode ? "bg-white/10" : "bg-slate-200"}`}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.count / 4) * 100}%` }}
                              transition={{ duration: 1, delay: 0.3 }}
                              className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-6 flex items-center justify-between border-t pt-4 ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                          <Crown size={14} className="text-emerald-400" />
                        </div>
                        <div>
                          <p className={darkMode ? "text-sm font-medium text-white" : "text-sm font-medium text-slate-900"}>Most Popular</p>
                          <p className={`text-xs ${subtleTextClass}`}>Professional plan</p>
                        </div>
                      </div>
                      <button className="text-sm text-orange-400 hover:text-orange-300">View details →</button>
                    </div>
                  </motion.div>

                  <motion.div variants={fadeInUp} className={`rounded-2xl border p-6 backdrop-blur-sm ${panelClass}`}>
                    <h3 className={darkMode ? "mb-4 text-lg font-semibold text-white" : "mb-4 text-lg font-semibold text-slate-900"}>Recent Platform Activity</h3>
                    <div className="space-y-3">
                      {auditLogs.slice(0, 4).map((log, index) => (
                        <div
                          key={`${log.action}-${index}`}
                          className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${
                              log.severity === "warning" ? "bg-amber-400" : log.severity === "success" ? "bg-emerald-400" : "bg-blue-400"
                            }`}
                          />
                          <div className="flex-1">
                            <p className={darkMode ? "text-sm text-white" : "text-sm text-slate-900"}>{log.action}</p>
                            <p className={`text-xs ${subtleTextClass}`}>{log.target}</p>
                          </div>
                          <span className={`text-xs ${darkMode ? "text-white/30" : "text-slate-400"}`}>{log.time.split(",")[0]}</span>
                        </div>
                      ))}
                    </div>
                    <button className="mt-4 flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300" onClick={() => setActiveTab("audit")}>
                      View all activity <ChevronRight size={14} />
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === "tenants" && (
              <motion.div key="tenants" variants={staggerContainer} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className={darkMode ? "text-2xl font-bold text-white" : "text-2xl font-bold text-slate-900"}>Tenant Management</h1>
                    <p className={`${subtleTextClass} text-sm`}>Manage all organizations on the platform</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
                  >
                    <Plus size={16} /> New Tenant
                  </motion.button>
                </motion.div>

                <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
                  <div className={`flex max-w-xs flex-1 items-center gap-2 rounded-xl border px-3 py-2 ${inputClass}`}>
                    <Search size={16} className={subtleTextClass} />
                    <input
                      type="text"
                      placeholder="Search name or PIN..."
                      className="flex-1 bg-transparent text-sm focus:outline-none"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className={`rounded-xl border px-4 py-2 text-sm focus:outline-none ${inputClass}`}
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Expired">Expired</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                  <select
                    value={planFilter}
                    onChange={(event) => setPlanFilter(event.target.value)}
                    className={`rounded-xl border px-4 py-2 text-sm focus:outline-none ${inputClass}`}
                  >
                    <option value="All">All Plans</option>
                    <option value="Starter">Starter</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                  <motion.button whileHover={{ scale: 1.02 }} className="flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/15 px-4 py-2 text-sm text-orange-300">
                    <Filter size={14} /> Apply Filters
                  </motion.button>
                </motion.div>

                <motion.div variants={fadeInUp} className={`overflow-hidden rounded-2xl border backdrop-blur-sm ${panelClass}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${darkMode ? "border-b border-white/10 bg-white/5" : "border-b border-slate-200 bg-slate-50"}`}>
                        <tr>
                          {["ORGANIZATION", "PIN", "PLAN", "STATUS", "USERS", "SALES", "JOINED", ""].map((header) => (
                            <th key={header} className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${subtleTextClass}`}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={darkMode ? "divide-y divide-white/5" : "divide-y divide-slate-100"}>
                        {filteredTenants.map((tenant) => (
                          <motion.tr
                            key={tenant.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ backgroundColor: darkMode ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)" }}
                            className="transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                                  <Store size={14} className="text-orange-400" />
                                </div>
                                <span className={darkMode ? "text-sm font-medium text-white" : "text-sm font-medium text-slate-900"}>{tenant.name}</span>
                              </div>
                            </td>
                            <td className={`px-4 py-3 font-mono text-sm ${subtleTextClass}`}>{tenant.pin}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  tenant.plan === "Starter"
                                    ? "bg-blue-500/10 text-blue-400"
                                    : tenant.plan === "Professional"
                                      ? "bg-fuchsia-500/10 text-fuchsia-400"
                                      : "bg-emerald-500/10 text-emerald-400"
                                }`}
                              >
                                {tenant.plan}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={tenant.status} />
                            </td>
                            <td className={`px-4 py-3 text-sm ${subtleTextClass}`}>{tenant.users}</td>
                            <td className={`px-4 py-3 text-sm ${subtleTextClass}`}>{tenant.sales === 0 ? "0" : `Ksh ${tenant.sales.toLocaleString()}`}</td>
                            <td className={`px-4 py-3 text-sm ${subtleTextClass}`}>{tenant.joined}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <ActionButton icon={Eye} />
                                <ActionButton icon={Edit} />
                                <ActionButton icon={Trash2} variant="danger" />
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "plans" && (
              <motion.div key="plans" variants={staggerContainer} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className={darkMode ? "text-2xl font-bold text-white" : "text-2xl font-bold text-slate-900"}>Plan Management</h1>
                    <p className={`${subtleTextClass} text-sm`}>Manage subscription plans and pricing</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-sm font-medium text-white">
                    <Plus size={16} /> Add Plan
                  </motion.button>
                </motion.div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {plans.map((plan) => (
                    <motion.div
                      key={plan.name}
                      variants={fadeInUp}
                      whileHover={{ y: -4 }}
                      className={`relative rounded-2xl border p-6 backdrop-blur-sm ${
                        plan.name === "Professional" ? "border-orange-500/50 shadow-lg shadow-orange-500/10" : darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                      }`}
                    >
                      {plan.name === "Professional" && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 px-3 py-0.5 text-xs font-medium text-white">
                          MOST POPULAR
                        </div>
                      )}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
                              plan.name === "Starter"
                                ? "from-blue-500 to-cyan-500"
                                : plan.name === "Professional"
                                  ? "from-fuchsia-500 to-violet-500"
                                  : "from-emerald-500 to-teal-500"
                            }`}
                          >
                            {plan.name === "Starter" ? (
                              <Star size={18} className="text-white" />
                            ) : plan.name === "Professional" ? (
                              <Zap size={18} className="text-white" />
                            ) : (
                              <Crown size={18} className="text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className={darkMode ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>{plan.name}</h3>
                            <StatusBadge status={plan.status} />
                          </div>
                        </div>
                        <ActionButton icon={Edit} />
                      </div>
                      <div className="mb-4">
                        <p className={darkMode ? "text-2xl font-bold text-white" : "text-2xl font-bold text-slate-900"}>{plan.price}</p>
                        <p className={`text-xs ${subtleTextClass}`}>per month</p>
                      </div>
                      <div className="mb-6 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className={subtleTextClass}>Max Users</span>
                          <span className={darkMode ? "font-medium text-white" : "font-medium text-slate-900"}>{plan.maxUsers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={subtleTextClass}>Max Branches</span>
                          <span className={darkMode ? "font-medium text-white" : "font-medium text-slate-900"}>{plan.maxBranches}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={subtleTextClass}>Max Products</span>
                          <span className={darkMode ? "font-medium text-white" : "font-medium text-slate-900"}>{plan.maxProducts.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className={`border-t pt-4 ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                        <p className={`mb-2 text-xs ${subtleTextClass}`}>Features</p>
                        <div className="flex flex-wrap gap-1">
                          {plan.features.map((feature) => (
                            <span key={feature} className={`rounded-full px-2 py-0.5 text-xs ${darkMode ? "bg-white/5 text-white/60" : "bg-slate-100 text-slate-600"}`}>
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} className={`mt-4 w-full rounded-xl py-2 text-sm transition-colors ${darkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}>
                        Edit Plan
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "features" && (
              <motion.div key="features" variants={staggerContainer} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className={darkMode ? "text-2xl font-bold text-white" : "text-2xl font-bold text-slate-900"}>Feature Flags</h1>
                    <p className={`${subtleTextClass} text-sm`}>Control feature availability across subscription tiers</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-sm font-medium text-white">
                    <Plus size={16} /> New Feature
                  </motion.button>
                </motion.div>

                <motion.div variants={fadeInUp} className={`overflow-hidden rounded-2xl border backdrop-blur-sm ${panelClass}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${darkMode ? "border-b border-white/10 bg-white/5" : "border-b border-slate-200 bg-slate-50"}`}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${subtleTextClass}`}>FEATURE</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${subtleTextClass}`}>KEY</th>
                          <th className={`px-4 py-3 text-center text-xs font-medium ${subtleTextClass}`}>Starter</th>
                          <th className={`px-4 py-3 text-center text-xs font-medium ${subtleTextClass}`}>Professional</th>
                          <th className={`px-4 py-3 text-center text-xs font-medium ${subtleTextClass}`}>Enterprise</th>
                        </tr>
                      </thead>
                      <tbody className={darkMode ? "divide-y divide-white/5" : "divide-y divide-slate-100"}>
                        {featureFlags.map((feature, index) => (
                          <motion.tr
                            key={feature.key}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className={`transition-colors ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
                                  <Flag size={12} className="text-orange-400" />
                                </div>
                                <span className={darkMode ? "text-sm text-white" : "text-sm text-slate-900"}>{feature.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <code className={`rounded px-2 py-1 text-xs font-mono ${darkMode ? "bg-white/5 text-white/60" : "bg-slate-100 text-slate-600"}`}>{feature.key}</code>
                            </td>
                            <td className="px-4 py-3 text-center">{feature.starter ? <CheckCircle size={18} className="mx-auto text-emerald-400" /> : <XCircle size={18} className={`mx-auto ${darkMode ? "text-white/20" : "text-slate-300"}`} />}</td>
                            <td className="px-4 py-3 text-center">{feature.professional ? <CheckCircle size={18} className="mx-auto text-emerald-400" /> : <XCircle size={18} className={`mx-auto ${darkMode ? "text-white/20" : "text-slate-300"}`} />}</td>
                            <td className="px-4 py-3 text-center">{feature.enterprise ? <CheckCircle size={18} className="mx-auto text-emerald-400" /> : <XCircle size={18} className={`mx-auto ${darkMode ? "text-white/20" : "text-slate-300"}`} />}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={`flex justify-end border-t px-4 py-3 ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                    <motion.button whileHover={{ scale: 1.02 }} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-sm font-medium text-white">
                      Save Changes
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div key="settings" variants={staggerContainer} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <motion.div variants={fadeInUp}>
                  <h1 className={darkMode ? "text-2xl font-bold text-white" : "text-2xl font-bold text-slate-900"}>Platform Settings</h1>
                  <p className={`${subtleTextClass} text-sm`}>Configure global platform settings</p>
                </motion.div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <motion.div variants={fadeInUp} className={`rounded-2xl border p-6 backdrop-blur-sm ${panelClass}`}>
                    <h3 className={`mb-4 flex items-center gap-2 text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                      <Server size={18} className="text-orange-400" /> System Configuration
                    </h3>
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between rounded-xl p-3 ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                        <div>
                          <p className={darkMode ? "text-sm font-medium text-white" : "text-sm font-medium text-slate-900"}>Maintenance Mode</p>
                          <p className={`text-xs ${subtleTextClass}`}>Block all user access during updates</p>
                        </div>
                        <div className="relative inline-block h-6 w-12">
                          <input type="checkbox" className="peer h-0 w-0 opacity-0" />
                          <span className={`absolute inset-0 cursor-pointer rounded-full before:absolute before:bottom-0.5 before:left-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:transition-all peer-checked:bg-orange-500/30 peer-checked:before:translate-x-6 peer-checked:before:bg-orange-400 ${darkMode ? "bg-white/10" : "bg-slate-300"}`} />
                        </div>
                      </div>
                      <div>
                        <label className={`mb-1 block text-sm ${subtleTextClass}`}>SMTP Host</label>
                        <input type="text" placeholder="smtp.banduka.com" className={`w-full rounded-xl border px-4 py-2 focus:outline-none ${inputClass}`} />
                      </div>
                      <div>
                        <label className={`mb-1 block text-sm ${subtleTextClass}`}>SMTP Port</label>
                        <input type="text" placeholder="587" className={`w-full rounded-xl border px-4 py-2 focus:outline-none ${inputClass}`} />
                      </div>
                      <div>
                        <label className={`mb-1 block text-sm ${subtleTextClass}`}>Support Email</label>
                        <input type="email" placeholder="support@banduka.com" className={`w-full rounded-xl border px-4 py-2 focus:outline-none ${inputClass}`} />
                      </div>
                      <div>
                        <label className={`mb-1 block text-sm ${subtleTextClass}`}>App Name</label>
                        <input type="text" placeholder="Banduka POS" className={`w-full rounded-xl border px-4 py-2 focus:outline-none ${inputClass}`} />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={fadeInUp} className={`rounded-2xl border p-6 backdrop-blur-sm ${panelClass}`}>
                    <h3 className={`mb-4 flex items-center gap-2 text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                      <Shield size={18} className="text-orange-400" /> Security & Compliance
                    </h3>
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between rounded-xl p-3 ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                        <div>
                          <p className={darkMode ? "text-sm font-medium text-white" : "text-sm font-medium text-slate-900"}>Two-Factor Authentication</p>
                          <p className={`text-xs ${subtleTextClass}`}>Require 2FA for all admin accounts</p>
                        </div>
                        <div className="relative inline-block h-6 w-12">
                          <input type="checkbox" defaultChecked className="peer h-0 w-0 opacity-0" />
                          <span className={`absolute inset-0 cursor-pointer rounded-full before:absolute before:bottom-0.5 before:left-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:transition-all peer-checked:bg-orange-500/30 peer-checked:before:translate-x-6 peer-checked:before:bg-orange-400 ${darkMode ? "bg-white/10" : "bg-slate-300"}`} />
                        </div>
                      </div>
                      <div className={`flex items-center justify-between rounded-xl p-3 ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                        <div>
                          <p className={darkMode ? "text-sm font-medium text-white" : "text-sm font-medium text-slate-900"}>Session Timeout</p>
                          <p className={`text-xs ${subtleTextClass}`}>Auto logout after inactivity</p>
                        </div>
                        <select className={`rounded-lg border px-3 py-1 text-sm focus:outline-none ${inputClass}`}>
                          <option>30 minutes</option>
                          <option>1 hour</option>
                          <option>2 hours</option>
                        </select>
                      </div>
                      <div>
                        <label className={`mb-1 block text-sm ${subtleTextClass}`}>API Rate Limit</label>
                        <div className="flex gap-2">
                          <input type="text" placeholder="1000" className={`flex-1 rounded-xl border px-4 py-2 ${inputClass}`} />
                          <span className={`flex items-center text-sm ${subtleTextClass}`}>requests/min</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.div variants={fadeInUp} className={`rounded-2xl border p-6 backdrop-blur-sm ${panelClass}`}>
                  <h3 className={`mb-4 flex items-center gap-2 text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                    <Lock size={18} className="text-orange-400" /> Change Password
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className={`mb-1 block text-sm ${subtleTextClass}`}>Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={`w-full rounded-xl border px-4 py-2 pr-10 focus:outline-none ${inputClass}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((value) => !value)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${subtleTextClass}`}
                        >
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={`mb-1 block text-sm ${subtleTextClass}`}>New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={`w-full rounded-xl border px-4 py-2 pr-10 focus:outline-none ${inputClass}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((value) => !value)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${subtleTextClass}`}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={`mb-1 block text-sm ${subtleTextClass}`}>Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={`w-full rounded-xl border px-4 py-2 pr-10 focus:outline-none ${inputClass}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${subtleTextClass}`}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-sm font-medium text-white">Update Password</button>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="flex justify-end">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg">
                    Save All Settings
                  </motion.button>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "audit" && (
              <motion.div key="audit" variants={staggerContainer} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className={darkMode ? "text-2xl font-bold text-white" : "text-2xl font-bold text-slate-900"}>Audit Log</h1>
                    <p className={`${subtleTextClass} text-sm`}>Track all admin actions across the platform</p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.02 }} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${darkMode ? "border-white/10 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-900"}`}>
                      <Filter size={14} /> Filter
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-sm text-white">
                      <Download size={14} /> Export CSV
                    </motion.button>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className={`overflow-hidden rounded-2xl border backdrop-blur-sm ${panelClass}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${darkMode ? "border-b border-white/10 bg-white/5" : "border-b border-slate-200 bg-slate-50"}`}>
                        <tr>
                          {["TIME", "ADMIN", "ACTION", "TARGET", "IP", ""].map((header) => (
                            <th key={header} className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${subtleTextClass}`}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={darkMode ? "divide-y divide-white/5" : "divide-y divide-slate-100"}>
                        {auditLogs.map((log, index) => (
                          <motion.tr key={`${log.time}-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`transition-colors ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                            <td className={`whitespace-nowrap px-4 py-3 text-sm ${subtleTextClass}`}>{log.time}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20">
                                  <span className="text-xs text-orange-400">SA</span>
                                </div>
                                <span className={darkMode ? "text-sm text-white" : "text-sm text-slate-900"}>{log.admin}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  log.action.includes("SUSPEND") && !log.action.includes("UNSUSPEND")
                                    ? "bg-rose-500/10 text-rose-400"
                                    : log.action.includes("UNSUSPEND")
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-blue-500/10 text-blue-400"
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className={`px-4 py-3 font-mono text-sm ${darkMode ? "text-white/60" : "text-slate-600"}`}>{log.target}</td>
                            <td className={`px-4 py-3 font-mono text-sm ${subtleTextClass}`}>{log.ip}</td>
                            <td className="px-4 py-3">
                              <ActionButton icon={Eye} />
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "users" && (
              <motion.div key="users" variants={staggerContainer} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className={darkMode ? "text-2xl font-bold text-white" : "text-2xl font-bold text-slate-900"}>Super Admin Users</h1>
                    <p className={`${subtleTextClass} text-sm`}>Manage platform administrators</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-sm font-medium text-white">
                    <UserPlus size={16} /> Add Admin
                  </motion.button>
                </motion.div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {saUsers.map((user) => (
                    <motion.div key={user.username} variants={fadeInUp} whileHover={{ y: -2 }} className={`rounded-2xl border p-6 backdrop-blur-sm ${panelClass}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600">
                            <span className="text-lg font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <h3 className={darkMode ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-900"}>{user.username}</h3>
                            <p className={`text-sm ${subtleTextClass}`}>{user.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <ActionButton icon={Edit} />
                          <ActionButton icon={Trash2} variant="danger" />
                        </div>
                      </div>
                      <div className={`mt-4 flex items-center justify-between border-t pt-4 ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Shield size={12} className={subtleTextClass} />
                            <span className={`text-xs ${darkMode ? "text-white/60" : "text-slate-600"}`}>{user.role}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className={subtleTextClass} />
                            <span className={`text-xs ${darkMode ? "text-white/60" : "text-slate-600"}`}>{user.lastLogin}</span>
                          </div>
                        </div>
                        <StatusBadge status={user.status} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
