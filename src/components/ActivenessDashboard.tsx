import { Users, BarChart3, Award, CheckCircle, Target } from 'lucide-react';
import type { BatchActivenessMetrics } from '../lib/activeness';

interface ActivenessDashboardProps {
  metrics: BatchActivenessMetrics;
  loading?: boolean;
}

export function ActivenessDashboard({ metrics, loading = false }: ActivenessDashboardProps) {
  const cards = [
    {
      icon: Users,
      label: 'Total Students',
      value: metrics.totalStudents,
      color: 'blue',
    },
    {
      icon: CheckCircle,
      label: 'Modules Completed',
      value: metrics.totalModulesCompleted,
      color: 'green',
    },
    {
      icon: BarChart3,
      label: 'Avg. Activeness',
      value: `${metrics.averageBatchActiveness}/10`,
      color: 'purple',
    },
    {
      icon: Award,
      label: 'Most Active',
      value: metrics.mostActiveStudent || 'N/A',
      color: 'yellow',
      small: true,
    },
    {
      icon: Target,
      label: 'Highest Score',
      value: metrics.highestScore,
      color: 'red',
    },
  ];

  const colorStyles = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const bgStyle = colorStyles[card.color as keyof typeof colorStyles];
        const iconStyle = iconColors[card.color as keyof typeof iconColors];

        return (
          <div
            key={idx}
            className={`rounded-lg border p-6 transition-all ${
              loading ? 'opacity-50' : ''
            } ${bgStyle}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${bgStyle}`}>
                <Icon className={`w-6 h-6 ${iconStyle}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {card.label}
            </p>
            <p className={`${card.small ? 'text-xl' : 'text-3xl'} font-bold text-slate-900 dark:text-white truncate`}>
              {loading ? '-' : card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
