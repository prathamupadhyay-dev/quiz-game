import React, { useState, useEffect } from 'react';
import { HelpCircle, Trash2, Eye, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View modal state
  const [viewQuiz, setViewQuiz] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await api.getQuizzes();
      setQuizzes(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to retrieve quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const openViewModal = async (id) => {
    setViewLoading(true);
    try {
      const details = await api.getQuizDetails(id);
      setViewQuiz(details);
    } catch (err) {
      alert(err.message || 'Failed to load quiz details');
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteQuiz(deleteId);
      setQuizzes((prev) => prev.filter((q) => q._id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete quiz');
    } finally {
      setDeleting(false);
    }
  };

  // Shapes & color indicators for options
  const OPTION_STYLES = [
    { bg: 'bg-red/15 border-red/40 text-red', label: 'Triangle' },
    { bg: 'bg-blue/15 border-blue/40 text-blue', label: 'Diamond' },
    { bg: 'bg-yellow/15 border-yellow/40 text-yellow', label: 'Circle' },
    { bg: 'bg-green/15 border-green/40 text-green', label: 'Square' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      <div>
        <h1 className="text-large-title text-label">Quizzes</h1>
        <p className="text-subheadline text-label-2 mt-1">
          Review all platform quizzes, inspect question banks, and remove content
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading quizzes" />
      ) : error ? (
        <ErrorState title="Quiz loading error" message={error} onRetry={fetchQuizzes} />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No quizzes found"
          description="Teachers have not published any quizzes yet."
        />
      ) : (
        <div className="content-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-separator/40 text-footnote text-label-2 bg-surface-2/40">
                  <th className="py-3 px-4 font-medium">Title</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Owner</th>
                  <th className="py-3 px-4 font-medium text-center">Questions</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/20">
                {quizzes.map((q) => (
                  <tr key={q._id} className="h-11 hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 px-4 text-subheadline font-semibold text-label">
                      {q.title}
                    </td>
                    <td className="py-2 px-4 text-subheadline">
                      <Badge variant="neutral">{q.categoryName}</Badge>
                    </td>
                    <td className="py-2 px-4 text-subheadline text-label-2">{q.ownerName}</td>
                    <td className="py-2 px-4 text-subheadline font-rounded-num text-center text-label">
                      {q.questionCount}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openViewModal(q._id)}
                          className="btn-motion w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 text-label-2 hover:text-label"
                          title="View questions"
                        >
                          <Eye size={15} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(q._id)}
                          className="btn-motion w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 text-label-2 hover:text-red hover:bg-red/10"
                          title="Delete quiz"
                        >
                          <Trash2 size={15} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Questions Modal */}
      <Modal
        isOpen={Boolean(viewQuiz)}
        onClose={() => setViewQuiz(null)}
        title={viewQuiz?.title || 'Quiz details'}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setViewQuiz(null)}>
              Close
            </Button>
          </div>
        }
      >
        {viewQuiz && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-footnote text-label-2 pb-4 border-b border-separator/40">
              <span>Category: <strong className="text-label">{viewQuiz.categoryId?.name || 'Uncategorized'}</strong></span>
              <span>Owner: <strong className="text-label">{viewQuiz.ownerId?.name || 'Unknown'}</strong></span>
              <span>Total questions: <strong className="text-label font-rounded-num">{viewQuiz.questions?.length || 0}</strong></span>
            </div>

            <div className="space-y-4">
              {viewQuiz.questions?.map((item, idx) => (
                <div key={idx} className="p-4 rounded-field bg-surface-2/60 border border-separator/40 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-headline text-label font-medium">
                      <span className="text-label-3 font-rounded-num mr-2">{idx + 1}.</span>
                      {item.text}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-footnote text-label-3 shrink-0">
                      <Clock size={13} strokeWidth={1.75} />
                      <span className="font-rounded-num">{item.timeLimit}s</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {item.options?.map((opt, optIdx) => {
                      const isCorrect = optIdx === item.correctIndex;
                      const style = OPTION_STYLES[optIdx] || OPTION_STYLES[0];
                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-field border text-subheadline flex items-center justify-between gap-2 ${
                            isCorrect ? `${style.bg} font-medium` : 'bg-surface border-separator/30 text-label-2'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-current opacity-75" />
                            <span>{opt}</span>
                          </div>
                          {isCorrect && (
                            <CheckCircle2 size={16} strokeWidth={1.75} className="text-current shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete quiz"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting' : 'Confirm delete'}
            </Button>
          </div>
        }
      >
        <p className="text-subheadline text-label-2">
          Are you sure you want to delete this quiz? This action is permanent and cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
