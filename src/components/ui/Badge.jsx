import { statusBadgeClass, statusLabel } from '../../utils/format';

export default function Badge({ status, label, className='' }) {
  const cls = statusBadgeClass(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls} ${className}`}>
      {label || statusLabel(status)}
    </span>
  );
}
