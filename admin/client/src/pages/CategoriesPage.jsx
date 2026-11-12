import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, FolderPlus } from 'lucide-react';
import { api } from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create / Rename modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete modal states
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to retrieve categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setModalError('');
    setModalOpen(true);
  };

  const openRenameModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setModalError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError('Category name cannot be empty');
      return;
    }

    setSaving(true);
    setModalError('');
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory._id, name.trim());
      } else {
        await api.createCategory(name.trim());
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setModalError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteCategory(deleteId);
      setCategories((prev) => prev.filter((c) => c._id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-large-title text-label">Categories</h1>
          <p className="text-subheadline text-label-2 mt-1">
            Organize quizzes into structured learning topics and curriculum areas
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} className="gap-2 shrink-0">
          <Plus size={18} strokeWidth={1.75} />
          <span>Create category</span>
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading categories" />
      ) : error ? (
        <ErrorState title="Category loading error" message={error} onRetry={fetchCategories} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories found"
          description="Create categories so teachers can tag and organize classroom quizzes."
          actionLabel="Create category"
          onAction={openCreateModal}
        />
      ) : (
        <div className="content-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-separator/40 text-footnote text-label-2 bg-surface-2/40">
                  <th className="py-3 px-4 font-medium">Category name</th>
                  <th className="py-3 px-4 font-medium text-center">Associated quizzes</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/20">
                {categories.map((c) => (
                  <tr key={c._id} className="h-11 hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 px-4 text-subheadline font-semibold text-label">
                      {c.name}
                    </td>
                    <td className="py-2 px-4 text-subheadline font-rounded-num text-center text-label-2">
                      {c.quizCount || 0}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openRenameModal(c)}
                          className="btn-motion w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 text-label-2 hover:text-label"
                          title="Rename category"
                        >
                          <Edit2 size={15} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(c._id)}
                          className="btn-motion w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 text-label-2 hover:text-red hover:bg-red/10"
                          title="Delete category"
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

      {/* Create / Rename Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Rename category' : 'Create category'}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving' : editingCategory ? 'Save rename' : 'Create category'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {modalError && (
            <div className="p-3.5 rounded-field bg-red/10 border border-red/30 text-subheadline text-red">
              {modalError}
            </div>
          )}

          <Input
            label="Category title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Computer Science"
            autoFocus
            required
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete category"
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
          Are you sure you want to delete this category? Quizzes linked to it will remain but become uncategorized.
        </p>
      </Modal>
    </div>
  );
}
