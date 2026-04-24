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
      icon: 'bg-primary-50 text-primary-600',
      value: 'text-gray-900',
    },
    success: {
      icon: 'bg-success-50 text-success-600',
      value: 'text-gray-900',
    },
    warning: {
      icon: 'bg-warning-50 text-warning-600',
      value: 'text-gray-900',
    },
    danger: {
      icon: 'bg-danger-50 text-danger-600',
      value: 'text-gray-900',
    },
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div className={`card-stat ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-semibold ${colors.value}`}>{value}</p>
            {trend && (
              <div className={`flex items-center text-xs font-medium ${
                trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-gray-500'
              }`}>
                {trend === 'up' && (
                  <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
                {trend === 'down' && (
                  <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
                {trendValue && <span>{trendValue}</span>}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 ${colors.icon} rounded-md flex items-center justify-center ml-3 shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

