import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login.tsx';
import { FileManager } from './pages/FileManager.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { useTheme } from './hooks/useTheme.ts';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FileManager theme={theme} onToggleTheme={toggleTheme} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
