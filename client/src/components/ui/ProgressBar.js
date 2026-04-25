import React from 'react';

/**
 * Barre de progression premium avec couleur dynamique
 */
export function ProgressBar({ 
  value, 
  max = 100, 
  size = 'md',
  showLabel = true,
  className = '' 
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const getColor = (pct) => {
    if (pct < 25) return 'bg-danger-500';
    if (pct < 75) return 'bg-warning-500';
    return 'bg-success-500';
  };

  const getTextColor = (pct) => {
    if (pct < 25) return 'text-danger-700';
    if (pct < 75) return 'text-warning-700';
    return 'text-success-700';
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-semibold ${getTextColor(percentage)}`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${getColor(percentage)} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Badge de statut avec couleur selon pourcentage
 */
export function StatusBadge({ value, max = 100, className = '' }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const getVariant = (pct) => {
    if (pct < 25) return 'danger';
    if (pct < 75) return 'warning';
    return 'success';
  };

  const getLabel = (pct) => {
    if (pct < 25) return 'Faible';
    if (pct < 75) return 'Moyen';
    return 'Élevé';
  };

  const variants = {
    danger: 'bg-danger-50 text-danger-700 border-danger-200',
    warning: 'bg-warning-50 text-warning-700 border-warning-200',
    success: 'bg-success-50 text-success-700 border-success-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variants[getVariant(percentage)]} ${className}`}>
      {getLabel(percentage)} ({percentage.toFixed(0)}%)
    </span>
  );
}
