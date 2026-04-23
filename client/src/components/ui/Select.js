import React from 'react';

export function Select({ children, value, onChange, className = '', ...props }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
