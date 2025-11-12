import { useState, useEffect } from 'react';
import { Plus, Users, Trash2, UserPlus, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Batch {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface BatchStudent {
  id: string;
  batch_id: string;
  student_name: string;
  student_email: string;
}

export function BatchManagement() {
  const { admin } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchDesc, setBatchDesc] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      loadStudents();
    }
  }, [selectedBatch]);

  const loadBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);

      if (data && data.length > 0 && !selectedBatch) {
        setSelectedBatch(data[0].id);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      setMessage({ type: 'error', text: 'Failed to load batches' });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!selectedBatch) return;

    try {
      const { data, error } = await supabase
        .from('batch_students')
        .select('*')
        .eq('batch_id', selectedBatch)
        .order('student_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const createBatch = async () => {
    if (!batchName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a batch name' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('batches')
        .insert({
          name: batchName.trim(),
          description: batchDesc.trim(),
          is_active: true,
          created_by: admin?.id
        })
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: 'success', text: 'Batch created successfully!' });
      setShowBatchForm(false);
      setBatchName('');
      setBatchDesc('');
      await loadBatches();
      setSelectedBatch(data.id);
    } catch (error) {
      console.error('Error creating batch:', error);
      setMessage({ type: 'error', text: 'Failed to create batch' });
    }
  };

  const addStudent = async () => {
    if (!studentName.trim()) {
      setMessage({ type: 'error', text: 'Please enter student name' });
      return;
    }

    if (!selectedBatch) {
      setMessage({ type: 'error', text: 'Please select a batch first' });
      return;
    }

    try {
      const { error } = await supabase
        .from('batch_students')
        .insert({
          batch_id: selectedBatch,
          student_name: studentName.trim(),
          student_email: studentEmail.trim()
        });

      if (error) {
        if (error.code === '23505') {
          setMessage({ type: 'error', text: 'Student already exists in this batch' });
        } else {
          throw error;
        }
        return;
      }

      setMessage({ type: 'success', text: 'Student added successfully!' });
      setShowStudentForm(false);
      setStudentName('');
      setStudentEmail('');
      await loadStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      setMessage({ type: 'error', text: 'Failed to add student' });
    }
  };

  const deleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the batch?')) return;

    try {
      const { error } = await supabase
        .from('batch_students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Student removed successfully!' });
      await loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      setMessage({ type: 'error', text: 'Failed to remove student' });
    }
  };

  const toggleBatchStatus = async (batchId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('batches')
        .update({ is_active: !currentStatus })
        .eq('id', batchId);

      if (error) throw error;

      setMessage({ type: 'success', text: `Batch ${!currentStatus ? 'activated' : 'deactivated'} successfully!` });
      await loadBatches();
    } catch (error) {
      console.error('Error updating batch:', error);
      setMessage({ type: 'error', text: 'Failed to update batch status' });
    }
  };

  const deleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch? All students in this batch will also be removed.')) return;

    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Batch deleted successfully!' });
      setSelectedBatch(null);
      await loadBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      setMessage({ type: 'error', text: 'Failed to delete batch' });
    }
  };

  const currentBatch = batches.find(b => b.id === selectedBatch);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Batch Management</h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage student batches for attendance tracking</p>
        </div>
        <button
          onClick={() => setShowBatchForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Batch
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {showBatchForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Batch</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Name
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g., Batch A, Morning Batch, AWS DevOps"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={batchDesc}
                onChange={(e) => setBatchDesc(e.target.value)}
                placeholder="Add description..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createBatch}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Create
              </button>
              <button
                onClick={() => {
                  setShowBatchForm(false);
                  setBatchName('');
                  setBatchDesc('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Batches</h3>
          {batches.length === 0 ? (
            <p className="text-sm text-gray-500">No batches yet</p>
          ) : (
            batches.map((batch) => (
              <div
                key={batch.id}
                className={`border-2 rounded-lg p-3 transition-colors ${
                  selectedBatch === batch.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setSelectedBatch(batch.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium text-sm text-gray-900">{batch.name}</div>
                    {batch.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{batch.description}</div>
                    )}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleBatchStatus(batch.id, batch.is_active)}
                      className={`px-2 py-1 text-xs rounded ${
                        batch.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      title={batch.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {batch.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => deleteBatch(batch.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          {currentBatch ? (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{currentBatch.name}</h3>
                    {currentBatch.description && (
                      <p className="text-sm text-gray-600 mt-1">{currentBatch.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowStudentForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Student
                  </button>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Students</p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">{students.length}</p>
                    </div>
                    <Users className="w-12 h-12 text-blue-600 opacity-50" />
                  </div>
                </div>
              </div>

              {showStudentForm && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Student to {currentBatch.name}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student Name
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g., John Doe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addStudent}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowStudentForm(false);
                          setStudentName('');
                          setStudentEmail('');
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Students ({students.length})</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No students added yet</p>
                          </td>
                        </tr>
                      ) : (
                        students.map((student, index) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-blue-700">
                                    {student.student_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{student.student_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {student.student_email || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => deleteStudent(student.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Select a batch to manage students</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
