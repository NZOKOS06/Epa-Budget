import React from 'react';

/**
 * Composant Table professionnel réutilisable
 */
export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table-professionnelle">{children}</table>
    </div>
  );
}

/**
 * Composant TableHeader
 */
export function TableHeader({ children, className = '' }) {
  return (
    <thead className={className}>
      <tr>{children}</tr>
    </thead>
  );
}

/**
 * Composant TableBody
 */
export function TableBody({ children, className = '' }) {
  return <tbody className={className}>{children}</tbody>;
}

/**
 * Composant TableRow
 */
export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

/**
 * Composant TableHead
 */
export function TableHead({ children, className = '' }) {
  return (
    <th className={`px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

/**
 * Composant TableCell
 */
export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  );
}

