import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiShield, FiLogOut, FiSettings } from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowProfileMenu(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out safely 👋");
    navigate("/");
    setShowProfileMenu(false);
    setIsOpen(false);
  };

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-lg py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div
              className="w-10 h-10 bg-gradient-to-br from-pink-500 
            to-pink-700 rounded-xl flex items-center justify-center 
            shadow-lg group-hover:scale-105 transition-transform"
            >
              <FiShield className="text-white text-xl" />
            </div>
            <div>
              <span
                className={`text-xl font-bold transition-colors 
              duration-300 ${scrolled ? "text-[#1A1A2E]" : "text-white"}`}
              >
                Safe
              </span>
              <span className="text-xl font-bold text-[#E91E8C]">Guard</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`font-medium transition-colors duration-200 
                relative group ${
                  scrolled ? "text-[#4A5568]" : "text-gray-300"
                } hover:text-[#E91E8C]`}
              >
                {link.name}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 
                bg-[#E91E8C] group-hover:w-full transition-all duration-300"
                ></span>
              </a>
            ))}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              // ✅ Show profile dropdown when logged in
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl 
                  hover:bg-white/10 transition-all"
                >
                  <div
                    className="w-9 h-9 bg-gradient-to-br from-[#E91E8C] 
                  to-pink-700 rounded-xl flex items-center justify-center 
                  text-white font-bold text-sm shadow-md"
                  >
                    {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-sm font-semibold leading-none 
                    transition-colors ${
                      scrolled ? "text-[#1A1A2E]" : "text-white"
                    }`}
                    >
                      {user?.fullName?.split(" ")[0] || "User"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showProfileMenu ? "rotate-180" : ""
                    } ${scrolled ? "text-gray-500" : "text-white"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* ✅ Profile Dropdown */}
                {showProfileMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 
                  bg-white rounded-2xl shadow-2xl border border-gray-100 
                  overflow-hidden z-50"
                  >
                    {/* User info */}
                    <div
                      className="px-4 py-3 bg-pink-50 border-b 
                    border-pink-100"
                    >
                      <p className="font-bold text-[#1A1A2E] text-sm truncate">
                        {user?.fullName}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {user?.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className="p-2">
                      <Link
                        to={
                          user?.role === "family"
                            ? "/family/dashboard"
                            : "/dashboard"
                        }
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-3 py-2.5 
                        text-gray-600 hover:bg-pink-50 hover:text-[#E91E8C] 
                        rounded-xl transition-colors text-sm font-medium"
                      >
                        <MdDashboard className="text-lg" />
                        Dashboard
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-3 py-2.5 
                        text-gray-600 hover:bg-pink-50 hover:text-[#E91E8C] 
                        rounded-xl transition-colors text-sm font-medium"
                      >
                        <FiSettings className="text-lg" />
                        Settings
                      </Link>

                      <div className="h-px bg-gray-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 
                        text-red-500 hover:bg-red-50 rounded-xl transition-colors 
                        text-sm font-medium"
                      >
                        <FiLogOut className="text-lg" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ✅ Show Login/Register when NOT logged in
              <>
                <Link
                  to="/login"
                  className={`px-5 py-2.5 border-2 border-[#E91E8C] 
                  rounded-lg font-semibold hover:bg-[#E91E8C] hover:text-white 
                  transition-all duration-200 ${
                    scrolled ? "text-[#E91E8C]" : "text-white"
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#E91E8C] 
                  to-pink-700 text-white rounded-lg font-semibold hover:shadow-lg 
                  hover:shadow-pink-300 hover:-translate-y-0.5 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden text-2xl transition-colors ${
              scrolled || isOpen ? "text-[#FF6B6B]" : "text-white"
            }`}
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* ✅ FIXED Mobile Menu */}
        {isOpen && (
          <div
            className="md:hidden mt-2 rounded-2xl bg-white shadow-2xl 
          border border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-1">
              {/* Nav Links */}
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-[#1A1A2E] hover:text-[#E91E8C] 
                  hover:bg-pink-50 font-medium transition-colors 
                  px-4 py-3 rounded-xl"
                >
                  {link.name}
                </a>
              ))}

              <div className="h-px bg-gray-100 my-2"></div>

              {isAuthenticated ? (
                // ✅ Logged in - show profile section in mobile
                <>
                  {/* User info */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 
                  bg-pink-50 rounded-xl mb-1"
                  >
                    <div
                      className="w-10 h-10 bg-gradient-to-br from-[#E91E8C] 
                    to-pink-700 rounded-xl flex items-center justify-center 
                    text-white font-bold"
                    >
                      {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A2E] text-sm">
                        {user?.fullName}
                      </p>
                      <p className="text-gray-400 text-xs capitalize">
                        {user?.role}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={
                      user?.role === "family"
                        ? "/family/dashboard"
                        : "/dashboard"
                    }
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 
                    text-[#1A1A2E] hover:text-[#E91E8C] hover:bg-pink-50 
                    rounded-xl font-medium transition-colors"
                  >
                    <MdDashboard /> Dashboard
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 
                    text-[#1A1A2E] hover:text-[#E91E8C] hover:bg-pink-50 
                    rounded-xl font-medium transition-colors"
                  >
                    <FiSettings /> Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-500 
                    hover:bg-red-50 rounded-xl font-medium transition-colors 
                    w-full text-left"
                  >
                    <FiLogOut /> Logout
                  </button>
                </>
              ) : (
                // ✅ Not logged in - show login/register
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="text-center px-5 py-3 text-[#E91E8C] border-2 
                    border-[#E91E8C] rounded-xl font-semibold hover:bg-pink-50 
                    transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="text-center px-5 py-3 bg-gradient-to-r 
                    from-[#E91E8C] to-pink-700 text-white rounded-xl 
                    font-semibold hover:shadow-lg transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
