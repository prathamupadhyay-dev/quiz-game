import React, { useState, useEffect } from 'react';
import { Settings, Save, Check } from 'lucide-react';
import { api } from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import Switch from '../components/Switch';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    maxQuestionDuration: 120,
    maxQuestionsCount: 50,
    maxPlayersPerGame: 100,
    joinEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setError(null);

    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSuccessMessage('Platform guardrails have been successfully updated.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update platform guardrails');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading system settings" />;
  }

  if (error && !settings) {
    return <ErrorState title="Settings error" message={error} onRetry={fetchSettings} />;
  }

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-250">
      <div>
        <h1 className="text-large-title text-label">Settings</h1>
        <p className="text-subheadline text-label-2 mt-1">
          Global platform guardrails & limits enforced across quiz creators and student admissions
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-field bg-green/10 border border-green/30 text-subheadline text-green flex items-center gap-2">
          <Check size={18} strokeWidth={1.75} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-field bg-red/10 border border-red/30 text-subheadline text-red">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="content-card p-6 space-y-6">
        <div className="space-y-4">
          <Input
            label="Maximum question duration (seconds)"
            type="number"
            min="10"
            max="300"
            value={settings.maxQuestionDuration || 120}
            onChange={(e) =>
              setSettings({ ...settings, maxQuestionDuration: Number(e.target.value) })
            }
            helperText="Upper limit for individual question timers set by creators (prevents unreasonable durations)"
            required
          />

          <Input
            label="Maximum questions per quiz"
            type="number"
            min="1"
            max="100"
            value={settings.maxQuestionsCount || 50}
            onChange={(e) =>
              setSettings({ ...settings, maxQuestionsCount: Number(e.target.value) })
            }
            helperText="Maximum question count allowed in any single quiz deck"
            required
          />

          <Input
            label="Maximum players per game"
            type="number"
            min="1"
            max="500"
            value={settings.maxPlayersPerGame || 100}
            onChange={(e) =>
              setSettings({ ...settings, maxPlayersPerGame: Number(e.target.value) })
            }
            helperText="Hard cap on guest player connections per individual session PIN"
            required
          />
        </div>

        <div className="pt-4 border-t border-separator/40">
          <Switch
            label="Allow student joins (joinEnabled)"
            description="When disabled, all new student join requests via PIN are immediately rejected"
            checked={settings.joinEnabled}
            onChange={(val) => setSettings({ ...settings, joinEnabled: val })}
          />
        </div>

        <div className="pt-4 border-t border-separator/40 flex justify-end">
          <Button type="submit" variant="primary" disabled={saving} className="gap-2">
            <Save size={16} strokeWidth={1.75} />
            <span>{saving ? 'Saving changes' : 'Save settings'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
