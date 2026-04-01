import React, { useState, useEffect } from 'react';

interface Module {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentModule?: string | null;
}

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; color?: string; parentModule?: string | null }) => void;
  module?: Module | null;
  parentModuleId?: string | null;
  allModules?: Module[];
}

const COLORS = [
  { name: 'Blue', value: '#4361ee' },
  { name: 'Purple', value: '#7209b7' },
  { name: 'Pink', value: '#f72585' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Gray', value: '#6b7280' }
];

export const ModuleModal: React.FC<ModuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  module,
  parentModuleId,
  allModules = []
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#4361ee');
  const [parentModule, setParentModule] = useState<string | null>(null);

  useEffect(() => {
    if (module) {
      setName(module.name);
      setDescription(module.description || '');
      setColor(module.color || '#4361ee');
      setParentModule(module.parentModule || null);
    } else {
      setName('');
      setDescription('');
      setColor('#4361ee');
      setParentModule(parentModuleId || null);
    }
  }, [module, parentModuleId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      color,
      parentModule: parentModule === '' ? null : parentModule
    });

    setName('');
    setDescription('');
    setColor('#4361ee');
    setParentModule(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{module ? 'Edit Module' : 'Create New Module'}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Module Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="e.g., Communication System"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                placeholder="Brief description of this module..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Parent Module</label>
              <select
                value={parentModule || ''}
                onChange={(e) => setParentModule(e.target.value || null)}
                className="form-select"
                disabled={!!parentModuleId && !module}
              >
                <option value="">None (Root Level)</option>
                {allModules
                  .filter((m) => !module || m._id !== module._id)
                  .map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
              </select>
              {parentModuleId && !module && (
                <p style={{ fontSize: '0.75rem', color: '#8888aa', marginTop: '4px' }}>
                  This module will be created as a sub-module
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: color === c.value ? '3px solid #14142a' : '2px solid rgba(20, 20, 40, 0.1)',
                      backgroundColor: c.value,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    title={c.name}
                  >
                    {color === c.value && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="dash-btn">
              Cancel
            </button>
            <button type="submit" className="dash-btn dash-btn-primary" disabled={!name.trim()}>
              {module ? 'Update Module' : 'Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
