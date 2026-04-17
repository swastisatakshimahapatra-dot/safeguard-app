import { Link } from "react-router-dom";
import { FiShield, FiArrowRight, FiPlay } from "react-icons/fi";
import { MdLocationOn, MdNotifications } from "react-icons/md";
import { BsShieldLockFill } from 'react-icons/bs'

const Hero = () => {
  return (
    <section
      id="home"
      className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] flex items-center relative overflow-hidden"
    >
      {/* Background decorative circles */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-400/5 rounded-full blur-2xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-pink-500/20 border border-pink-500/30 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-pink-300 text-sm font-medium">
                AI-Powered Safety System
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Your Safety,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E91E8C] to-pink-400">
                Our Priority
              </span>
            </h1>

            <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Smart protection for women and children with real-time GPS
              tracking, AI-powered threat detection, and instant emergency
              alerts to your loved ones.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-pink-500/30 hover:-translate-y-1 transition-all duration-300"
              >
                Get Started Free
                <FiArrowRight className="text-lg" />
              </Link>
              <button className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                <FiPlay className="text-[#E91E8C]" />
                Watch Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              {[
                { number: "10K+", label: "Users Protected" },
                { number: "< 30s", label: "Response Time" },
                { number: "24/7", label: "Active Monitoring" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-[#E91E8C]">
                    {stat.number}
                  </div>
                  <div className="text-gray-400 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Visual */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Main phone mockup / shield graphic */}
              <div className="w-72 h-72 sm:w-80 sm:h-80 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-pink-500/30 relative">
                {/* Pulsing rings */}
                <div className="absolute inset-0 rounded-full border-2 border-pink-500/20 animate-ping"></div>
                <div className="absolute inset-4 rounded-full border border-pink-400/20 animate-pulse"></div>

                {/* Center shield */}
                <div className="w-40 h-40 bg-gradient-to-br from-[#E91E8C] to-pink-700 rounded-full flex items-center justify-center shadow-2xl shadow-pink-500/50 z-10">
                  <BsShieldLockFill className="text-white text-6xl" />
                </div>

                {/* Floating Cards around the circle */}
                {/* Card 1 - top right */}
                <div
                  className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 z-20 animate-bounce"
                  style={{ animationDuration: "3s" }}
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <MdLocationOn className="text-green-500 text-lg" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1A1A2E]">
                      Live Location
                    </div>
                    <div className="text-xs text-green-500">Active ✓</div>
                  </div>
                </div>

                {/* Card 2 - bottom left */}
                <div
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 z-20 animate-bounce"
                  style={{ animationDuration: "4s", animationDelay: "1s" }}
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <MdNotifications className="text-red-500 text-lg" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1A1A2E]">
                      Alert Sent!
                    </div>
                    <div className="text-xs text-red-500">
                      3 contacts notified
                    </div>
                  </div>
                </div>

                {/* Card 3 - bottom right */}
                <div
                  className="absolute -bottom-2 -right-6 bg-white rounded-2xl shadow-xl p-3 z-20 animate-bounce"
                  style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                      <FiShield className="text-[#E91E8C] text-lg" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A1A2E]">
                        Safe Zone
                      </div>
                      <div className="text-xs text-[#E91E8C]">Protected</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 60L1440 60L1440 30C1200 60 960 0 720 30C480 60 240 0 0 30L0 60Z"
            fill="#F8F9FA"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
