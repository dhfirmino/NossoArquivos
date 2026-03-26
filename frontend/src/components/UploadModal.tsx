import { useState, useCallback } from 'react';
import { X, Upload, FileIcon } from 'lucide-react';

interface UploadModalProps {
  currentPath: string;
  onUpload: (files: File[]) => void;
  onClose: () => void;
  isUploading: boolean;
}

export function UploadModal({ currentPath, onUpload, onClose, isUploading }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    onUpload(files);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upload de Arquivos</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {currentPath && (
          <p className="text-sm text-gray-500 mb-3">
            Destino: <span className="font-medium">{currentPath}/</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <input
              id="file-input"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2 truncate">
                    <FileIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-gray-400 shrink-0">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)}>
                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={files.length === 0 || isUploading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? 'Enviando...' : `Enviar (${files.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
