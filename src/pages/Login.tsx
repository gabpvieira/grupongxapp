import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';



const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session) {
      const from = (location.state as any)?.from?.pathname || '/app/dashboard';
      navigate(from, { replace: true });
    }
  }, [session, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError('Credenciais inválidas');
        toast.error('Credenciais inválidas');
        return;
      }

      toast.success('Login realizado com sucesso!');
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro de conexão, tente novamente');
      toast.error('Erro de conexão, tente novamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* Satoshi font loaded via index.html */


        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ngx-root {
          min-height: 100vh;
          display: flex;
          background: #070c09;
          font-family: 'Satoshi', '__no_fallback';
        }


        /* ── LEFT PANEL ── */
        .ngx-left {
          display: none;
          position: relative;
          flex: 1;
          overflow: hidden;
          background: #070c09;
        }

        @media (min-width: 1024px) {
          .ngx-left { display: flex; flex-direction: column; justify-content: space-between; padding: 48px; }
        }

        /* grid lines */
        .ngx-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(163,230,53,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(163,230,53,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%);
        }

        /* glow blobs */
        .ngx-blob-1 {
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(163,230,53,0.12) 0%, transparent 70%);
          top: -100px;
          right: -120px;
          pointer-events: none;
        }
        .ngx-blob-2 {
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(163,230,53,0.07) 0%, transparent 70%);
          bottom: 80px;
          left: -60px;
          pointer-events: none;
        }

        /* noise overlay */
        .ngx-noise {
          position: absolute;
          inset: 0;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
          pointer-events: none;
        }

        /* divider */
        .ngx-divider {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(163,230,53,0.15) 30%, rgba(163,230,53,0.15) 70%, transparent);
        }

        .ngx-left-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }

        .ngx-logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ngx-logo-img {
          height: 40px;
          width: auto;
          object-fit: contain;
          flex-shrink: 0;
        }

        .ngx-logo-text {
          font-family: 'Satoshi', '__no_fallback';
          font-weight: 700;
          font-size: 18px;
          color: #fff;
          letter-spacing: -0.3px;
          line-height: 1;
        }
        .ngx-logo-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          font-weight: 400;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .ngx-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 0;
        }

        .ngx-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #a3e635;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ngx-eyebrow::before {
          content: '';
          display: block;
          width: 24px;
          height: 1px;
          background: #a3e635;
        }

        .ngx-headline {
          font-family: 'Satoshi', '__no_fallback';
          font-size: clamp(36px, 3.5vw, 52px);
          font-weight: 800;
          color: #fff;
          line-height: 1.08;
          letter-spacing: -1.5px;
          margin-bottom: 20px;
        }

        .ngx-headline em {
          font-style: normal;
          color: #a3e635;
        }

        .ngx-body {
          font-size: 15px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          max-width: 380px;
          margin-bottom: 48px;
          font-weight: 300;
        }



        .ngx-left-footer {
          font-size: 12px;
          color: rgba(255,255,255,0.2);
        }

        /* ── RIGHT PANEL ── */
        .ngx-right {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #070c09;
          position: relative;
        }

        @media (min-width: 1024px) {
          .ngx-right {
            width: 480px;
            flex-shrink: 0;
            padding: 48px;
          }
        }

        /* mobile noise */
        .ngx-right::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(163,230,53,0.06) 0%, transparent 100%);
          pointer-events: none;
        }

        .ngx-right-inner {
          width: 100%;
          max-width: 360px;
          position: relative;
          z-index: 1;
        }

        /* mobile logo */
        .ngx-mobile-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 40px;
        }
        @media (min-width: 1024px) {
          .ngx-mobile-logo { display: none; }
        }

        .ngx-form-header {
          margin-bottom: 32px;
        }

        .ngx-form-title {
          font-family: 'Satoshi', '__no_fallback';
          font-size: 26px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.8px;
          line-height: 1.15;
          margin-bottom: 8px;
        }

        .ngx-form-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.35);
          font-weight: 300;
          line-height: 1.6;
        }

        .ngx-field {
          margin-bottom: 16px;
        }

        .ngx-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 8px;
          padding-left: 2px;
        }

        .ngx-input-wrap {
          position: relative;
        }

        .ngx-input {
          width: 100%;
          height: 48px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-family: 'Satoshi', '__no_fallback';
          padding: 0 16px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }

        .ngx-input::placeholder {
          color: rgba(255,255,255,0.2);
        }

        .ngx-input:focus {
          border-color: rgba(163,230,53,0.4);
          background: rgba(163,230,53,0.03);
          box-shadow: 0 0 0 3px rgba(163,230,53,0.08);
        }

        .ngx-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ngx-input-password {
          padding-right: 44px;
        }

        .ngx-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 0.15s;
        }
        .ngx-eye-btn:hover { color: #a3e635; }

        .ngx-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ngx-submit {
          width: 100%;
          height: 48px;
          background: linear-gradient(135deg, #a3e635, #84cc16);
          border: none;
          border-radius: 10px;
          color: #070c09;
          font-family: 'Satoshi', '__no_fallback';
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.15s, transform 0.1s, box-shadow 0.2s;
          margin-top: 24px;
          box-shadow: 0 4px 20px rgba(163,230,53,0.2);
        }

        .ngx-submit:hover:not(:disabled) {
          opacity: 0.9;
          box-shadow: 0 6px 28px rgba(163,230,53,0.3);
        }

        .ngx-submit:active:not(:disabled) {
          transform: scale(0.98);
        }

        .ngx-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .ngx-right-footer {
          margin-top: 32px;
          text-align: center;
        }

        .ngx-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          margin-bottom: 16px;
        }

        .ngx-badge-dot {
          width: 6px;
          height: 6px;
          background: #a3e635;
          border-radius: 50%;
          box-shadow: 0 0 6px #a3e635;
          flex-shrink: 0;
        }

        .ngx-copyright {
          font-size: 11px;
          color: rgba(255,255,255,0.15);
        }

        /* fade-in-up for right panel */
        .ngx-fadein {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .ngx-fadein.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .delay-1 { transition-delay: 0.05s; }
        .delay-2 { transition-delay: 0.1s; }
        .delay-3 { transition-delay: 0.18s; }
        .delay-4 { transition-delay: 0.26s; }
        .delay-5 { transition-delay: 0.34s; }
      `}</style>

      <div className="ngx-root">

        {/* ── LEFT PANEL ── */}
        <div className="ngx-left">
          <div className="ngx-grid" />
          <div className="ngx-blob-1" />
          <div className="ngx-blob-2" />
          <div className="ngx-noise" />
          <div className="ngx-divider" />

          <div className="ngx-left-content">
            {/* Logo */}
            <div className="ngx-logo-area">
              <img src="/logo.png" alt="Grupo NGX" className="ngx-logo-img" />
            </div>

            {/* Hero */}
            <div className="ngx-hero">
              <div className="ngx-eyebrow">Acesso Restrito</div>
              <h1 className="ngx-headline">
                Painel da<br />
                <em>equipe</em><br />
                interna.
              </h1>
              <p className="ngx-body">
                Área exclusiva para colaboradores e gestores do Grupo NGX.
                Apenas pessoas autorizadas têm acesso a este ambiente.
              </p>


            </div>

            <div className="ngx-left-footer">
              © {new Date().getFullYear()} Grupo NGX — Todos os direitos reservados
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="ngx-right">
          <div className="ngx-right-inner">

            {/* Mobile-only logo */}
            <div className="ngx-mobile-logo">
              <img src="/logo.png" alt="Grupo NGX" className="ngx-logo-img" />
            </div>

            {/* Header */}
            <div className={`ngx-form-header ngx-fadein delay-1 ${mounted ? 'visible' : ''}`}>
              <div className="ngx-form-title">Acesse o painel</div>
              <div className="ngx-form-subtitle">
                Entre com suas credenciais para acessar<br />o ecossistema Grupo NGX.
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin}>
              <div className={`ngx-field ngx-fadein delay-2 ${mounted ? 'visible' : ''}`}>
                <label className="ngx-label">E-mail</label>
                <div className="ngx-input-wrap">
                  <input
                    className="ngx-input"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={`ngx-field ngx-fadein delay-3 ${mounted ? 'visible' : ''}`}>
                <label className="ngx-label">Senha</label>
                <div className="ngx-input-wrap">
                  <input
                    className="ngx-input ngx-input-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="ngx-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword
                      ? <EyeOff size={17} />
                      : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="ngx-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={`ngx-fadein delay-4 ${mounted ? 'visible' : ''}`}>
                <button
                  type="submit"
                  className="ngx-submit"
                  disabled={loading || !email || !password}
                >
                  {loading
                    ? <><Loader2 size={16} className="spin" /> Entrando...</>
                    : 'Entrar'}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className={`ngx-right-footer ngx-fadein delay-5 ${mounted ? 'visible' : ''}`}>
              <div className="ngx-badge">
                <div className="ngx-badge-dot" />
                Ambiente seguro e criptografado
              </div>
              <div className="ngx-copyright">
                © {new Date().getFullYear()} Grupo NGX · Acesso restrito a colaboradores
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
};

export default Login;