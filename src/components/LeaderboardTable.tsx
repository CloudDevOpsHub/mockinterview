import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Medal, Trophy } from 'lucide-react';
import type { StudentMetrics } from '../lib/scoring';

interface LeaderboardTableProps {
  students: StudentMetrics[];
  onStudentClick?: (student: StudentMetrics) => void;
  isPublic?: boolean;
}

type SortField = 'name' | 'highestScore' | 'totalScore' | 'averageScore' | 'interviewsGiven' | 'lastInterviewDate';

export function LeaderboardTable({ students, onStudentClick, isPublic = false }: LeaderboardTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('averageScore');
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    return students.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'highestScore':
          comparison = a.highestScore - b.highestScore;
          break;
        case 'totalScore':
          comparison = a.totalScore - b.totalScore;
          break;
        case 'averageScore':
          comparison = a.averageScore - b.averageScore;
          break;
        case 'interviewsGiven':
          comparison = a.interviewsGiven - b.interviewsGiven;
          break;
        case 'lastInterviewDate':
          comparison = new Date(a.lastInterviewDate).getTime() - new Date(b.lastInterviewDate).getTime();
          break;
      }

      return sortDesc ? -comparison : comparison;
    });

    return copy;
  }, [filtered, sortBy, sortDesc]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(true);
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {label}
      {sortBy === field && (
        sortDesc ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
      )}
    </button>
  );

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-slate-500 font-medium">#{index + 1}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600 dark:text-green-400 font-bold';
    if (score >= 7) return 'text-blue-600 dark:text-blue-400 font-semibold';
    if (score >= 5) return 'text-yellow-600 dark:text-yellow-400 font-semibold';
    return 'text-red-600 dark:text-red-400 font-semibold';
  };

  if (students.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          {isPublic ? 'No interview data available yet.' : 'No students in this leaderboard yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-4 text-left text-sm">
                <span className="text-slate-600 dark:text-slate-400">Rank</span>
              </th>
              <th className="px-6 py-4 text-left text-sm">
                <SortHeader field="name" label="Student Name" />
              </th>
              <th className="px-6 py-4 text-center text-sm">
                <SortHeader field="highestScore" label="Highest Score" />
              </th>
              <th className="px-6 py-4 text-center text-sm">
                <SortHeader field="totalScore" label="Total Score" />
              </th>
              <th className="px-6 py-4 text-center text-sm">
                <SortHeader field="averageScore" label="Avg. Score" />
              </th>
              <th className="px-6 py-4 text-center text-sm">
                <SortHeader field="interviewsGiven" label="Interviews" />
              </th>
              <th className="px-6 py-4 text-center text-sm">
                <SortHeader field="lastInterviewDate" label="Last Interview" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((student, index) => (
              <tr
                key={student.name}
                onClick={() => onStudentClick?.(student)}
                className={`border-b border-slate-200 dark:border-slate-700 transition-colors ${
                  onStudentClick ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer' : ''
                }`}
              >
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center justify-center">
                    {getRankIcon(index)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="font-medium text-slate-900 dark:text-white">
                    {student.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className={getScoreColor(student.highestScore)}>
                    {student.highestScore}/10
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {student.totalScore}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className={getScoreColor(student.averageScore)}>
                    {student.averageScore}/10
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-slate-700 dark:text-slate-300">
                    {student.interviewsGiven}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
                  {new Date(student.lastInterviewDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-slate-600 dark:text-slate-400">
            No students found matching "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
