import { forwardRef } from 'react';

const Select = forwardRef(function Select({ label, error, children, className='', ...props }, ref) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <select
        ref={ref}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700
          ${error ? 'border-red-400' : 'border-gray-300'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Select;
