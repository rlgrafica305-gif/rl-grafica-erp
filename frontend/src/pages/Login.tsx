import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'E-mail ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      backgroundImage: 'url(/bg-login.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'left center',
      backgroundRepeat: 'no-repeat',
    }}>

      {/* Card de login — posicionado no lado direito sobre a imagem */}
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '4%',
        transform: 'translateY(-50%)',
        width: '100%',
        maxWidth: '390px',
        zIndex: 10,
      }}>

        {/* Efeito de luz dourada atrás do card */}
        <div style={{
          position: 'absolute',
          inset: '-40px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,160,0,0.18) 0%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Quadro dourado */}
        <div style={{
          width: '100%',
          border: '2px solid #d4a000',
          borderRadius: '16px',
          background: 'rgba(4,8,22,0.88)',
          backdropFilter: 'blur(22px)',
          boxShadow: '0 0 60px rgba(212,160,0,0.28), inset 0 0 60px rgba(212,160,0,0.04)',
          padding: '44px 38px',
          position: 'relative',
          zIndex: 1,
        }}>

          {/* Pontos decorativos */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00aaff', boxShadow: '0 0 8px #00aaff' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff00aa', boxShadow: '0 0 8px #ff00aa' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d4a000', boxShadow: '0 0 8px #d4a000' }} />
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.55rem', fontWeight: '800', marginBottom: '6px' }}>
              Acesse o Sistema
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.83rem', lineHeight: 1.5 }}>
              Entre com suas credenciais para continuar
            </p>
          </div>

          {/* Divisor */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(212,160,0,0.4), transparent)',
            marginBottom: '28px',
          }} />

          {/* Erro */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#f87171', fontSize: '0.83rem',
              padding: '11px 14px', borderRadius: '8px',
              marginBottom: '20px', textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* E-mail */}
            <div>
              <label style={{
                color: '#d1d5db', fontSize: '0.74rem', fontWeight: '700',
                display: 'block', marginBottom: '7px',
                textTransform: 'uppercase', letterSpacing: '0.7px',
              }}>
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rlgrafica.com.br"
                  required
                  autoComplete="email"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(212,160,0,0.30)',
                    borderRadius: '8px', padding: '12px 12px 12px 38px',
                    color: '#fff', fontSize: '0.87rem', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#d4a000'}
                  onBlur={(e)  => e.currentTarget.style.borderColor = 'rgba(212,160,0,0.30)'}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label style={{
                color: '#d1d5db', fontSize: '0.74rem', fontWeight: '700',
                display: 'block', marginBottom: '7px',
                textTransform: 'uppercase', letterSpacing: '0.7px',
              }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(212,160,0,0.30)',
                    borderRadius: '8px', padding: '12px 40px 12px 38px',
                    color: '#fff', fontSize: '0.87rem', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#d4a000'}
                  onBlur={(e)  => e.currentTarget.style.borderColor = 'rgba(212,160,0,0.30)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0,
                  }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '4px',
                background: loading ? 'rgba(180,130,0,0.40)' : 'linear-gradient(135deg, #d4a000 0%, #b8860b 100%)',
                color: '#fff', border: 'none', borderRadius: '8px',
                padding: '14px', fontSize: '1rem', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(212,160,0,0.45)',
                transition: 'all 0.2s',
                letterSpacing: '0.5px',
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 32px rgba(212,160,0,0.65)' }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(212,160,0,0.45)' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p style={{ marginTop: '28px', textAlign: 'center', color: '#374151', fontSize: '0.72rem' }}>
            © 2024 <span style={{ color: '#d4a000' }}>RL Gráfica</span>. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
