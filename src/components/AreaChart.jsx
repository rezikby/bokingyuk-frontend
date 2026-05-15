import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const data = [
  { month: 'JAN', sales: 4000, orders: 2400 },
  { month: 'FEB', sales: 3000, orders: 1398 },
  { month: 'MAR', sales: 5000, orders: 3800 },
  { month: 'APR', sales: 2780, orders: 3908 },
  { month: 'MAY', sales: 6890, orders: 4800 },
  { month: 'JUN', sales: 3390, orders: 3800 },
  { month: 'JUL', sales: 4490, orders: 4300 },
  { month: 'AGS', sales: 5200, orders: 2900 },
  { month: 'SEP', sales: 3800, orders: 4100 },
  { month: 'OKT', sales: 4300, orders: 3200 },
  { month: 'NOV', sales: 5800, orders: 4700 },
  { month: 'DES', sales: 7000, orders: 5200 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#111827] shadow-lg rounded-xl p-3 border text-sm">
      <p className="text-gray-500 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value.toLocaleString('id-ID')}
        </p>
      ))}
    </div>
  );
}

export default function AreaShawChart({ title = 'Ashaw Chart' }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top:10, right:10, left:0, bottom:0 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize:11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8}
            formatter={value => <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>}
          />
          <Area type="monotone" dataKey="sales" name="Sales" stroke="#0284c7" strokeWidth={2} fill="url(#colorSales)" />
          <Area type="monotone" dataKey="orders" name="Orders" stroke="#22c55e" strokeWidth={2} fill="url(#colorOrders)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}