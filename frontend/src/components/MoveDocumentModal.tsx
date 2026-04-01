import React, { useState } from 'react';

interface Module {
  _id: string;
  name: string;
  color?: string;
  parentModule?: string | null;
  children?: Module[];
}

interface MoveDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (moduleId: string | null) => void;
  modules: Module[];
  currentModuleId?: string | null;
  documentTitle: string;
}

export const MoveDocumentModal: React.FC<MoveDocumentModalProps> = ({
  isOpen,
  onClose,
  onMove,
  modules,
  currentModuleId,
  documentTitle
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(currentModuleId || null);

  const handleMove = () => {
    onMove(selectedModuleId);
    onClose();
  };

  const renderModuleOption = (module: Module, level: number = 0): React.ReactNode => {
    const indent = '—'.repeat(level);
    return (
      <React.Fragment key={module._id}>
        <option value={module._id}>
          {indent} {module.name}
        </option>
        {module.children && module.children.map((child) => renderModuleOption(child, level + 1))}
      </React.Fragment>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Move Document</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: '16px', color: '#4a4a6a', fontSize: '0.9375rem' }}>
            Move <strong>{documentTitle}</strong> to:
          </p>

          <div className="form-group">
            <label className="form-label">Select Module</label>
            <select
              value={selectedModuleId || ''}
              onChange={(e) => setSelectedModuleId(e.target.value || null)}
              className="form-select"
              autoFocus
            >
              <option value="">Your Documents (Root)</option>
              {modules.map((module) => renderModuleOption(module, 0))}
            </select>
          </div>

          {selectedModuleId === currentModuleId && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: 'rgba(251, 191, 36, 0.1)', 
              borderRadius: '8px', 
              marginTop: '12px',
              fontSize: '0.875rem',
              color: '#92400e'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: '6px' }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Document is already in this location
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="dash-btn">
            Cancel
          </button>
          <button 
            onClick={handleMove} 
            className="dash-btn dash-btn-primary"
            disabled={selectedModuleId === currentModuleId}
          >
            Move Document
          </button>
        </div>
      </div>
    </div>
  );
};
