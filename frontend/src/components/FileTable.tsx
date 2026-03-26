import { Folder, FileIcon, Trash2, Copy, Download } from 'lucide-react';
import type { FileItem } from '../types/index.ts';

interface FileTableProps {
  items: FileItem[];
  onFolderClick: (path: string) => void;
  onDelete: (item: FileItem) => void;
  onCopyLink: (item: FileItem) => void;
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('pt-BR');
}

export function FileTable({ items, onFolderClick, onDelete, onCopyLink }: FileTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>Pasta vazia</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-3 px-4 font-medium">Nome</th>
            <th className="py-3 px-4 font-medium w-28">Tamanho</th>
            <th className="py-3 px-4 font-medium w-44">Modificado</th>
            <th className="py-3 px-4 font-medium w-28 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.path} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                {item.type === 'folder' ? (
                  <button
                    onClick={() => onFolderClick(item.path)}
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Folder className="w-5 h-5 text-yellow-500" />
                    {item.name}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-5 h-5 text-gray-400" />
                    {item.name}
                  </div>
                )}
              </td>
              <td className="py-3 px-4 text-gray-500">{formatSize(item.size)}</td>
              <td className="py-3 px-4 text-gray-500">{formatDate(item.lastModified)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  {item.type === 'file' && (
                    <>
                      <button
                        onClick={() => onCopyLink(item)}
                        title="Copiar link público"
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`/public/${item.path}`}
                        download
                        title="Download"
                        className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => onDelete(item)}
                    title="Excluir"
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
