import React from 'react';

/**
 * Composant Table professionnel réutilisable
 */
export function Table({ children, className = '', striped = true }) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <table className={`w-full text-sm ${striped ? 'table-striped' : ''}`}>{children}</table>
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
export function TableRow({ children, className = '', onClick, hover = true }) {
  return (
    <tr
      className={`border-b border-gray-100 transition-colors duration-150 ${
        hover && onClick ? 'hover:bg-primary-50 cursor-pointer' : hover ? 'hover:bg-gray-50' : ''
      } ${className}`}
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
    <th className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

/**
 * Composant TableCell
 */
export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-700 ${className}`}>
      {children}
    </td>
  );
}

