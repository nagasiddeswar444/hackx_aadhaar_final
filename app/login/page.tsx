'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/lib/translations';
import { Shield, Eye, EyeOff, Fingerprint } from 'lucide-react';

export default function LoginPage() {
    const { login, language } = useAuth();
    const router = useRouter();
    const [aadhaar, setAadhaar] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (aadhaar.length !== 12 || !/^\d+$/.test(aadhaar)) {
            setError(t(language, 'aadhaar_invalid'));
            return;
        }
        setLoading(true);
        const { error: err } = await login(aadhaar, password);
        setLoading(false);
        if (err) {
            setError(err);
        } else {
            router.push('/dashboard');
        }
    };

    const formatAadhaar = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 12);
        setAadhaar(digits);
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card fade-in-up">
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <Shield size={28} color="white" />
                    </div>
                    <div className="auth-logo-title">{t(language, 'app_name')}</div>
                    <div className="auth-logo-sub">{t(language, 'app_tagline')}</div>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-primary)' }}>
                    {t(language, 'login')}
                </h2>

                {error && <div className="alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="input-group">
                        <label className="input-label">
                            <Fingerprint size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                            {t(language, 'aadhaar_number')}
                        </label>
                        <input
                            className="input-field"
                            placeholder={t(language, 'aadhaar_placeholder')}
                            value={aadhaar}
                            onChange={e => formatAadhaar(e.target.value)}
                            maxLength={12}
                            inputMode="numeric"
                            required
                        />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{aadhaar.length}/12 digits</span>
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t(language, 'password')}</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="input-field"
                                type={showPwd ? 'text' : 'password'}
                                placeholder={t(language, 'password_placeholder')}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{ paddingRight: '48px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(!showPwd)}
                                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <><span className="spinner"></span>&nbsp;{t(language, 'loading')}</> : t(language, 'login_btn')}
                    </button>
                </form>

                <div className="divider" />

                <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {t(language, 'no_account')}{' '}
                    <Link href="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                        {t(language, 'register_link')}
                    </Link>
                </p>
                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
                    <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Change Language</Link>
                </p>
            </div>
        </div>
    );
}
