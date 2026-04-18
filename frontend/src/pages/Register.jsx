import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiShield,
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
} from "react-icons/fi";
import { MdSecurity, MdFamilyRestroom } from "react-icons/md";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../services/authService";
import { checkEmailExists } from "../services/authService";
import api from "../services/api";

// ✅ MOVED OUTSIDE - This is the fix
const InputField = ({
  label,
  name,
  type = "text",
  placeholder,
  icon,
  value,
  onChange,
  error,
  maxLength,
}) => (
  <div>
    <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        className={`w-full ${icon ? "pl-11" : "pl-4"} pr-4 py-3.5 border-2 rounded-xl 
          text-[#1A1A2E] placeholder-gray-400 
          focus:outline-none focus:border-[#E91E8C] 
          transition-colors ${
            error ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
          }`}
      />
    </div>
    {error && <p className="text-red-500 text-xs mt-1.5">⚠ {error}</p>}
  </div>
);

// ============================================
// ✅ MAIN REGISTER COMPONENT
// ============================================
const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordError, setPasswordError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // ✅ Move formData UP - before all useEffects
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    role: "",
    contacts: [
      { name: "", phone: "", email: "", relation: "" },
      { name: "", phone: "", email: "", relation: "" },
      { name: "", phone: "", email: "", relation: "" },
    ],
    terms: false,
  });

  const [verificationSent, setVerificationSent] = useState(() => {
    return localStorage.getItem("safeguard_verify_sent") === "true";
  });
  const [verificationEmail, setVerificationEmail] = useState(() => {
    return localStorage.getItem("safeguard_verify_email") || "";
  });

  const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  // ✅ FIRST useEffect - check on mount
  useEffect(() => {
    const checkOnMount = async () => {
      const token = localStorage.getItem("safeguard_token");
      const user = localStorage.getItem("safeguard_user");
      const wasSent = localStorage.getItem("safeguard_verify_sent") === "true";
      const email = localStorage.getItem("safeguard_verify_email");

      if (token && user) {
        localStorage.removeItem("safeguard_verify_sent");
        localStorage.removeItem("safeguard_verify_email");
        try {
          const parsedUser = JSON.parse(user);
          navigate(
            parsedUser.role === "family" ? "/family/dashboard" : "/dashboard",
            { replace: true },
          );
        } catch {
          navigate("/dashboard", { replace: true });
        }
        return;
      }

      if (wasSent && email) {
        try {
          const response = await api.post("/auth/check-email", { email });
          if (response.data.verified === true) {
            localStorage.removeItem("safeguard_verify_sent");
            localStorage.removeItem("safeguard_verify_email");
            toast.success("Email verified! Please login to continue.", {
              duration: 4000,
            });
            navigate("/login", { replace: true });
          }
        } catch {
          // API failed - show verification page normally
        }
      }
    };

    checkOnMount();
  }, []);

  // ✅ SECOND useEffect - polling with backend check
  useEffect(() => {
    if (!verificationSent || isRedirecting) return;

    let mounted = true;

    const checkVerificationStatus = async () => {
      if (!mounted || isRedirecting) return;

      try {
        const email = localStorage.getItem("safeguard_verify_email");
        if (!email) return;

        const response = await api.post("/auth/check-email", { email });

        if (response.data.verified === true) {
          if (!mounted) return;

          const existingToken = localStorage.getItem("safeguard_token");
          const existingUser = localStorage.getItem("safeguard_user");

          if (existingToken && existingUser) {
            setIsRedirecting(true);
            clearInterval(pollInterval);

            localStorage.removeItem("safeguard_verify_sent");
            localStorage.removeItem("safeguard_verify_email");

            try {
              const parsedUser = JSON.parse(existingUser);
              toast.success("Email verified! Redirecting...", {
                duration: 2000,
              });
              setTimeout(() => {
                if (!mounted) return;
                navigate(
                  parsedUser.role === "family"
                    ? "/family/dashboard"
                    : "/dashboard",
                  { replace: true },
                );
              }, 500);
            } catch {
              navigate("/dashboard", { replace: true });
            }
          } else {
            // ✅ Auto login using form password
            setIsRedirecting(true);
            clearInterval(pollInterval);

            try {
              const loginResponse = await api.post("/auth/login", {
                email: email,
                password: formData.password,
              });

              if (loginResponse.data.success) {
                login(loginResponse.data.user, loginResponse.data.token);

                localStorage.removeItem("safeguard_verify_sent");
                localStorage.removeItem("safeguard_verify_email");

                toast.success("Email verified! Welcome to SafeGuard 🎉", {
                  duration: 3000,
                });

                setTimeout(() => {
                  if (!mounted) return;
                  navigate(
                    loginResponse.data.user.role === "family"
                      ? "/family/dashboard"
                      : "/dashboard",
                    { replace: true },
                  );
                }, 500);
              }
            } catch (loginError) {
              console.log("Auto-login failed:", loginError);
              setIsRedirecting(false);
              localStorage.removeItem("safeguard_verify_sent");
              localStorage.removeItem("safeguard_verify_email");
              toast.success("Email verified! Please login to continue.", {
                duration: 4000,
              });
              setTimeout(() => {
                navigate("/login", { replace: true });
              }, 1000);
            }
          }
        }
      } catch (error) {
        console.log("Check failed, retrying...");
      }
    };

    // ✅ Check immediately
    checkVerificationStatus();

    // ✅ Poll every 3 seconds
    const pollInterval = setInterval(checkVerificationStatus, 3000);

    const handleFocus = () => {
      if (!isRedirecting) checkVerificationStatus();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !isRedirecting) {
        checkVerificationStatus();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [verificationSent, isRedirecting, navigate, login, formData.password]);

  const totalSteps = 4;

  // ✅ Handle main form fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Handle contact fields
  const handleContactChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedContacts = [...prev.contacts];
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value,
      };
      return { ...prev, contacts: updatedContacts };
    });
  };

  // ✅ Validate step 1
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter valid email";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    else if (formData.phone.length < 10)
      newErrors.phone = "Enter valid 10-digit number";

    // ✅ Use regex for password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      setPasswordError(
        "Min 6 chars with uppercase, lowercase, number & special character (@$!%*?&)",
      );
      newErrors.password = " "; // ✅ Trigger red border without duplicate message
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.gender) newErrors.gender = "Please select gender";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const firstContact = formData.contacts[0];

    if (!firstContact.name.trim()) {
      toast.error("Please enter name for Contact 1");
      return false;
    }
    if (!firstContact.phone.trim()) {
      toast.error("Please enter phone for Contact 1");
      return false;
    }
    if (firstContact.phone.trim().length < 10) {
      toast.error("Contact 1 phone must be 10 digits");
      return false;
    }
    // ✅ Email mandatory for contact 1
    if (!firstContact.email.trim()) {
      toast.error("Please enter email for Contact 1");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(firstContact.email)) {
      toast.error("Please enter valid email for Contact 1");
      return false;
    }
    if (!firstContact.relation) {
      toast.error("Please select relation for Contact 1");
      return false;
    }

    // Check other contacts
    for (let i = 1; i < formData.contacts.length; i++) {
      const contact = formData.contacts[i];
      if (contact.name.trim() || contact.phone.trim() || contact.email.trim()) {
        if (!contact.name.trim()) {
          toast.error(`Please enter name for Contact ${i + 1}`);
          return false;
        }
        if (!contact.phone.trim()) {
          toast.error(`Please enter phone for Contact ${i + 1}`);
          return false;
        }
        if (contact.phone.trim().length < 10) {
          toast.error(`Contact ${i + 1} phone must be 10 digits`);
          return false;
        }
        // ✅ Email mandatory for other contacts if partially filled
        if (!contact.email.trim()) {
          toast.error(`Please enter email for Contact ${i + 1}`);
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(contact.email)) {
          toast.error(`Please enter valid email for Contact ${i + 1}`);
          return false;
        }
        if (!contact.relation) {
          toast.error(`Please select relation for Contact ${i + 1}`);
          return false;
        }
      }
    }

    return true;
  };

  // ✅ Validate step 3
  const validateStep3 = () => {
    if (!formData.role) {
      toast.error("Please select your role");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;

      setLoading(true);
      try {
        const result = await checkEmailExists(formData.email);

        if (result.exists && result.verified) {
          toast(
            (t) => (
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-sm">Already Registered!</p>
                <p className="text-xs text-gray-600">
                  This email is already registered. Please login instead.
                </p>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate("/login");
                  }}
                  className="px-4 py-2 bg-[#E91E8C] text-white text-xs 
                font-bold rounded-lg hover:bg-pink-600"
                >
                  Go to Login →
                </button>
              </div>
            ),
            {
              duration: 8000,
              icon: "⚠️",
              style: {
                background: "white",
                color: "#1A1A2E",
                border: "2px solid #E91E8C",
              },
            },
          );
          setLoading(false);
          return;
        }

        if (result.exists && !result.verified) {
          toast.error(
            "Email registered but not verified. Check your inbox! 📧",
            { duration: 6000 },
          );
          setLoading(false);
          return;
        }

        setStep((prev) => prev + 1);
        setErrors({});
        window.scrollTo({ top: 0, behavior: "instant" }); // ✅ Scroll top on next
      } catch (error) {
        setStep((prev) => prev + 1);
        setErrors({});
        window.scrollTo({ top: 0, behavior: "instant" }); // ✅ Scroll top on next
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((prev) => prev + 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "instant" }); // ✅ Scroll top on next
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "instant" }); // ✅ Scroll top on back
  };

  // ✅ Submit
  const handleSubmit = async () => {
    if (!formData.terms) {
      toast.error("Please accept terms and conditions");
      return;
    }
    setLoading(true);
    try {
      const response = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        gender: formData.gender,
        role: formData.role,
        contacts: formData.contacts,
      });

      if (response.requiresVerification) {
        // ✅ Save to localStorage so refresh doesn't lose state
        localStorage.setItem("safeguard_verify_sent", "true");
        localStorage.setItem("safeguard_verify_email", formData.email);

        setVerificationEmail(formData.email);
        setVerificationSent(true);
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    // ✅ Show redirecting loader
    if (isRedirecting) {
      return (
        <div
          className="min-h-screen bg-gradient-to-br from-[#F8F9FA] 
      to-pink-50 flex items-center justify-center py-6 px-3"
        >
          <div className="w-full max-w-md">
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
              <div
                className="w-20 h-20 border-4 border-green-500 
            border-t-transparent rounded-full animate-spin mx-auto mb-6"
              ></div>
              <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">
                Email Verified! ✅
              </h2>
              <p className="text-gray-500 text-sm">
                Redirecting to your dashboard...
              </p>
            </div>
          </div>
        </div>
      );
    }

    // ✅ Show "Check Your Email" screen if not redirecting
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-[#F8F9FA] 
    to-pink-50 flex items-center justify-center py-6 px-3"
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

          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            {/* Email icon */}
            <div
              className="w-24 h-24 bg-pink-50 rounded-3xl flex 
          items-center justify-center mx-auto mb-6"
            >
              <span className="text-5xl">📧</span>
            </div>

            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-3">
              Check Your Email!
            </h2>

            <p className="text-gray-500 text-sm leading-relaxed mb-2">
              We sent a verification link to:
            </p>
            <p className="text-[#E91E8C] font-bold text-base mb-6">
              {verificationEmail}
            </p>

            <div
              className="bg-blue-50 border border-blue-100 rounded-2xl 
          p-4 mb-6 text-left"
            >
              <p className="text-blue-700 text-sm font-semibold mb-2">
                📋 Next Steps:
              </p>
              <ol
                className="text-blue-600 text-xs space-y-1.5 list-decimal 
            list-inside"
              >
                <li>Open your email inbox</li>
                <li>
                  Click the <strong>"Verify My Email"</strong> button
                </li>
                <li>You'll be automatically redirected to your dashboard</li>
              </ol>
            </div>

            <p className="text-gray-400 text-xs mb-6">
              Link expires in 24 hours. Check spam folder if not received.
            </p>

            {/* Resend button */}
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  await sendVerificationEmail({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    gender: formData.gender,
                  });
                  toast.success("Verification email resent! ✅");
                } catch {
                  toast.error("Failed to resend");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full py-3 border-2 border-[#E91E8C] text-[#E91E8C] 
            font-semibold rounded-xl hover:bg-pink-50 transition-all mb-3 
            disabled:opacity-60"
            >
              {loading ? "Sending..." : "📨 Resend Verification Email"}
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("safeguard_verify_sent");
                localStorage.removeItem("safeguard_verify_email");
                setVerificationSent(false);
                setIsRedirecting(false); // ✅ Reset redirect state
                setStep(1);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
              className="text-gray-400 text-sm hover:text-gray-600"
            >
              ← Change email address
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-pink-50 flex items-center justify-center py-6 px-3 sm:py-12 sm:px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-700 rounded-2xl flex items-center justify-center shadow-lg">
            <FiShield className="text-white text-2xl" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#1A1A2E]">Safe</span>
            <span className="text-2xl font-bold text-[#E91E8C]">Guard</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-8 lg:p-10">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                    s < step
                      ? "bg-green-500 text-white"
                      : s === step
                        ? "bg-[#E91E8C] text-white shadow-lg shadow-pink-300"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {s < step ? <FiCheck /> : s}
                </div>
                {s < totalSteps && (
                  <div
                    className={`h-1 w-6 sm:w-12 lg:w-20 mx-0.5 sm:mx-1 rounded-full transition-all duration-300 ${
                      s < step ? "bg-green-500" : "bg-gray-100"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#1A1A2E]">
              {step === 1 && "Personal Information"}
              {step === 2 && "Emergency Contacts"}
              {step === 3 && "Select Your Role"}
              {step === 4 && "Review & Confirm"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Step {step} of {totalSteps}
            </p>
          </div>

          {/* ============ STEP 1 ============ */}
          {step === 1 && (
            <div className="space-y-5">
              <InputField
                label="Full Name"
                name="fullName"
                placeholder="Enter your full name"
                icon={<FiUser />}
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
              />

              <InputField
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@example.com"
                icon={<FiMail />}
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />

              <InputField
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="10-digit mobile number"
                icon={<FiPhone />}
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                maxLength={10}
              />

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                  Gender
                </label>
                <div className="flex gap-2">
                  {["Female", "Male", "Other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, gender: g }));
                        if (errors.gender) {
                          setErrors((prev) => ({ ...prev, gender: "" }));
                        }
                      }}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all ${
                        formData.gender === g
                          ? "border-[#E91E8C] bg-pink-50 text-[#E91E8C]"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <p className="text-red-500 text-xs mt-1.5">
                    ⚠ {errors.gender}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                  Password
                </label>
                <div className="relative">
                  <FiLock
                    className="absolute left-4 top-1/2 -translate-y-1/2 
    text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={(e) => {
                      handleChange(e);
                      // ✅ Clear error while typing
                      if (passwordError) setPasswordError("");
                    }}
                    onBlur={() => {
                      // ✅ Validate on blur (when user leaves field)
                      if (
                        formData.password &&
                        !PASSWORD_REGEX.test(formData.password)
                      ) {
                        setPasswordError(
                          "Min 6 chars with uppercase, lowercase, number & special character (@$!%*?&)",
                        );
                      } else {
                        setPasswordError("");
                      }
                    }}
                    placeholder="Minimum 6 characters"
                    autoComplete="off"
                    className={`w-full pl-11 pr-12 py-3.5 border-2 rounded-xl
        text-[#1A1A2E] placeholder-gray-400
        focus:outline-none focus:border-[#E91E8C]
        transition-colors ${
          errors.password || passwordError
            ? "border-red-400 bg-red-50"
            : formData.password && PASSWORD_REGEX.test(formData.password)
              ? "border-green-400 bg-green-50"
              : "border-gray-200 bg-gray-50"
        }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 
      text-gray-400 hover:text-[#E91E8C]"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                  {/* ✅ Green check when valid */}
                  {formData.password &&
                    PASSWORD_REGEX.test(formData.password) && (
                      <FiCheck
                        className="absolute right-10 top-1/2 -translate-y-1/2 
      text-green-500"
                      />
                    )}
                </div>
                {/* ✅ Show error below - no rules list */}
                {(errors.password || passwordError) && (
                  <p className="text-red-500 text-xs mt-1.5">
                    ⚠ {errors.password || passwordError}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock
                    className="absolute left-4 top-1/2 -translate-y-1/2 
    text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    autoComplete="off"
                    className={`w-full pl-11 pr-12 py-3.5 border-2 rounded-xl
        text-[#1A1A2E] placeholder-gray-400
        focus:outline-none focus:border-[#E91E8C]
        transition-colors ${
          errors.confirmPassword
            ? "border-red-400 bg-red-50"
            : formData.confirmPassword &&
                formData.password === formData.confirmPassword
              ? "border-green-400 bg-green-50"
              : "border-gray-200 bg-gray-50"
        }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 
      text-gray-400 hover:text-[#E91E8C]"
                  >
                    {showConfirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                  {/* ✅ Green check when passwords match */}
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword && (
                      <FiCheck
                        className="absolute right-10 top-1/2 -translate-y-1/2 
        text-green-500"
                      />
                    )}
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5">
                    ⚠ {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ============ STEP 2 ============ */}
          {step === 2 && (
            <div className="space-y-5">
              {formData.contacts.map((contact, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-2xl p-5 transition-colors ${
                    index === 0
                      ? "border-pink-200 bg-pink-50/30"
                      : "border-gray-100"
                  }`}
                >
                  {/* Contact Header */}
                  <h4 className="font-semibold text-[#1A1A2E] mb-4 flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? "bg-[#E91E8C]" : "bg-gray-400"
                      }`}
                    >
                      {index + 1}
                    </div>
                    Contact {index + 1}
                    {index === 0 ? (
                      <span className="text-red-500 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                        Required *
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs font-normal bg-gray-100 px-2 py-0.5 rounded-full">
                        Optional
                      </span>
                    )}
                  </h4>

                  <div className="space-y-3">
                    {/* Contact Name */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        Full Name{" "}
                        {index === 0 && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          index === 0
                            ? "Required - Contact's full name"
                            : "Contact's full name"
                        }
                        value={contact.name}
                        onChange={(e) =>
                          handleContactChange(index, "name", e.target.value)
                        }
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-white focus:outline-none focus:border-[#E91E8C] text-[#1A1A2E] placeholder-gray-400 transition-colors ${
                          index === 0 && !contact.name
                            ? "border-pink-200"
                            : "border-gray-200"
                        }`}
                      />
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        Phone Number{" "}
                        {index === 0 && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type="tel"
                        placeholder={
                          index === 0
                            ? "Required - 10-digit number"
                            : "10-digit number"
                        }
                        value={contact.phone}
                        maxLength={10}
                        onChange={(e) =>
                          handleContactChange(index, "phone", e.target.value)
                        }
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-white focus:outline-none focus:border-[#E91E8C] text-[#1A1A2E] placeholder-gray-400 transition-colors ${
                          index === 0 && !contact.phone
                            ? "border-pink-200"
                            : "border-gray-200"
                        }`}
                      />
                      {contact.phone && contact.phone.length < 10 && (
                        <p className="text-orange-500 text-xs mt-1">
                          ⚠ Enter 10 digit number ({contact.phone.length}/10)
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        Email Address{" "}
                        {index === 0 && <span className="text-red-400">*</span>}
                        {index > 0 && (
                          <span className="text-gray-400 font-normal">
                            (required if contact added)
                          </span>
                        )}
                      </label>
                      <input
                        type="email"
                        placeholder={
                          index === 0
                            ? "Required - Email for emergency alerts"
                            : "Email address (required if adding contact)"
                        }
                        value={contact.email}
                        onChange={(e) =>
                          handleContactChange(index, "email", e.target.value)
                        }
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-white 
    focus:outline-none focus:border-[#E91E8C] text-[#1A1A2E] 
    placeholder-gray-400 transition-colors ${
      index === 0 && !contact.email ? "border-pink-200" : "border-gray-200"
    }`}
                      />
                    </div>

                    {/* Relation */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        Relation{" "}
                        {index === 0 && <span className="text-red-400">*</span>}
                      </label>
                      <select
                        value={contact.relation}
                        onChange={(e) =>
                          handleContactChange(index, "relation", e.target.value)
                        }
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-white focus:outline-none focus:border-[#E91E8C] text-[#1A1A2E] transition-colors ${
                          index === 0 && !contact.relation
                            ? "border-pink-200 text-gray-400"
                            : contact.relation
                              ? "border-gray-200 text-[#1A1A2E]"
                              : "border-gray-200 text-gray-400"
                        }`}
                      >
                        <option value="">
                          {index === 0
                            ? "Required - Select Relation"
                            : "Select Relation"}
                        </option>
                        <option>Mother</option>
                        <option>Father</option>
                        <option>Sibling</option>
                        <option>Spouse</option>
                        <option>Friend</option>
                        <option>Guardian</option>
                        <option>Other</option>
                      </select>
                    </div>

                    {/* Completion indicator */}
                    {contact.name &&
                      contact.phone &&
                      contact.relation &&
                      contact.phone.length >= 10 && (
                        <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          Contact {index + 1} complete
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============ STEP 3 ============ */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-gray-500 text-sm text-center mb-6">
                Choose how you'll use SafeGuard
              </p>

              {[
                {
                  role: "user",
                  icon: <MdSecurity className="text-4xl" />,
                  title: "I Need Protection",
                  subtitle: "User",
                  description:
                    "I am a woman or child who needs safety monitoring and emergency alerts.",
                  color: "from-[#E91E8C] to-pink-600",
                  selectedBorder: "border-[#E91E8C]",
                  selectedBg: "bg-pink-50",
                },
                {
                  role: "family",
                  icon: <MdFamilyRestroom className="text-4xl" />,
                  title: "I Want to Monitor",
                  subtitle: "Family Member",
                  description:
                    "I am a guardian who wants to track and monitor my loved one's safety.",
                  color: "from-blue-400 to-blue-600",
                  selectedBorder: "border-blue-500",
                  selectedBg: "bg-blue-50",
                },
              ].map((option) => (
                <button
                  key={option.role}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: option.role }))
                  }
                  className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                    formData.role === option.role
                      ? `${option.selectedBg} ${option.selectedBorder} shadow-md`
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${option.color} rounded-2xl flex items-center justify-center text-white flex-shrink-0`}
                    >
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            {option.subtitle}
                          </p>
                          <h3 className="text-lg font-bold text-[#1A1A2E]">
                            {option.title}
                          </h3>
                        </div>
                        {formData.role === option.role && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <FiCheck className="text-white text-sm" />
                          </div>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ============ STEP 4 ============ */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h4 className="font-bold text-[#1A1A2E] mb-4">
                  Account Summary
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "Name", value: formData.fullName },
                    { label: "Email", value: formData.email },
                    { label: "Phone", value: formData.phone },
                    { label: "Gender", value: formData.gender },
                    {
                      label: "Role",
                      value:
                        formData.role === "user"
                          ? "🛡 User (Protection)"
                          : "👨‍👩‍👧 Family Member (Monitor)",
                    },
                    {
                      label: "Emergency Contacts",
                      value: `${formData.contacts.filter((c) => c.name && c.phone).length} added`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                    >
                      <span className="text-gray-500 text-sm">
                        {item.label}
                      </span>
                      <span className="font-semibold text-[#1A1A2E] text-sm">
                        {item.value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="w-5 h-5 accent-[#E91E8C] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  I agree to SafeGuard's{" "}
                  <a href="#" className="text-[#E91E8C] underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-[#E91E8C] underline">
                    Privacy Policy
                  </a>
                  . I understand my location data is used for safety only.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-pink-300 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  "🎉 Create My Account"
                )}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <FiArrowLeft /> Back
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3 text-gray-500 font-semibold hover:text-[#E91E8C] transition-colors"
              >
                Already have account?
              </Link>
            )}

            {step < totalSteps && (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-300 hover:-translate-y-0.5 transition-all"
              >
                Next <FiArrowRight />
              </button>
            )}
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-gray-500 text-sm hover:text-[#E91E8C] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
