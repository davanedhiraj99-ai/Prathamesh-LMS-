import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from '../../utils/axios-instance.js';

const BatchAllocator = () => {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [studentBatches, setStudentBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [studentsRes, batchesRes] = await Promise.all([
        axios.get('/admin/students'),
        axios.get('/admin/batches')
      ]);
      setStudents((studentsRes.data || []).filter((s) => s.role === 'student'));
      setBatches(batchesRes.data || []);
    } catch {
      setMessage('ERROR: Failed to load data');
    }
  }, []);

  const loadStudentBatches = useCallback(async (studentId) => {
    const id = Number(studentId);
    if (!Number.isInteger(id) || id <= 0) {
      setStudentBatches([]);
      return;
    }

    try {
      const res = await axios.get(`/admin/student-batches?studentId=${id}`);
      setStudentBatches(res.data || []);
    } catch {
      setStudentBatches([]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStudentChange = (e) => {
    const id = e.target.value;
    setSelectedStudent(id);
    setSelectedBatch('');
    setMessage('');
    if (id) loadStudentBatches(id);
    else setStudentBatches([]);
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedBatch) {
      setMessage('ERROR: Please select both student and batch');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await axios.post('/admin/enroll-student', {
        studentId: Number(selectedStudent),
        batchId: Number(selectedBatch)
      });
      setMessage('SUCCESS: Batch allocated successfully!');
      setSelectedBatch('');
      await loadStudentBatches(selectedStudent);
    } catch (error) {
      setMessage(`ERROR: ${error.response?.data?.error || 'Failed to allocate'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (batchId) => {
    if (!selectedStudent) return;
    if (!window.confirm('Remove student from this batch?')) return;

    try {
      await axios.delete(
        `/admin/student-batches?studentId=${Number(selectedStudent)}&batchId=${Number(batchId)}`
      );
      setMessage('SUCCESS: Removed from batch');
      await loadStudentBatches(selectedStudent);
    } catch {
      setMessage('ERROR: Failed to remove');
    }
  };

  const selectedStudentData = useMemo(
    () => students.find((s) => String(s.id) === selectedStudent),
    [students, selectedStudent]
  );

  const allocatedIds = useMemo(
    () => new Set(studentBatches.map((sb) => sb.batch_id)),
    [studentBatches]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Allocate Batch to Student</h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md ${
            message.startsWith('SUCCESS:') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleAllocate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Student</label>
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            value={selectedStudent}
            onChange={handleStudentChange}
          >
            <option value="">-- Choose Student --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
        </div>

        {selectedStudentData && (
          <div className="bg-blue-50 p-4 rounded-md">
            <p>
              <strong>{selectedStudentData.name}</strong>
            </p>
            <p className="text-sm text-gray-600">{selectedStudentData.email}</p>
            <p className="text-sm mt-2">Current batches: {studentBatches.length}</p>
          </div>
        )}

        {selectedStudent && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Batch to Allocate</label>
            {batches.length === 0 ? (
              <p className="text-red-500 mt-2">No batches available. Create batches first.</p>
            ) : (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                {batches.map((batch) => {
                  const isAllocated = allocatedIds.has(batch.id);
                  return (
                    <div
                      key={batch.id}
                      className={`p-3 rounded border ${
                        isAllocated ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{batch.name}</p>
                          <p className="text-xs text-gray-500">{batch.description || 'No description'}</p>
                        </div>
                        {isAllocated ? (
                          <span className="text-green-600 text-sm">Allocated</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedBatch(String(batch.id))}
                            className={`px-3 py-1 rounded text-sm ${
                              selectedBatch === String(batch.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            {selectedBatch === String(batch.id) ? 'Selected' : 'Select'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedStudent || !selectedBatch}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading || !selectedStudent || !selectedBatch ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Allocating...' : 'Allocate Batch'}
        </button>
      </form>

      {studentBatches.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">Allocated Batches</h3>
          <div className="space-y-2">
            {studentBatches.map((sb) => (
              <div key={sb.batch_id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                <div>
                  <p className="font-medium">{sb.batch_name}</p>
                  <p className="text-xs text-gray-500">{new Date(sb.enrolled_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleRemove(sb.batch_id)} className="text-red-600 hover:text-red-800 text-sm">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchAllocator;
