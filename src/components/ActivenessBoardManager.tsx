import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ActivenessDashboard } from './ActivenessDashboard';
import { ActivenessTable } from './ActivenessTable';
import { StudentModulesModal } from './StudentModulesModal';
import { ModuleScoreForm } from './ModuleScoreForm';
import { useRole } from '../hooks/useRole';
import { Plus, Share2, Download, Upload } from 'lucide-react';
import { calculateBatchActivenessMetrics, getStudentActivenessArray } from '../lib/activeness';
import type { Database } from '../lib/database.types';
import type { StudentActivenessMetrics, BatchActivenessMetrics } from '../lib/activeness';

type ActivenessBoard = Database['public']['Tables']['activeness_boards']['Row'];
type ModuleScore = Database['public']['Tables']['module_scores']['Row'];

interface ActivenessBoardManagerProps {
  selectedBoard: ActivenessBoard | null;
}

export function ActivenessBoardManager({ selectedBoard }: ActivenessBoardManagerProps) {
  const { canCreate, canDelete } = useRole();
  const [scores, setScores] = useState<ModuleScore[]>([]);
  const [studentMetrics, setStudentMetrics] = useState<StudentActivenessMetrics[]>([]);
  const [batchMetrics, setBatchMetrics] = useState<BatchActivenessMetrics>({
    totalStudents: 0,
    averageBatchActiveness: 0,
    totalModulesCompleted: 0,
    mostActiveStudent: '',
    highestScore: 0,
  });
  const [selectedStudent, setSelectedStudent] = useState<StudentActivenessMetrics | null>(null);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [editingScore, setEditingScore] = useState<ModuleScore | null>(null);

  useEffect(() => {
    if (selectedBoard) {
      loadScores(selectedBoard.id);
    }
  }, [selectedBoard]);

  useEffect(() => {
    if (scores.length > 0) {
      const metrics = getStudentActivenessArray(scores);
      setStudentMetrics(metrics);
      setBatchMetrics(calculateBatchActivenessMetrics(scores));
    } else {
      setStudentMetrics([]);
      setBatchMetrics({
        totalStudents: 0,
        averageBatchActiveness: 0,
        totalModulesCompleted: 0,
        mostActiveStudent: '',
        highestScore: 0,
      });
    }
  }, [scores]);

  const loadScores = async (boardId: string) => {
    const { data } = await supabase
      .from('module_scores')
      .select('*')
      .eq('board_id', boardId)
      .order('student_name', { ascending: true });

    if (data) {
      setScores(data);
    }
  };

  const handleSaveScore = async (scoreData: Omit<ModuleScore, 'id' | 'board_id' | 'created_at' | 'updated_at'>) => {
    if (!selectedBoard) return;

    if (editingScore) {
      const { data } = await supabase
        .from('module_scores')
        .update(scoreData)
        .eq('id', editingScore.id)
        .select()
        .single();

      if (data) {
        setScores(scores.map(s => s.id === data.id ? data : s));
      }
    } else {
      const { data } = await supabase
        .from('module_scores')
        .insert({
          ...scoreData,
          board_id: selectedBoard.id,
        })
        .select()
        .single();

      if (data) {
        setScores([...scores, data]);
      }
    }

    setShowScoreForm(false);
    setEditingScore(null);
  };

  const handleDeleteScore = async (scoreId: string) => {
    await supabase.from('module_scores').delete().eq('id', scoreId);
    setScores(scores.filter(s => s.id !== scoreId));
  };

  const handleEditScore = (score: ModuleScore) => {
    setEditingScore(score);
    setShowScoreForm(true);
    setSelectedStudent(null);
  };

  const copyPublicLink = () => {
    if (!selectedBoard) return;
    const url = `${window.location.origin}/activeness/${selectedBoard.public_id}`;
    navigator.clipboard.writeText(url);
    alert('Public activeness board link copied!');
  };

  const handleExport = () => {
    if (!selectedBoard) return;

    const dataStr = JSON.stringify({
      board: selectedBoard,
      scores: scores,
    }, null, 2);

    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `${selectedBoard.name.replace(/\s+/g, '_')}_activeness.json`;

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBoard) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);

        if (json.scores && Array.isArray(json.scores)) {
          for (const score of json.scores) {
            await supabase.from('module_scores').insert({
              board_id: selectedBoard.id,
              student_name: score.student_name,
              module_number: score.module_number,
              activeness_score: score.activeness_score || 5,
              notes: score.notes || '',
              recorded_date: score.recorded_date || new Date().toISOString().split('T')[0],
            });
          }

          loadScores(selectedBoard.id);
          alert('Import successful!');
        }
      } catch (error) {
        alert('Failed to import file. Please check the format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if (!selectedBoard) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Select or create an activeness board to get started
        </p>
      </div>
    );
  }

  const selectedStudentScores = selectedStudent
    ? scores.filter(s => s.student_name === selectedStudent.name)
    : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        {canCreate && (
          <button
            onClick={() => {
              setEditingScore(null);
              setShowScoreForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Record Module Score
          </button>
        )}
        <button
          onClick={copyPublicLink}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Copy Public Link
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
        {canCreate && (
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        )}
      </div>

      <ActivenessDashboard metrics={batchMetrics} />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Student Activeness Board
        </h2>
        <ActivenessTable
          students={studentMetrics}
          onStudentClick={setSelectedStudent}
        />
      </div>

      {showScoreForm && (
        <ModuleScoreForm
          boardId={selectedBoard.id}
          existingScore={editingScore || undefined}
          onSave={handleSaveScore}
          onClose={() => {
            setShowScoreForm(false);
            setEditingScore(null);
          }}
        />
      )}

      {selectedStudent && (
        <StudentModulesModal
          student={selectedStudent}
          scores={selectedStudentScores}
          onClose={() => setSelectedStudent(null)}
          onDeleteScore={handleDeleteScore}
          onEditScore={handleEditScore}
        />
      )}
    </div>
  );
}
