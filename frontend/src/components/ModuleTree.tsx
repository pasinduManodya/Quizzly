import React, { useState } from 'react';

interface Document {
  _id: string;
  title: string;
  filename: string;
  uploadedAt: string;
}

interface Module {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentModule?: string | null;
  children?: Module[];
  documents?: Document[];
  documentCount?: number;
}

interface ModuleTreeProps {
  modules: Module[];
  currentModuleId: string | null;
  onModuleClick: (moduleId: string | null) => void;
  onCreateModule: (parentId: string | null) => void;
  onEditModule: (module: Module) => void;
  onDeleteModule: (moduleId: string) => void;
  onModuleDragOver?: (e: React.DragEvent, moduleId: string | null) => void;
  onModuleDragLeave?: (e: React.DragEvent) => void;
  onModuleDrop?: (e: React.DragEvent, moduleId: string | null) => void;
  dragOverModuleId?: string | null;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onViewAllDocuments?: () => void;
  viewMode?: 'current' | 'all';
}

export const ModuleTree: React.FC<ModuleTreeProps> = ({
  modules,
  currentModuleId,
  onModuleClick,
  onCreateModule,
  onEditModule,
  onDeleteModule,
  onModuleDragOver,
  onModuleDragLeave,
  onModuleDrop,
  dragOverModuleId,
  searchQuery = '',
  onSearchChange,
  onViewAllDocuments,
  viewMode = 'current'
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleExpand = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const renderModule = (module: Module, level: number = 0) => {
    const hasChildren = module.children && module.children.length > 0;
    const hasDocuments = module.documents && module.documents.length > 0;
    const hasContent = hasChildren || hasDocuments;
    const isExpanded = expandedModules.has(module._id);
    const isActive = currentModuleId === module._id;
    const isDragOver = dragOverModuleId === module._id;

    return (
      <div key={module._id} style={{ marginLeft: `${level * 16}px` }}>
        <div
          className={`module-item ${isActive ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => onModuleDragOver?.(e, module._id)}
          onDragLeave={(e) => onModuleDragLeave?.(e)}
          onDrop={(e) => onModuleDrop?.(e, module._id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '4px',
            backgroundColor: isDragOver ? 'rgba(67, 97, 238, 0.15)' : (isActive ? 'rgba(67, 97, 238, 0.1)' : 'transparent'),
            border: isDragOver ? '2px dashed rgba(67, 97, 238, 0.5)' : (isActive ? '1px solid rgba(67, 97, 238, 0.3)' : '1px solid transparent'),
            transition: 'all 0.2s ease'
          }}
        >
          {hasContent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(module._id);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '0 4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
          
          <div
            onClick={() => onModuleClick(module._id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: hasChildren ? '0' : '16px'
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={module.color || '#4361ee'}
              strokeWidth="2"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400 }}>
              {module.name}
            </span>
            {module.documentCount !== undefined && module.documentCount > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#8888aa',
                  backgroundColor: 'rgba(136, 136, 170, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}
              >
                {module.documentCount}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateModule(module._id);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: '#4361ee',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Create sub-module"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditModule(module);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: '#8888aa',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Edit module"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteModule(module._id);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Delete module"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {isExpanded && (
          <div>
            {/* Render documents first */}
            {hasDocuments && module.documents!.map((doc) => (
              <div
                key={doc._id}
                style={{
                  marginLeft: `${(level + 1) * 16 + 16}px`,
                  padding: '6px 12px',
                  marginBottom: '2px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(136, 136, 170, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8888aa" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span style={{ 
                  fontSize: '0.8125rem', 
                  color: '#4a4a6a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}>
                  {doc.title}
                </span>
              </div>
            ))}
            
            {/* Then render child modules */}
            {hasChildren && module.children!.map((child) => renderModule(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid rgba(20, 20, 40, 0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#14142a' }}>Modules</h3>
        <button
          onClick={() => onCreateModule(null)}
          className="dash-btn dash-btn-primary"
          style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Module
        </button>
      </div>

      {/* Search and View All in one row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              fontSize: '0.8125rem',
              border: '1px solid rgba(20, 20, 40, 0.1)',
              borderRadius: '8px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(67, 97, 238, 0.3)';
              e.target.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(20, 20, 40, 0.1)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#8888aa" 
            strokeWidth="2"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.('')}
              style={{
                position: 'absolute',
                right: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: '#8888aa'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* View All Documents Button */}
        <button
          onClick={onViewAllDocuments}
          title="See All PDFs"
          style={{
            padding: '8px 12px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            border: '1px solid rgba(67, 97, 238, 0.2)',
            borderRadius: '8px',
            background: viewMode === 'all' ? 'rgba(67, 97, 238, 0.1)' : 'transparent',
            color: '#4361ee',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            if (viewMode !== 'all') {
              e.currentTarget.style.background = 'rgba(67, 97, 238, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (viewMode !== 'all') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
          All
        </button>
      </div>

      <div
        className={`module-item ${currentModuleId === null ? 'active' : ''} ${dragOverModuleId === null ? 'drag-over' : ''}`}
        onClick={() => onModuleClick(null)}
        onDragOver={(e) => onModuleDragOver?.(e, null)}
        onDragLeave={(e) => onModuleDragLeave?.(e)}
        onDrop={(e) => onModuleDrop?.(e, null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '8px',
          backgroundColor: dragOverModuleId === null ? 'rgba(67, 97, 238, 0.15)' : (currentModuleId === null ? 'rgba(67, 97, 238, 0.1)' : 'transparent'),
          border: dragOverModuleId === null ? '2px dashed rgba(67, 97, 238, 0.5)' : (currentModuleId === null ? '1px solid rgba(67, 97, 238, 0.3)' : '1px solid transparent'),
          transition: 'all 0.2s ease'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4361ee" strokeWidth="2" style={{ marginRight: '8px' }}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span style={{ fontSize: '0.875rem', fontWeight: currentModuleId === null ? 600 : 400 }}>
          Your Documents
        </span>
      </div>

      <div style={{ marginTop: '8px' }}>
        {modules.map((module) => renderModule(module, 0))}
      </div>

      {modules.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: '#8888aa', fontSize: '0.875rem' }}>
          No modules yet. Create one to organize your documents.
        </div>
      )}
    </div>
  );
};
