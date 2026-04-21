import { store } from '@/shared/store';
import { Theme } from '@radix-ui/themes';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { Wrench, Sparkles, ArrowRight } from 'lucide-react';

// Animated Loading Component

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#1a0405] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Cinematic background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(222,164,2,0.12),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_120%,rgba(74,16,21,0.6),transparent_70%)]"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#dea402] rounded-full filter blur-[200px] opacity-[0.04]" style={{ animation: 'pulse 5s ease-in-out infinite' }}></div>
      </div>

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Animated Logo */}
        <div className="relative w-28 h-28">
          <div className="absolute inset-0 rounded-full border border-[#dea402]/10" style={{ animation: 'ping 2.5s cubic-bezier(0,0,0.2,1) infinite' }}></div>
          <div className="absolute inset-0 rounded-full border-2 border-t-[#dea402] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
          <div className="absolute inset-2 rounded-full border border-t-transparent border-r-[#dea402]/40 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#dea402] via-[#f0ba0a] to-[#b38302] shadow-[0_0_40px_rgba(222,164,2,0.3)]" style={{ animation: 'pulse 2s ease-in-out infinite' }}></div>
          </div>
        </div>

        {/* Brand */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-[0.2em] text-white/90" style={{ animation: 'fadeIn 0.8s ease-out forwards' }}>BBH</h2>
          <div className="flex items-center gap-1.5 justify-center">
            {[0, 0.15, 0.3].map((delay, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#dea402]" style={{ animation: `bounce 1.2s ease-in-out ${delay}s infinite` }}></div>
            ))}
          </div>
          <p className="text-[#dea402]/50 text-xs font-medium uppercase tracking-[0.3em]" style={{ animation: 'fadeIn 1s ease-out 0.3s forwards', opacity: 0 }}>
            Loading
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// Professional "We're Working On It" Component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const [progress, setProgress] = React.useState(0);
  const [statusText, setStatusText] = React.useState("Checking connection...");

  React.useEffect(() => {
    console.log(error, 'error in AppProvider.tsx')

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    // Status text rotation
    const messages = [
      "Checking connection...",
      "Verifying components...",
      "Almost ready...",
    ];
    let index = 0;
    const statusInterval = setInterval(() => {
      index = (index + 1) % messages.length;
      setStatusText(messages[index]);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#1a0405] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(222,164,2,0.08),transparent_70%)]"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#4a1015] rounded-full filter blur-[200px] opacity-30"></div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-lg relative z-10" style={{ animation: 'slideUp 0.6s ease-out forwards' }}>
        <div className="relative bg-[#37090b]/70 backdrop-blur-2xl border border-[#dea402]/10 rounded-3xl p-10 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)]">
          {/* Top accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-[#dea402] to-transparent rounded-full"></div>

          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#dea402]/15 to-transparent border border-[#dea402]/20 flex items-center justify-center" style={{ animation: 'glowPulse 3s ease-in-out infinite' }}>
              <Wrench className="w-10 h-10 text-[#dea402]" style={{ animation: 'wiggle 3s ease-in-out infinite' }} />
              <Sparkles className="w-4 h-4 text-[#dea402]/60 absolute -top-1.5 -right-1.5" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8 space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">We're On It</h1>
            <p className="text-white/40 text-sm max-w-sm mx-auto">Our system is performing optimizations. This will only take a moment.</p>
          </div>

          {/* Progress */}
          <div className="mb-8 space-y-2">
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#dea402] to-[#f0ba0a] rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-center text-white/30 text-xs">{statusText}</p>
          </div>

          {/* Action */}
          <div className="text-center space-y-3">
            <button
              onClick={resetErrorBoundary}
              className="group w-full px-6 py-3.5 bg-[#dea402] hover:bg-[#f0ba0a] text-[#1a0405] font-semibold text-sm rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(222,164,2,0.15)] hover:shadow-[0_0_40px_rgba(222,164,2,0.25)]"
            >
              <span className="flex items-center justify-center gap-2">
                Continue to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
              </span>
            </button>
            <button onClick={() => globalThis.location.assign(globalThis.location.origin)} className="text-white/30 hover:text-[#dea402] text-xs transition-colors duration-300">
              Refresh the page
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-white/20 text-[10px] tracking-[0.3em] uppercase">BBH CRM</p>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wiggle { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 20px rgba(222,164,2,0.05); } 50% { box-shadow: 0 0 40px rgba(222,164,2,0.12); } }
      `}</style>
    </div>
  );
}

type AppProviderProps = {
  children: React.ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Provider store={store}>
        <Theme
          accentColor="amber"
          grayColor="gray"
          panelBackground="solid"
          scaling="100%"
          radius="full"
        >
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Router>{children}</Router>
          </ErrorBoundary>
        </Theme>
      </Provider>
    </React.Suspense>
  );
}