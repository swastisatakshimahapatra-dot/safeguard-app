import {
  MdLocationOn,
  MdNotifications,
  MdSecurity,
  MdPeople,
  MdWarning,
  MdCamera,
} from "react-icons/md";
import { BsMicFill } from "react-icons/bs";
import { FiZap } from "react-icons/fi";

const features = [
  {
    icon: <FiZap className="text-2xl" />,
    title: "Smart Panic Button",
    description:
      "One press instantly alerts family, nearby helpers, and police with live location and time.",
    color: "from-red-400 to-red-600",
    bg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    icon: <MdLocationOn className="text-2xl" />,
    title: "Real-Time GPS Tracking",
    description:
      "Continuous location tracking shared with emergency contacts for quick assistance.",
    color: "from-blue-400 to-blue-600",
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    icon: <MdSecurity className="text-2xl" />,
    title: "Abnormal Movement Detection",
    description:
      "AI detects unusual patterns like sudden running or falling and auto-triggers alerts.",
    color: "from-purple-400 to-purple-600",
    bg: "bg-purple-50",
    iconColor: "text-purple-500",
  },
  {
    icon: <BsMicFill className="text-2xl" />,
    title: "Voice Help Recognition",
    description:
      'Detects distress words like "help" or screams and activates alerts hands-free.',
    color: "from-pink-400 to-pink-600",
    bg: "bg-pink-50",
    iconColor: "text-pink-500",
  },
  {
    icon: <MdCamera className="text-2xl" />,
    title: "Smart Image Capture",
    description:
      "Auto-captures surroundings and uses AI to detect weapons or suspicious objects.",
    color: "from-orange-400 to-orange-600",
    bg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    icon: <MdWarning className="text-2xl" />,
    title: "Crime Zone Alerts",
    description:
      "Get warned before entering high-risk or poorly lit areas with preventive alerts.",
    color: "from-yellow-400 to-yellow-600",
    bg: "bg-yellow-50",
    iconColor: "text-yellow-500",
  },
  {
    icon: <MdPeople className="text-2xl" />,
    title: "Community Network",
    description:
      "Alerts nearby registered users within 200m radius for immediate community help.",
    color: "from-green-400 to-green-600",
    bg: "bg-green-50",
    iconColor: "text-green-500",
  },
  {
    icon: <MdNotifications className="text-2xl" />,
    title: "Multi-Channel Alerts",
    description:
      "Alerts via SMS and push notifications ensuring delivery even in low-network areas.",
    color: "from-teal-400 to-teal-600",
    bg: "bg-teal-50",
    iconColor: "text-teal-500",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-pink-100 rounded-full px-4 py-2 mb-4">
            <span className="text-[#E91E8C] text-sm font-semibold">
              Our Features
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-4">
            Why Choose <span className="text-[#E91E8C]">SafeGuard?</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            An intelligent safety ecosystem that thinks, predicts, and responds
            — not just a simple button.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer border border-gray-100"
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <span className={feature.iconColor}>{feature.icon}</span>
              </div>

              {/* Content */}
              <h3 className="text-[#1A1A2E] font-bold text-lg mb-3 group-hover:text-[#E91E8C] transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Bottom gradient line on hover */}
              <div
                className={`h-1 bg-gradient-to-r ${feature.color} rounded-full mt-5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
