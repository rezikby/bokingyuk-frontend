import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, hint, className = '', ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400
          dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:focus:border-indigo-500
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          ${error ? 'border-red-400 focus:ring-red-400/50 focus:border-red-400' : 'border-slate-200 dark:border-slate-700'}
          ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Input;
