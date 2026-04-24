import React from 'react';

/**
 * Composant Heatmap pour visualiser l'exécution des programmes
 */
export function Heatmap({ data, className = '' }) {
  const getColor = (percentage) => {
    if (percentage >= 100) return 'bg-danger-500';
    if (percentage >= 75) return 'bg-warning-500';
    if (percentage >= 50) return 'bg-yellow-400';
    return 'bg-success-500';
  };

  const getTooltip = (item) => {
    return `${item.label}: ${item.percentage}% (${item.used}/${item.total})`;
  };

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
        {data.map((item, index) => (
          <div
            key={index}
            className={`${getColor(item.percentage)} w-8 h-8 rounded cursor-pointer relative group`}
            title={getTooltip(item)}
          >
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                {getTooltip(item)}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Légende */}
      <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-success-500 rounded"></div>
          <span>&lt;50%</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span>50-74%</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-warning-500 rounded"></div>
          <span>75-99%</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-danger-500 rounded"></div>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

