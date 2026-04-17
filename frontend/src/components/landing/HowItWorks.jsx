import { FiUserPlus, FiSmartphone, FiAlertCircle } from "react-icons/fi";
import { MdArrowForward } from "react-icons/md";

const steps = [
  {
    step: "01",
    icon: <FiUserPlus className="text-3xl" />,
    title: "Register & Setup",
    description:
      "Create your account and add emergency contacts — family, friends, or anyone you trust.",
    color: "from-[#E91E8C] to-pink-600",
  },
  {
    step: "02",
    icon: <FiSmartphone className="text-3xl" />,
    title: "Stay Connected",
    description:
      "The system runs silently in background, tracking your location and monitoring for threats.",
    color: "from-purple-500 to-purple-700",
  },
  {
    step: "03",
    icon: <FiAlertCircle className="text-3xl" />,
    title: "Get Instant Help",
    description:
      "One press or automatic detection triggers alerts to contacts, community, and authorities.",
    color: "from-red-500 to-red-700",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 rounded-full px-4 py-2 mb-4">
            <span className="text-purple-600 text-sm font-semibold">
              Simple Process
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-4">
            How It <span className="text-[#E91E8C]">Works</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Getting protected is simple. Three easy steps to activate your
            safety network.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-0">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col lg:flex-row items-center">
              {/* Step Card */}
              <div className="w-full lg:w-72 bg-[#F8F9FA] rounded-3xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group relative">
                {/* Step number */}
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#1A1A2E] text-white rounded-xl flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>

                {/* Icon */}
                <div
                  className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-[#1A1A2E] font-bold text-xl mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center w-16 h-16 lg:mx-2">
                  <MdArrowForward className="text-3xl text-[#E91E8C] rotate-90 lg:rotate-0 opacity-50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
