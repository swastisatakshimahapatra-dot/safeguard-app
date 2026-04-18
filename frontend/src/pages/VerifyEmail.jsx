import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiShield } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`);

        if (response.data.success) {
          // ✅ Login saves to localStorage
          login(response.data.user, response.data.token);

          // ✅ Give localStorage time to update before redirect
          await new Promise((resolve) => setTimeout(resolve, 100));

          toast.success("Email verified! Welcome to SafeGuard 🎉");

          // ✅ Redirect
          if (response.data.user.role === "family") {
            navigate("/family/dashboard", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Verification failed");
      }
    };

    if (token) verify();
  }, [token, login, navigate]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#F8F9FA] 
    to-pink-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-12 h-12 bg-gradient-to-br from-pink-500 
          to-pink-700 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <FiShield className="text-white text-2xl" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#1A1A2E]">Safe</span>
            <span className="text-2xl font-bold text-[#E91E8C]">Guard</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          {/* ✅ Only show verifying spinner — never show success div */}
          {status === "verifying" && (
            <>
              <div
                className="w-20 h-20 border-4 border-[#E91E8C] 
              border-t-transparent rounded-full animate-spin mx-auto mb-6"
              ></div>
              <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">
                Verifying Your Email...
              </h2>
              <p className="text-gray-400 text-sm">
                Please wait, redirecting you...
              </p>
            </>
          )}

          {/* ✅ Only show error if actually failed */}
          {status === "error" && (
            <>
              <div
                className="w-24 h-24 bg-red-50 rounded-3xl flex 
              items-center justify-center mx-auto mb-6"
              >
                <span className="text-5xl">❌</span>
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-500 text-sm mb-6">{message}</p>
              <button
                onClick={() => navigate("/register")}
                className="w-full py-3 bg-gradient-to-r from-[#E91E8C] 
                to-pink-600 text-white font-semibold rounded-xl"
              >
                Back to Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
