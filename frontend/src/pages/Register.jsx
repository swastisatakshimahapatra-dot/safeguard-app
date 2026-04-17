import { useState } from "react";
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

// ✅ MOVED OUTSIDE
const PasswordField = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  show,
  onToggle,
}) => (
  <div>
    <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
      {label}
    </label>
    <div className="relative">
      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full pl-11 pr-12 py-3.5 border-2 rounded-xl 
          text-[#1A1A2E] placeholder-gray-400 
          focus:outline-none focus:border-[#E91E8C] 
          transition-colors ${
            error ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
          }`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E91E8C]"
      >
        {show ? <FiEyeOff /> : <FiEye />}
      </button>
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
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Minimum 6 characters";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.gender) newErrors.gender = "Please select gender";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    // At least first contact must be fully filled
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
    if (!firstContact.relation) {
      toast.error("Please select relation for Contact 1");
      return false;
    }

    // Check other contacts - if name filled then phone and relation also required
    for (let i = 1; i < formData.contacts.length; i++) {
      const contact = formData.contacts[i];
      if (contact.name.trim() || contact.phone.trim()) {
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

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((prev) => prev + 1);
    setErrors({});
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    setErrors({});
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
      login(response.user, response.token);
      toast.success("Account created! Welcome to SafeGuard 🎉");
      if (response.user.role === "family") {
        navigate("/family/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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

              <PasswordField
                label="Password"
                name="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
              />

              <PasswordField
                label="Confirm Password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
              />
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
                      <input
                        type="email"
                        placeholder="Email address (for email alerts)"
                        value={contact.email}
                        onChange={(e) =>
                          handleContactChange(index, "email", e.target.value)
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#E91E8C] text-[#1A1A2E] placeholder-gray-400 transition-colors"
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
