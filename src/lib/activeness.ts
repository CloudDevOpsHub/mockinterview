import type { Database } from './database.types';

type ModuleScore = Database['public']['Tables']['module_scores']['Row'];

export interface StudentActivenessMetrics {
  name: string;
  totalScore: number;
  averageScore: number;
  modulesCompleted: number;
  completionPercentage: number;
  moduleScores: { [key: number]: number };
}

export interface BatchActivenessMetrics {
  totalStudents: number;
  averageBatchActiveness: number;
  totalModulesCompleted: number;
  mostActiveStudent: string;
  highestScore: number;
}

export function calculateStudentActivenessMetrics(scores: ModuleScore[]): StudentActivenessMetrics | null {
  if (scores.length === 0) return null;

  const moduleScores: { [key: number]: number } = {};
  let totalScore = 0;

  scores.forEach(score => {
    moduleScores[score.module_number] = score.activeness_score;
    totalScore += score.activeness_score;
  });

  const modulesCompleted = scores.length;
  const averageScore = Number((totalScore / modulesCompleted).toFixed(2));
  const completionPercentage = Number(((modulesCompleted / 10) * 100).toFixed(1));

  return {
    name: scores[0].student_name,
    totalScore,
    averageScore,
    modulesCompleted,
    completionPercentage,
    moduleScores,
  };
}

export function calculateBatchActivenessMetrics(allScores: ModuleScore[]): BatchActivenessMetrics {
  if (allScores.length === 0) {
    return {
      totalStudents: 0,
      averageBatchActiveness: 0,
      totalModulesCompleted: 0,
      mostActiveStudent: '',
      highestScore: 0,
    };
  }

  const uniqueStudents = new Set(allScores.map(s => s.student_name));
  const scores = allScores.map(s => s.activeness_score);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);

  const studentTotals = new Map<string, number>();
  allScores.forEach(score => {
    const current = studentTotals.get(score.student_name) || 0;
    studentTotals.set(score.student_name, current + score.activeness_score);
  });

  let mostActiveStudent = '';
  let highestScore = 0;

  studentTotals.forEach((total, name) => {
    if (total > highestScore) {
      highestScore = total;
      mostActiveStudent = name;
    }
  });

  return {
    totalStudents: uniqueStudents.size,
    averageBatchActiveness: Number((totalScore / allScores.length).toFixed(2)),
    totalModulesCompleted: allScores.length,
    mostActiveStudent,
    highestScore,
  };
}

export function groupScoresByStudent(scores: ModuleScore[]): Map<string, ModuleScore[]> {
  const grouped = new Map<string, ModuleScore[]>();

  scores.forEach(score => {
    if (!grouped.has(score.student_name)) {
      grouped.set(score.student_name, []);
    }
    grouped.get(score.student_name)!.push(score);
  });

  return grouped;
}

export function getStudentActivenessArray(scores: ModuleScore[]): StudentActivenessMetrics[] {
  const grouped = groupScoresByStudent(scores);
  const metrics: StudentActivenessMetrics[] = [];

  grouped.forEach((studentScores, _studentName) => {
    const metric = calculateStudentActivenessMetrics(studentScores);
    if (metric) metrics.push(metric);
  });

  return metrics;
}

export const TOTAL_MODULES = 10;

export function getModulesList(): number[] {
  return Array.from({ length: TOTAL_MODULES }, (_, i) => i + 1);
}
