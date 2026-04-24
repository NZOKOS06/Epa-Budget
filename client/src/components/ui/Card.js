import React from 'react';

/**
 * Composant Card réutilisable avec design professionnel
 */
export function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-5 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Composant CardStat pour les statistiques
 */
export function CardStat({ title, value, subtitle, icon, className = '' }) {
  return (
    <div className={`card-stat ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-600">
            {icon}
          </div>
        )}
      </div>
      {subtitle && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      )}
    </div>
  );
}

