import { Link } from "react-router-dom";
import { FiArrowRight, FiShield } from "react-icons/fi";

const CTA = () => {
  return (
    <section id="contact" className="py-24 bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] rounded-3xl p-12 sm:p-16 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-[#E91E8C] to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-pink-500/30">
              <FiShield className="text-white text-4xl" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Start Your Safety Journey Today
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of women and families who trust SafeGuard for their
              daily protection. It's free to get started.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-pink-500/30 hover:-translate-y-1 transition-all duration-300"
              >
                Create Free Account
                <FiArrowRight />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Already have account? Login
              </Link>
            </div>

            <p className="text-gray-500 text-sm mt-6">
              No credit card required • Free forever plan available
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
