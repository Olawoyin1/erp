import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiFileText, FiX, FiCheck } from 'react-icons/fi';

/**
 * Reusable Drag & Drop File Upload component
 * Used across forms for attaching supporting documents, IDs, medical certificates, etc.
 */
export default function FileUpload({
  value,
  onChange,
  accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg',
  maxSizeText = 'Up to 10MB',
  placeholder = 'Click to upload or drag and drop',
  subtext = 'PDF, DOC, DOCX, PNG or JPG supported',
  error = false,
  disabled = false,
  style = {},
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(value || null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (onChange) onChange(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (onChange) onChange(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onChange) onChange(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={className} style={{ width: '100%', fontFamily: 'var(--font)', ...style }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      {selectedFile ? (
        /* File Preview Container */
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FiFileText size={18} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedFile.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{formatFileSize(selectedFile.size)}</span>
                <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <FiCheck size={12} /> Ready
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            style={{
              border: 'none',
              backgroundColor: '#F1F5F9',
              color: '#64748B',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE2E2';
              e.currentTarget.style.color = '#DC2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.color = '#64748B';
            }}
            title="Remove file"
          >
            <FiX size={14} />
          </button>
        </div>
      ) : (
        /* Dropzone Box */
        <div
          onClick={() => !disabled && fileInputRef.current && fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            padding: '24px 16px',
            borderRadius: '8px',
            border: error
              ? '2px dashed #DC2626'
              : isDragging
              ? '2px dashed #1D4ED8'
              : '2px dashed #CBD5E1',
            backgroundColor: isDragging ? '#EFF6FF' : '#F8FAFC',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isDragging ? '#DBEAFE' : '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: isDragging ? '#1D4ED8' : '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <FiUploadCloud size={20} />
          </div>

          <div>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1D4ED8' }}>
              {placeholder}
            </span>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '4px 0 0 0' }}>
              {subtext} ({maxSizeText})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
