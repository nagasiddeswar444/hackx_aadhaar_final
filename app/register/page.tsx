'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/lib/translations';
import { Shield, Eye, EyeOff, Fingerprint, CheckCircle } from 'lucide-react';
import FaceScanner from '@/components/FaceScanner';

export default function RegisterPage() {
    const { register, language } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({
        aadhaar_number: '',
        name: '',
        email: '',
        mobile: '',
        date_of_birth: '',
        password: '',
        confirm_password: '',
    });
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Face Capture State
    const [faceImage, setFaceImage] = useState<string | null>(null);
    const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (form.aadhaar_number.length !== 12 || !/^\d+$/.test(form.aadhaar_number)) {
            setError(t(language, 'aadhaar_invalid'));
            return;
        }
        if (form.password !== form.confirm_password) {
            setError('Passwords do not match.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (!faceImage || !faceDescriptor) {
            setError('Face verification is mandatory for account creation.');
            return;
        }

        setLoading(true);
        const { error: err } = await register({
            aadhaar_number: form.aadhaar_number,
            name: form.name,
            email: form.email,
            mobile: form.mobile,
            date_of_birth: form.date_of_birth,
            password: form.password,
            preferred_language: language,
            face_image_base64: faceImage,
            face_descriptor: faceDescriptor,
        });
        setLoading(false);
        if (err) {
            setError(err);
        } else {
            setSuccess(t(language, 'register_success'));
            setTimeout(() => router.push('/login'), 1500);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card fade-in-up" style={{ maxWidth: '520px' }}>
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <Shield size={28} color="white" />
                    </div>
                    <div className="auth-logo-title">{t(language, 'app_name')}</div>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-primary)' }}>
                    {t(language, 'register')}
                </h2>

                {error && <div className="alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
                {success && <div className="alert-success" style={{ marginBottom: '16px' }}>{success}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Aadhaar */}
                    <div className="input-group">
                        <label className="input-label">
                            <Fingerprint size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                            {t(language, 'aadhaar_number')} *
                        </label>
                        <input className="input-field" placeholder={t(language, 'aadhaar_placeholder')}
                            value={form.aadhaar_number}
                            onChange={e => handleChange('aadhaar_number', e.target.value.replace(/\D/g, '').slice(0, 12))}
                            maxLength={12} inputMode="numeric" required
                        />
                    </div>

                    {/* Name */}
                    <div className="input-group">
                        <label className="input-label">{t(language, 'full_name')} *</label>
                        <input className="input-field" placeholder="Enter your full name"
                            value={form.name} onChange={e => handleChange('name', e.target.value)} required
                        />
                    </div>

                    {/* Email + Mobile in row */}
                    <div className="grid-2" style={{ gap: '12px' }}>
                        <div className="input-group">
                            <label className="input-label">{t(language, 'email')} *</label>
                            <input className="input-field" type="email" placeholder="email@example.com"
                                value={form.email} onChange={e => handleChange('email', e.target.value)} required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t(language, 'mobile')} *</label>
                            <input className="input-field" placeholder="10-digit mobile"
                                value={form.mobile}
                                onChange={e => handleChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                inputMode="numeric" maxLength={10} required
                            />
                        </div>
                    </div>

                    {/* DOB */}
                    <div className="input-group">
                        <label className="input-label">{t(language, 'date_of_birth')} *</label>
                        <input className="input-field" type="date"
                            value={form.date_of_birth}
                            onChange={e => handleChange('date_of_birth', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            required
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>

                    {/* Password */}
                    <div className="grid-2" style={{ gap: '12px' }}>
                        <div className="input-group">
                            <label className="input-label">{t(language, 'password')} *</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input-field" type={showPwd ? 'text' : 'password'}
                                    placeholder="Min 6 characters"
                                    value={form.password} onChange={e => handleChange('password', e.target.value)}
                                    required style={{ paddingRight: '42px' }}
                                />
                                <button type="button" onClick={() => setShowPwd(!showPwd)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Confirm Password *</label>
                            <input className="input-field" type="password" placeholder="Re-enter password"
                                value={form.confirm_password} onChange={e => handleChange('confirm_password', e.target.value)} required
                            />
                        </div>
                    </div>

                    {/* Face Capture Section */}
                    <div style={{ marginTop: '16px', padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-50)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>{t(language, 'face_verification') || 'Face Registration (Mandatory)'}</h3>

                        {!faceImage ? (
                            <FaceScanner
                                onCapture={(data) => {
                                    setFaceImage(data.imageBase64);
                                    setFaceDescriptor(data.descriptor);
                                }}
                                onError={(err) => setError(err)}
                                buttonText="Capture Face"
                            />
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '120px', height: '120px', margin: '0 auto 12px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--success)' }}>
                                    <img src={faceImage} alt="Captured Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--success)', fontWeight: '500', marginBottom: '16px' }}>
                                    <CheckCircle size={16} /> Face Captured Successfully
                                </div>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => { setFaceImage(null); setFaceDescriptor(null); }}
                                    style={{ fontSize: '12px', padding: '6px 16px' }}
                                >
                                    Retake Photo
                                </button>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading || !faceImage} style={{ marginTop: '8px' }}>
                        {loading ? <><span className="spinner"></span>&nbsp;{t(language, 'loading')}</> : t(language, 'register_btn')}
                    </button>
                </form>

                <div className="divider" />
                <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {t(language, 'have_account')}{' '}
                    <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                        {t(language, 'login_link')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
