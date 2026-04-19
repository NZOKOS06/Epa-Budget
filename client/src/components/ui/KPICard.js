import React from 'react';

/**
 * Composant KPI Card pour les statistiques de dashboard
 */
export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  trendValue,
  color = 'primary',
  className = '' 
}) {
  const colorClasses = {
    primary: {
      icon: 'bg-primary-100 text-primary-600 group-hover:bg-primary-200',
      value: 'text-gray-900',
    },
    success: {
      icon: 'bg-success-100 text-success-600 group-hover:bg-success-200',
      value: 'text-gray-900',
    },
    warning: {
      icon: 'bg-warning-100 text-warning-600 group-hover:bg-warning-200',
      value: 'text-gray-900',
    },
    danger: {
      icon: 'bg-danger-100 text-danger-600 group-hover:bg-danger-200',
      value: 'text-gray-900',
    },
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div className={`card-stat group ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className={`text-3xl font-bold ${colors.value}`}>{value}</p>
            {trend && (
              <div className={`flex items-center text-sm font-medium ${
                trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-gray-600'
              }`}>
                {trend === 'up' && (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
                {trend === 'down' && (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
                {trendValue && <span>{trendValue}</span>}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`w-16 h-16 ${colors.icon} rounded-xl flex items-center justify-center transition-colors ml-4`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

