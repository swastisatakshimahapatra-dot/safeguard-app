import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiShield } from "react-icons/fi";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          {/* Logo - FIXED */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <FiShield className="text-white text-xl" />
            </div>
            <div>
              {/* FIX - change color based on scroll */}
              <span
                className={`text-xl font-bold transition-colors duration-300 ${
                  scrolled ? "text-[#1A1A2E]" : "text-white"
                }`}
              >
                Safe
              </span>
              <span className="text-xl font-bold text-[#E91E8C]">Guard</span>
            </div>
          </Link>

          {/* Desktop Nav Links - FIXED */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`font-medium transition-colors duration-200 relative group ${
                  scrolled ? "text-[#4A5568]" : "text-gray-300"
                } hover:text-[#E91E8C]`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#E91E8C] group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </div>

          {/* Desktop Buttons - FIXED */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className={`px-5 py-2.5 border-2 border-[#E91E8C] rounded-lg font-semibold hover:bg-[#E91E8C] hover:text-white transition-all duration-200 ${
                scrolled ? "text-[#E91E8C]" : "text-white"
              }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-[#E91E8C] to-pink-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-pink-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburger - FIXED */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden text-2xl transition-colors ${
              scrolled ? "text-[#1A1A2E]" : "text-white"
            }`}
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/20">
            <div className="flex flex-col gap-4 pt-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-gray-300 hover:text-[#E91E8C] font-medium transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  className="text-center px-5 py-2.5 text-white border-2 border-[#E91E8C] rounded-lg font-semibold"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-center px-5 py-2.5 bg-gradient-to-r from-[#E91E8C] to-pink-700 text-white rounded-lg font-semibold"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
