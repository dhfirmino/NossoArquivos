import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.ts';
import { CloudUpload, Link, FolderOpen } from 'lucide-react';

const slides = [
  {
    icon: CloudUpload,
    title: 'Upload seguro e ilimitado',
    description: 'Envie seus arquivos com total segurança e rapidez.',
    animation: 'animate-float',
  },
  {
    icon: Link,
    title: 'Links públicos permanentes',
    description: 'Compartilhe arquivos com links que nunca expiram.',
    animation: 'animate-pulse-slow',
  },
  {
    icon: FolderOpen,
    title: 'Gerenciamento inteligente de arquivos',
    description: 'Organize e gerencie seus arquivos de forma eficiente.',
    animation: 'animate-bounce-slow',
  },
];

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 2.5s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left side — Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-between bg-white dark:bg-gray-900 px-6 py-10 sm:px-12 lg:px-20">
          <div />

          {/* Form */}
          <div className="w-full max-w-sm mx-auto">
            <div className="flex justify-center mb-8">
              <img
                src="/Nossocloud.png"
                alt="NossoCloud"
                className="h-16 dark:hidden"
              />
              <img
                src="/Nossocloud-white.png"
                alt="NossoCloud"
                className="h-16 hidden dark:block"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Usuário
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Seu nome de usuário"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Desenvolvido por{' '}
            <span className="font-medium text-gray-500 dark:text-gray-400">
              Obter Soluções
            </span>
          </p>
        </div>

        {/* Right side — Showcase (hidden below md) */}
        <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-orange-600 via-orange-500 to-blue-700 flex-col items-center justify-center px-12 lg:px-20 overflow-hidden">
          {/* Decorative background circles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
            <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-white/5" />
          </div>

          {/* Carousel */}
          <div className="relative z-10 w-full max-w-md text-center">
            {slides.map((slide, index) => {
              const Icon = slide.icon;
              return (
                <div
                  key={index}
                  className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out"
                  style={{
                    opacity: currentSlide === index ? 1 : 0,
                    pointerEvents: currentSlide === index ? 'auto' : 'none',
                    position: index === 0 ? 'relative' : 'absolute',
                  }}
                >
                  <div className="mb-8 p-5 rounded-2xl bg-white/10 backdrop-blur-sm">
                    <Icon
                      className={`w-14 h-14 text-white ${slide.animation}`}
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                    {slide.title}
                  </h3>
                  <p className="text-white/70 text-base lg:text-lg leading-relaxed">
                    {slide.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Slide indicator dots */}
          <div className="absolute bottom-10 flex gap-2.5 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === index
                    ? 'bg-white w-7'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
