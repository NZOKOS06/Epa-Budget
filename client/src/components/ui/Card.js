import React from 'react';

/**
 * Composant Card réutilisable avec design professionnel
 */
export function Card({ children, className = '', hover = true }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-md ${
        hover ? 'hover:shadow-xl' : ''
      } transition-shadow duration-300 p-6 border border-gray-100 ${className}`}
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
    <div className={`card-stat group ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
            {icon}
          </div>
        )}
      </div>
      {subtitle && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      )}
    </div>
  );
}

