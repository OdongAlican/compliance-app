import { useState } from 'react';
import { FlagIcon } from '@heroicons/react/24/outline';

const PRIORITY_OPTS = [
  { value: 'Urgent', color: 'var(--danger)' },
  { value: 'High',   color: '#f0883e' },
  { value: 'Medium', color: 'var(--warning)' },
  { value: 'Low',    color: 'var(--success)' },
];

const inputStyle = {
  background: 'var(--bg)', color: 'var(--text)',
  border: '1px solid var(--border)', borderRadius: '8px',
  padding: '8px 12px', width: '100%', outline: 'none', fontSize: '14px',
};

export default function SetPriorityModal({ isOpen, onClose, onSubmit }) {
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('2025-09-15');

  const handleSubmit = () => {
    if (typeof onSubmit === 'function') {
      onSubmit({ priority, dueDate });
    } else {
      console.warn('onSubmit is not a function');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
            <FlagIcon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Set Priority Level</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Priority Level
            </label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
              <option value="">Select Priority Level</option>
              {PRIORITY_OPTS.map(({ value }) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            {priority && (
              <div className="mt-2 flex flex-wrap gap-2">
                {PRIORITY_OPTS.map(({ value, color }) => (
                  <button key={value} onClick={() => setPriority(value)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: priority === value ? `color-mix(in srgb, ${color} 20%, transparent)` : 'var(--bg)',
                      color: priority === value ? color : 'var(--text-muted)',
                      border: `1px solid ${priority === value ? color : 'var(--border)'}`,
                    }}>
                    {value}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Due Date
            </label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="px-4 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}>
            Set Priority
          </button>
        </div>
      </div>
    </div>
  );
}
