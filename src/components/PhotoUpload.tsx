
import React, { useState, useRef } from 'react';
import { Upload, Camera, X } from 'lucide-react';

interface PhotoUploadProps {
  onPhotoSelect: (photo: string) => void;
  currentPhoto?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoSelect, currentPhoto }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onPhotoSelect(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) handleFileSelect(files[0]);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {currentPhoto ? (
        <div className="relative group">
          <img 
            src={currentPhoto} 
            alt="User photo" 
            className="w-full h-80 object-cover rounded-xl shadow-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-xl transition-all duration-300 flex items-center justify-center">
            <button
              onClick={() => onPhotoSelect('')}
              className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
            dragOver 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-indigo-100 p-4 rounded-full">
              <Upload className="text-indigo-600" size={32} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Your Photo</h3>
              <p className="text-gray-600 mb-4">Drag and drop your photo here, or click to browse</p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Camera size={16} />
                  <span>JPG, PNG up to 10MB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
};
