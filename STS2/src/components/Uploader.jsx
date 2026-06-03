import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

const Uploader = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div 
      className={`uploader-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple 
        accept=".json,.run" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={handleFileInput}
      />
      <div className="uploader-content">
        <UploadCloud size={64} className="upload-icon" />
        <h2>Drop your Run History Files</h2>
        <p>Select or drag & drop multiple .run or .json files here</p>
      </div>
    </div>
  );
};

export default Uploader;
