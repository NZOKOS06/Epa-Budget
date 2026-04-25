import React from 'react';

/**
 * Header de page premium avec titre, sous-titre et KPIs globaux
 */
export function PageHeader({ 
  title, 
  subtitle, 
  kpis = [],
  children,
  className = '' 
}) {
  return (
    <div className={`space-y-5 ${className}`}>
      {/* Titre et sous-titre */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center space-x-2">
            {children}
          </div>
        )}
      </div>

      {/* KPIs globaux */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-lg font-semibold text-gray-900 mt-0.5">{kpi.value}</p>
                {kpi.sub && (
                  <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
                )}
              </div>
              {kpi.icon && (
                <div className="w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center text-gray-500">
                  {kpi.icon}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Section de filtres responsive
 */
export function FilterBar({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-3 ${className}`}>
      {children}
    </div>
  );
}
