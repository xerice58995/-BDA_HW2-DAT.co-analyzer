interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  color: 'green' | 'blue' | 'orange' | 'purple';
  icon: string;
}

export default function StatTile({
  label,
  value,
  unit = '',
  color,
  icon,
}: StatTileProps) {
  const colorClasses = {
    green: 'bg-green-900/30 border-green-600 text-green-300',
    blue: 'bg-blue-900/30 border-blue-600 text-blue-300',
    orange: 'bg-orange-900/30 border-orange-600 text-orange-300',
    purple: 'bg-purple-900/30 border-purple-600 text-purple-300',
  };

  return (
    <div
      className={`${colorClasses[color]} border rounded-lg p-4 flex flex-col gap-2 min-w-[200px]`}
    >
      <div className="flex items-center gap-2 text-sm font-medium opacity-75">
        <span className="text-lg">{icon}</span>
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm opacity-75">{unit}</span>
      </div>
    </div>
  );
}
