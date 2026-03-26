import CalorieBalanceChart from '@/components/calorie-balance-chart'
import Link from 'next/link'

export default function CalorieBalancePage() {
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Calorie Balance</h1>
      <CalorieBalanceChart />
      <div className="mt-4 text-gray-700">
        <p className="mb-2">This chart shows your daily calorie surplus or deficit for the past week. A deficit (green) means you burned more than you ate; a surplus (red) means you ate more than you burned.</p>
        <p className="mb-2">For weight loss, aim for a consistent deficit. For maintenance, keep your balance near zero. Surplus leads to weight gain.</p>
        <p className="mb-2">Tip: Log all meals and workouts for best accuracy.</p>
        <Link href="/food-diary" className="text-blue-600 underline">Go to Food Diary →</Link>
      </div>
    </div>
  )
}
