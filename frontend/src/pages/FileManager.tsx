import { useState, useCallback, useMemo } from 'react';
import { FolderPlus, Upload, LogOut, Search, Folder } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';
import { useListFolder, useCreateFolder, useDeleteFolder, useUploadFiles, useDeleteFile } from '../hooks/useFiles.ts';
import { Breadcrumb } from '../components/Breadcrumb.tsx';
import { FileTable } from '../components/FileTable.tsx';
import { NewFolderModal } from '../components/NewFolderModal.tsx';
import { UploadModal } from '../components/UploadModal.tsx';
import { Toast } from '../components/Toast.tsx';
import { ThemeToggle } from '../components/ThemeToggle.tsx';
import type { FileItem } from '../types/index.ts';

interface FileManagerProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export function FileManager({ theme, onToggleTheme }: FileManagerProps) {
  const { user, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FileItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useListFolder(currentPath);
  const createFolder = useCreateFolder();
  const deleteFolderMut = useDeleteFolder();
  const uploadFiles = useUploadFiles();
  const deleteFileMut = useDeleteFile();

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  async function handleCreateFolder(fullPath: string) {
    try {
      await createFolder.mutateAsync(fullPath);
      showToast('Pasta criada com sucesso', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao criar pasta', 'error');
    }
    setShowNewFolder(false);
  }

  async function handleUpload(files: File[]) {
    try {
      await uploadFiles.mutateAsync({ path: currentPath, files });
      showToast(`${files.length} arquivo(s) enviado(s)`, 'success');
      setShowUpload(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro no upload', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'folder') {
        await deleteFolderMut.mutateAsync(deleteConfirm.path);
      } else {
        await deleteFileMut.mutateAsync(deleteConfirm.path);
      }
      showToast('Removido com sucesso', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao remover', 'error');
    }
    setDeleteConfirm(null);
  }

  function handleCopyLink(item: FileItem) {
    const url = `${window.location.origin}/public/${item.path}`;
    navigator.clipboard.writeText(url);
    showToast('Link copiado!', 'success');
  }

  const items = useMemo(() => {
    const all = [...(data?.folders || []), ...(data?.files || [])];
    if (!searchTerm.trim()) return all;
    const term = searchTerm.toLowerCase();
    return all.filter((item) => item.name.toLowerCase().includes(term));
  }, [data, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-transparent transition-colors relative">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Gradient folder icon */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Folder className="w-4.5 h-4.5 text-white" fill="white" fillOpacity={0.3} />
            </div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">NossoArquivos</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
              {user?.nome_colaborador}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
        {/* Subtle gradient bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500/20 via-purple-500/30 to-pink-500/20" />
      </header>

      {/* Toolbar */}
      <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Breadcrumb path={currentPath} onNavigate={setCurrentPath} />
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar arquivos..."
              className="pl-8 pr-3 py-2 text-sm w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            Nova Pasta
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm hover:shadow transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Carregando...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 dark:text-red-400">
              Erro ao carregar: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </div>
          ) : (
            <FileTable
              items={items}
              onFolderClick={setCurrentPath}
              onDelete={setDeleteConfirm}
              onCopyLink={handleCopyLink}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewFolder && (
        <NewFolderModal
          currentPath={currentPath}
          onConfirm={handleCreateFolder}
          onClose={() => setShowNewFolder(false)}
        />
      )}

      {showUpload && (
        <UploadModal
          currentPath={currentPath}
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
          isUploading={uploadFiles.isPending}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm animate-modal-enter border border-red-200/50 dark:border-red-900/30">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Confirmar exclusão</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Tem certeza que deseja excluir{' '}
              <span className="font-medium text-red-600 dark:text-red-400">{deleteConfirm.name}</span>
              {deleteConfirm.type === 'folder' && ' e todo seu conteúdo'}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>

          <style>{`
            @keyframes modal-enter {
              from {
                transform: scale(0.95);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
            .animate-modal-enter {
              animation: modal-enter 0.2s ease-out;
            }
          `}</style>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
