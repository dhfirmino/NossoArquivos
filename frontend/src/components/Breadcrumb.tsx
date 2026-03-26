import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const parts = path ? path.split('/') : [];

  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
      <button
        onClick={() => onNavigate('')}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Raiz</span>
      </button>

      {parts.map((part, i) => {
        const partPath = parts.slice(0, i + 1).join('/');
        return (
          <span key={partPath} className="flex items-center gap-1.5">
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <button
              onClick={() => onNavigate(partPath)}
              className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {part}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
