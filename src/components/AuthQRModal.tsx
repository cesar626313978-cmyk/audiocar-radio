import React, { useState } from 'react';
import { User, X, QrCode, ShieldCheck, CheckCircle2, LogOut } from 'lucide-react';
import { UserSession } from '../types';

interface AuthQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  onUpdateSession: (session: UserSession) => void;
}

export const AuthQRModal: React.FC<AuthQRModalProps> = ({
  isOpen,
  onClose,
  session,
  onUpdateSession,
}) => {
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const handleSimulateGoogleLogin = () => {
    const mockUser = {
      name: 'Carlos Conductor',
      email: 'carlos.conductor@tesla.user',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
    onUpdateSession({ loggedIn: true, user: mockUser, sessionId: `session-${Date.now()}` });
  };

  const handleLogout = () => {
    onUpdateSession({ loggedIn: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Sincronización Cloud & Tesla</h2>
              <p className="text-xs text-slate-400">Favoritos y Recientes en la Nube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {session.loggedIn ? (
          <div className="space-y-6 text-center py-4">
            <div className="relative inline-block">
              <img
                src={session.user?.picture}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-red-500 shadow-xl"
              />
              <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-lg text-white">{session.user?.name}</h3>
              <p className="text-xs text-slate-400">{session.user?.email}</p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-left space-y-2">
              <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Sesión Sincronizada con Firestore</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tus emisoras favoritas y estaciones personalizadas se sincronizan automáticamente entre tu smartphone y la pantalla del Tesla.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {!showQR ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-300 text-center">
                  Inicia sesión con tu cuenta de Google o escanea el código QR desde el móvil para vincular este navegador Tesla instantáneamente.
                </p>

                <button
                  onClick={handleSimulateGoogleLogin}
                  className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center space-x-3 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.4 0 10.6 0 13s.6 4.6 1.6 6.6l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 15C3.5 18.8 7.4 21.4 12 21.4z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase tracking-widest font-mono">o</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <button
                  onClick={() => setShowQR(true)}
                  className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-xs flex items-center justify-center space-x-2 transition-colors"
                >
                  <QrCode className="w-5 h-5 text-red-500" />
                  <span>Vincular por Código QR (Tesla)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-xl">
                  {/* Simulated QR Code SVG */}
                  <QrCode className="w-40 h-40 text-slate-950" />
                </div>
                <p className="text-xs text-slate-400">
                  Apunta la cámara de tu smartphone para autorizar este navegador instantáneamente.
                </p>
                <button
                  onClick={() => setShowQR(false)}
                  className="text-xs text-red-400 hover:underline"
                >
                  ← Volver a inicio de sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
