import { FiAlertTriangle, FiX, FiPhone, FiNavigation } from "react-icons/fi";
import { MdLocalPolice } from "react-icons/md";
import { getRiskColor } from "../services/dangerZoneService";

const DangerZoneWarning = ({ zone, onDismiss, onGetMeOut, onCallPolice }) => {
  if (!zone) return null;

  const riskColor = getRiskColor(zone.currentRisk);

  return (
    <div className="fixed top-20 left-4 right-4 z-50 animate-shake">
      <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-500 overflow-hidden max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
              <FiAlertTriangle className="text-white text-xl" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                ⚠️ DANGER ZONE WARNING
              </p>
              <p className="text-red-100 text-xs">You entered an unsafe area</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors"
          >
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Zone Info */}
          <div>
            <p className="font-bold text-[#1A1A2E] text-lg mb-1">{zone.name}</p>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${riskColor.text} ${riskColor.bg}`}
              >
                {zone.currentRisk.toUpperCase()} RISK
              </span>
              {zone.activeHours && (
                <span className="text-xs text-gray-500">
                  🕐 Dangerous: {zone.activeHours.start} -{" "}
                  {zone.activeHours.end}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-1">
              <strong>Reason:</strong> {zone.reason}
            </p>
            {zone.description && (
              <p className="text-gray-500 text-xs">{zone.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={onGetMeOut}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              <FiNavigation /> Get Me Out Safely
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onCallPolice}
                className="flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm"
              >
                <FiPhone /> Call 100
              </button>
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors text-sm"
              >
                <FiPhone /> Emergency 112
              </a>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-yellow-800 font-semibold text-xs mb-1">
              🛡️ Safety Tips:
            </p>
            <ul className="text-yellow-700 text-xs space-y-1 list-disc list-inside">
              <li>Stay on well-lit main roads</li>
              <li>Keep family informed of your location</li>
              <li>Avoid stopping or engaging with strangers</li>
              <li>Call police if you feel threatened</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Add shake animation to index.css
// Add this to your CSS file
const styles = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.5s;
}
`;

export default DangerZoneWarning;
