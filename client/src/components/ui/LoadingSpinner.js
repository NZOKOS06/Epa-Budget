import React from 'react';

/**
 * Composant LoadingSpinner réutilisable
 */
export function LoadingSpinner({ message = 'Chargement...', size = 'md' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center space-y-4">
        <div
          className={`${sizes[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
        ></div>
        {message && (
          <p className="text-gray-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Composant EmptyState pour afficher un état vide
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      <p className="text-gray-600 font-medium text-lg">{title}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

