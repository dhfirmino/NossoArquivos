import { useState, useCallback, useRef } from 'react';
import { X, Upload, FileIcon, CheckCircle } from 'lucide-react';

interface UploadModalProps {
  currentPath: string;
  onUpload: (files: File[], onProgress: (percent: number) => void) => void;
  onClose: () => void;
  isUploading: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadModal({ currentPath, onUpload, onClose, isUploading }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  function openFilePicker() {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  }

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
    setProgress(0);
    onUpload(files, setProgress);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 animate-modal-enter">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upload de Arquivos</h2>
          {!isUploading && (
            <button onClick={onClose} className="hover:opacity-75 transition-opacity">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>

        {currentPath && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Destino: <span className="font-medium text-gray-700 dark:text-gray-300">{currentPath}/</span>
          </p>
        )}

        {/* Upload progress */}
        {isUploading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {progress < 100 ? (
                <div className="w-10 h-10 rounded-full border-3 border-gray-200 dark:border-gray-600 border-t-orange-600 animate-spin shrink-0" />
              ) : (
                <CheckCircle className="w-10 h-10 text-green-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {progress < 100 ? 'Enviando arquivos...' : 'Finalizando...'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {files.length} arquivo(s) — {formatFileSize(totalSize)}
                </p>
              </div>
              <span className="text-lg font-bold text-orange-600">{progress}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-orange-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* File list (collapsed) */}
            <div className="max-h-32 overflow-y-auto space-y-1">
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className="flex items-center gap-2 text-xs py-1 px-2 text-gray-500 dark:text-gray-400">
                  <FileIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0">({formatFileSize(file.size)})</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={openFilePicker}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Você pode selecionar múltiplos arquivos
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {files.length > 0 && (
              <>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {files.map((file, i) => (
                    <div key={`${file.name}-${i}`} className="flex items-center justify-between text-sm py-1.5 px-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <FileIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                        <span className="truncate text-gray-700 dark:text-gray-200">{file.name}</span>
                        <span className="text-gray-400 dark:text-gray-500 shrink-0">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button type="button" onClick={() => removeFile(i)}>
                        <X className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                  Total: {files.length} arquivo(s) — {formatFileSize(totalSize)}
                </div>
              </>
            )}

            <div className="flex justify-between">
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="px-3 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors"
                >
                  + Adicionar mais
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={files.length === 0}
                  className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  Enviar ({files.length})
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes modal-enter {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-modal-enter {
          animation: modal-enter 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
