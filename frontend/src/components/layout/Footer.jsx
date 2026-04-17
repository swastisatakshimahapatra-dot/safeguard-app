import { Link } from "react-router-dom";
import { FiShield, FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#1A1A2E] text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl flex items-center justify-center">
                <FiShield className="text-white text-xl" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">Safe</span>
                <span className="text-xl font-bold text-[#E91E8C]">Guard</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Intelligent safety system designed to protect women and children
              with AI-powered alerts and real-time tracking.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3">
              {[
                { icon: <FaFacebookF />, href: "#" },
                { icon: <FaTwitter />, href: "#" },
                { icon: <FaInstagram />, href: "#" },
                { icon: <FaLinkedinIn />, href: "#" },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-[#E91E8C] hover:text-white transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {["Home", "Features", "How It Works", "About Us", "Contact"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-[#E91E8C] transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 bg-[#E91E8C] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-5">Features</h3>
            <ul className="space-y-3">
              {[
                "Panic Button",
                "GPS Tracking",
                "Voice Detection",
                "Crime Zone Alerts",
                "Community Network",
                "Family Dashboard",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#E91E8C] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-[#E91E8C] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-5">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiMapPin className="text-[#E91E8C] text-sm" />
                </div>
                <span className="text-gray-400 text-sm">
                  123 Safety Street, Tech Park,
                  <br />
                  Mumbai, India 400001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiPhone className="text-[#E91E8C] text-sm" />
                </div>
                <span className="text-gray-400 text-sm">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiMail className="text-[#E91E8C] text-sm" />
                </div>
                <span className="text-gray-400 text-sm">
                  help@safeguard.com
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-sm">
            © 2024 SafeGuard. All rights reserved. Made with ❤️ for safety.
          </p>
          <div className="flex gap-5">
            <a
              href="#"
              className="text-gray-500 hover:text-[#E91E8C] text-sm transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E91E8C] text-sm transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
