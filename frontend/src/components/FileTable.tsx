import { Folder, FileIcon, FileText, Image, FileSpreadsheet, FileArchive, FileCode, Trash2, Copy, Download } from 'lucide-react';
import type { FileItem } from '../types/index.ts';
import type { LucideIcon } from 'lucide-react';

interface FileTableProps {
  items: FileItem[];
  onFolderClick: (path: string) => void;
  onDelete: (item: FileItem) => void;
  onCopyLink: (item: FileItem) => void;
}

function getFileIcon(name: string): { icon: LucideIcon; color: string } {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf':
      return { icon: FileText, color: 'text-red-500' };
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': case 'svg': case 'bmp':
      return { icon: Image, color: 'text-green-500' };
    case 'doc': case 'docx':
      return { icon: FileText, color: 'text-blue-500' };
    case 'xls': case 'xlsx':
      return { icon: FileSpreadsheet, color: 'text-blue-500' };
    case 'zip': case 'rar': case '7z': case 'tar': case 'gz':
      return { icon: FileArchive, color: 'text-amber-600' };
    case 'txt': case 'csv': case 'json': case 'xml': case 'md': case 'log':
      return { icon: FileCode, color: 'text-gray-500' };
    default:
      return { icon: FileIcon, color: 'text-gray-400' };
  }
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
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <Folder className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-lg font-medium text-gray-400 dark:text-gray-500">Pasta vazia</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Crie uma pasta ou faça upload de arquivos</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
            <th className="py-3 px-4 font-medium">Nome</th>
            <th className="py-3 px-4 font-medium w-28">Tamanho</th>
            <th className="py-3 px-4 font-medium w-44">Modificado</th>
            <th className="py-3 px-4 font-medium w-28 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const { icon: ItemIcon, color: iconColor } = item.type === 'folder'
              ? { icon: Folder, color: 'text-yellow-500' }
              : getFileIcon(item.name);

            return (
              <tr
                key={item.path}
                className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-colors animate-row-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="py-3 px-4">
                  {item.type === 'folder' ? (
                    <button
                      onClick={() => onFolderClick(item.path)}
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ItemIcon className={`w-5 h-5 ${iconColor}`} />
                      {item.name}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                      <ItemIcon className={`w-5 h-5 ${iconColor}`} />
                      {item.name}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{formatSize(item.size)}</td>
                <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{formatDate(item.lastModified)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    {item.type === 'file' && (
                      <>
                        <button
                          onClick={() => onCopyLink(item)}
                          title="Copiar link público"
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={`/public/${item.path}`}
                          download
                          title="Download"
                          className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => onDelete(item)}
                      title="Excluir"
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style>{`
        @keyframes row-fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-row-fade-in {
          animation: row-fade-in 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
