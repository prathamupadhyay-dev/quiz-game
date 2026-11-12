import React, { useState, useEffect } from 'react';
import { Presentation, Trash2, Eye } from 'lucide-react';
import { api } from '../api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function SlidesPage() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View modal state
  const [viewDeck, setViewDeck] = useState(null);

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const data = await api.getSlides();
      setDecks(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to retrieve slide decks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const openViewModal = async (id) => {
    try {
      const details = await api.getSlideDetails(id);
      setViewDeck(details);
    } catch (err) {
      alert(err.message || 'Failed to load slide deck details');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteSlide(deleteId);
      setDecks((prev) => prev.filter((d) => d._id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete slide deck');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      <div>
        <h1 className="text-large-title text-label">Slide decks</h1>
        <p className="text-subheadline text-label-2 mt-1">
          Inspect presentations created by moderators and teachers across all subjects
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading slide decks" />
      ) : error ? (
        <ErrorState title="Slide deck error" message={error} onRetry={fetchDecks} />
      ) : decks.length === 0 ? (
        <EmptyState
          icon={Presentation}
          title="No slide decks found"
          description="There are currently no presentations uploaded to the platform."
        />
      ) : (
        <div className="content-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-separator/40 text-footnote text-label-2 bg-surface-2/40">
                  <th className="py-3 px-4 font-medium">Deck title</th>
                  <th className="py-3 px-4 font-medium">Owner</th>
                  <th className="py-3 px-4 font-medium text-center">Slides</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/20">
                {decks.map((d) => (
                  <tr key={d._id} className="h-11 hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 px-4 text-subheadline font-semibold text-label">
                      {d.title}
                    </td>
                    <td className="py-2 px-4 text-subheadline text-label-2">{d.ownerName}</td>
                    <td className="py-2 px-4 text-subheadline font-rounded-num text-center text-label">
                      {d.slideCount}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openViewModal(d._id)}
                          className="btn-motion w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 text-label-2 hover:text-label"
                          title="View slides"
                        >
                          <Eye size={15} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(d._id)}
                          className="btn-motion w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 text-label-2 hover:text-red hover:bg-red/10"
                          title="Delete deck"
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

      {/* View Slides Modal */}
      <Modal
        isOpen={Boolean(viewDeck)}
        onClose={() => setViewDeck(null)}
        title={viewDeck?.title || 'Slide deck'}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setViewDeck(null)}>
              Close
            </Button>
          </div>
        }
      >
        {viewDeck && (
          <div className="space-y-4">
            <div className="text-footnote text-label-2 pb-3 border-b border-separator/40">
              Presented by <strong className="text-label">{viewDeck.ownerId?.name || 'Unknown'}</strong> ({viewDeck.slides?.length || 0} slides)
            </div>

            <div className="space-y-4">
              {viewDeck.slides?.map((slide, idx) => (
                <div key={idx} className="p-5 rounded-field bg-surface-2/60 border border-separator/40 space-y-2">
                  <div className="flex items-center justify-between text-subheadline font-medium text-accent">
                    <span>Slide {idx + 1}</span>
                  </div>
                  <h3 className="text-headline text-label font-semibold">{slide.title}</h3>
                  <p className="text-subheadline text-label-2 whitespace-pre-line leading-relaxed">
                    {slide.body || 'No text content provided.'}
                  </p>
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
        title="Delete slide deck"
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
          Are you sure you want to remove this slide deck from the platform? This action cannot be reversed.
        </p>
      </Modal>
    </div>
  );
}
