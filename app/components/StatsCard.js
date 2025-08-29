import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

// Modern Stats Card Component with Advanced Visual Effects
const StatsCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue", className = "" }) => {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-blue-500/30",
    green: "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white shadow-emerald-500/30",
    amber: "bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white shadow-amber-500/30",
    red: "bg-gradient-to-br from-red-500 via-pink-600 to-rose-700 text-white shadow-red-500/30",
    purple: "bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 text-white shadow-purple-500/30",
    indigo: "bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-700 text-white shadow-indigo-500/30"
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-white/20 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium opacity-90 mb-1 truncate">{title}</p>
          <p className="text-lg font-bold mb-1 truncate">{value}</p>
          {trend && (
            <div className="flex items-center space-x-1">
              {trend === 'up' ? (
                <FaArrowUp className="text-xs text-green-200" />
              ) : (
                <FaArrowDown className="text-xs text-red-200" />
              )}
              <span className="text-xs opacity-80">{trendValue}%</span>
            </div>
          )}
        </div>
        <div className="ml-2 flex-shrink-0">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icon className="text-base" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
