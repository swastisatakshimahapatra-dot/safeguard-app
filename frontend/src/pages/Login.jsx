import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiShield, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { loginUser } from '../services/authService'

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter valid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Minimum 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      login(response.user, response.token);
      toast.success(`Welcome back, ${response.user.fullName}! 💪`);

      // Route based on role
      if (response.user.role === "family") {
        navigate("/family/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] items-center justify-center relative overflow-hidden p-12">
        {/* Background decorations */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-700 rounded-2xl flex items-center justify-center shadow-xl">
              <FiShield className="text-white text-3xl" />
            </div>
            <div>
              <span className="text-3xl font-bold text-white">Safe</span>
              <span className="text-3xl font-bold text-[#E91E8C]">Guard</span>
            </div>
          </div>

          {/* Shield graphic */}
          <div className="w-48 h-48 bg-gradient-to-br from-[#E91E8C]/20 to-purple-500/20 rounded-full flex items-center justify-center border border-pink-500/20 mx-auto mb-10 relative">
            <div className="absolute inset-0 rounded-full border border-pink-400/10 animate-pulse"></div>
            <FiShield className="text-[#E91E8C] text-8xl" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">Welcome Back!</h2>
          <p className="text-gray-400 text-lg max-w-sm mx-auto leading-relaxed">
            Your safety network is active and ready to protect you and your
            loved ones.
          </p>

          {/* Feature points */}
          <div className="mt-10 space-y-3 text-left max-w-xs mx-auto">
            {[
              "Real-time GPS tracking active",
              "Emergency contacts ready",
              "AI monitoring enabled",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl flex items-center justify-center">
              <FiShield className="text-white text-xl" />
            </div>
            <div>
              <span className="text-xl font-bold text-[#1A1A2E]">Safe</span>
              <span className="text-xl font-bold text-[#E91E8C]">Guard</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">Sign In</h1>
            <p className="text-gray-500">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-xl text-[#1A1A2E] placeholder-gray-400 focus:outline-none focus:border-[#E91E8C] transition-colors ${
                    errors.email
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  ⚠ {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full pl-11 pr-12 py-3.5 border-2 rounded-xl text-[#1A1A2E] placeholder-gray-400 focus:outline-none focus:border-[#E91E8C] transition-colors ${
                    errors.password
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E91E8C]"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  ⚠ {errors.password}
                </p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 accent-[#E91E8C]"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm text-[#E91E8C] font-semibold hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-pink-300 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-gray-400 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="w-full py-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <FcGoogle className="text-xl" />
              Continue with Google
            </button>
          </form>

          {/* Bottom Links */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-[#E91E8C] font-semibold hover:underline"
              >
                Create one free
              </Link>
            </p>
            <p className="text-gray-400 text-xs">
              By signing in, you agree to our{" "}
              <a href="#" className="underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
