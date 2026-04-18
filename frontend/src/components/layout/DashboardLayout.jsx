import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiMapPin,
  FiUsers,
  FiBell,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield,
  FiChevronRight,
} from "react-icons/fi";
import { MdSecurity, MdFamilyRestroom } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { MdLocalPolice } from "react-icons/md";

// ✅ User menu items
const userMenuItems = [
  { icon: <FiHome />, label: "Dashboard", path: "/dashboard" },
  { icon: <FiMapPin />, label: "Live Location", path: "/location" },
  { icon: <FiUsers />, label: "Emergency Contacts", path: "/contacts" },
  { icon: <FiBell />, label: "Alert History", path: "/alerts" },
  { icon: <MdLocalPolice />, label: "Police Stations", path: "/police-stations" }, // ✅ ADD
  { icon: <FiSettings />, label: "Settings", path: "/settings" },
];

// ✅ Family menu items - only relevant pages
const familyMenuItems = [
  {
    icon: <MdFamilyRestroom />,
    label: "Family Dashboard",
    path: "/family/dashboard",
  },
  { icon: <FiSettings />, label: "Settings", path: "/settings" },
];

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ✅ Pick menu based on role
  const menuItems = user?.role === "family" ? familyMenuItems : userMenuItems;

  const handleLogout = () => {
    logout();
    toast.success("Logged out safely 👋");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl flex items-center justify-center shadow-lg">
          <FiShield className="text-white text-xl" />
        </div>
        <div>
          <span className="text-xl font-bold text-white">Safe</span>
          <span className="text-xl font-bold text-[#E91E8C]">Guard</span>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#E91E8C] to-pink-700 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {user?.fullName || "User"}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
        {/* Role Badge */}
        <div className="mt-3 flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1.5 w-fit">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-xs font-medium capitalize">
            {user?.role === "family" ? "👨‍👩‍👧 Family Monitor" : "🛡 Protected"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
          {user?.role === "family" ? "Family Menu" : "Main Menu"}
        </p>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive(item.path)
                ? "bg-[#E91E8C] text-white shadow-lg shadow-pink-900/30"
                : "text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span
              className={`text-lg ${isActive(item.path) ? "text-white" : "text-gray-400 group-hover:text-white"}`}
            >
              {item.icon}
            </span>
            <span className="font-medium text-sm">{item.label}</span>
            {isActive(item.path) && (
              <FiChevronRight className="ml-auto text-white/70" />
            )}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
        >
          <FiLogOut className="text-lg" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#1A1A2E] flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1A1A2E] z-50 transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white text-xl"
          >
            <FiX />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 text-xl hover:text-[#E91E8C] transition-colors"
            >
              <FiMenu />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#1A1A2E]">
                {menuItems.find((item) => isActive(item.path))?.label ||
                  (user?.role === "family" ? "Family Dashboard" : "Dashboard")}
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-9 h-9 bg-gradient-to-br from-[#E91E8C] to-pink-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-[#1A1A2E] leading-none">
                  {user?.fullName?.split(" ")[0] || "User"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">
                  {user?.role || "user"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
