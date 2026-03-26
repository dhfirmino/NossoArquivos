import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const parts = path ? path.split('/') : [];

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-600">
      <button
        onClick={() => onNavigate('')}
        className="flex items-center gap-1 hover:text-blue-600"
      >
        <Home className="w-4 h-4" />
        <span>Raiz</span>
      </button>

      {parts.map((part, i) => {
        const partPath = parts.slice(0, i + 1).join('/');
        return (
          <span key={partPath} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => onNavigate(partPath)}
              className="hover:text-blue-600"
            >
              {part}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
