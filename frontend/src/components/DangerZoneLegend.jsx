import { useState } from "react";
import { FiInfo, FiChevronDown, FiChevronUp } from "react-icons/fi";

const DangerZoneLegend = ({ zones, showZones, setShowZones }) => {
  const [expanded, setExpanded] = useState(false);

  const riskCounts = {
    high: zones.filter((z) => z.risk === "high").length,
    medium: zones.filter((z) => z.risk === "medium").length,
    low: zones.filter((z) => z.risk === "low").length,
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <FiInfo className="text-blue-500 text-sm" />
          </div>
          <div>
            <p className="font-bold text-[#1A1A2E] text-xs">Danger Zones</p>
            <p className="text-gray-400 text-xs">{zones.length} zones found</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showZones}
              onChange={(e) => {
                e.stopPropagation();
                setShowZones(e.target.checked);
              }}
              className="w-4 h-4 accent-[#E91E8C]"
            />
            <span className="text-xs font-medium text-gray-600">Show</span>
          </label>
          {expanded ? (
            <FiChevronUp className="text-gray-400" />
          ) : (
            <FiChevronDown className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 p-3 space-y-2">
          {/* Risk levels */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-xs font-medium text-gray-700">
                  High Risk
                </span>
              </div>
              <span className="text-xs font-bold text-red-600">
                {riskCounts.high}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-medium text-gray-700">
                  Medium Risk
                </span>
              </div>
              <span className="text-xs font-bold text-yellow-600">
                {riskCounts.medium}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-gray-700">
                  Low Risk
                </span>
              </div>
              <span className="text-xs font-bold text-green-600">
                {riskCounts.low}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 rounded-lg p-2 mt-3">
            <p className="text-blue-700 text-xs leading-relaxed">
              ℹ️ Risk levels change based on time of day. Some areas are safer
              during daylight hours.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DangerZoneLegend;
