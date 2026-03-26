import { useState, useCallback } from 'react';
import { FolderPlus, Upload, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';
import { useListFolder, useCreateFolder, useDeleteFolder, useUploadFiles, useDeleteFile } from '../hooks/useFiles.ts';
import { Breadcrumb } from '../components/Breadcrumb.tsx';
import { FileTable } from '../components/FileTable.tsx';
import { NewFolderModal } from '../components/NewFolderModal.tsx';
import { UploadModal } from '../components/UploadModal.tsx';
import { Toast } from '../components/Toast.tsx';
import type { FileItem } from '../types/index.ts';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export function FileManager() {
  const { user, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FileItem | null>(null);

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

  const items = [...(data?.folders || []), ...(data?.files || [])];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">NossoArquivos</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.nome_colaborador}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center justify-between">
        <Breadcrumb path={currentPath} onNavigate={setCurrentPath} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FolderPlus className="w-4 h-4" />
            Nova Pasta
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        <div className="bg-white rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
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
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Confirmar exclusão</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja excluir{' '}
              <span className="font-medium">{deleteConfirm.name}</span>
              {deleteConfirm.type === 'folder' && ' e todo seu conteúdo'}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
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
