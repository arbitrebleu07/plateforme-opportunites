import { Card } from './Card'

export function StatCard({ label, value, color = 'blue' }) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{label}</h3>
      <div className={`text-3xl font-bold ${colorClasses[color] || colorClasses.blue}`}>
        {value}
      </div>
    </Card>
  )
}
