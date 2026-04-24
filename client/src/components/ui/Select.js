import React from 'react';

export function Select({ children, value, onChange, className = '', ...props }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full bg-white border border-gray-300 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
