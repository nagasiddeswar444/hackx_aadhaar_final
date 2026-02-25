'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/lib/translations';
import { supabase, Booking } from '@/lib/supabase';
import { getMilestoneMessage } from '@/lib/age-milestone';
import Navbar from '@/components/Navbar';
import AiAssistant from '@/components/AiAssistant';
import { Fingerprint, Mail, Phone, Calendar, Globe, AlertTriangle, Clock, MapPin } from 'lucide-react';

function parseDateString(dateStr: string): Date {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        if (parts[0].length === 4) {
            // YYYY-MM-DD
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else if (parts[2].length === 4) {
            // DD-MM-YYYY
            return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
    }
    return new Date(dateStr);
}

function monthsBetween(futureDate: Date, currentDate: Date) {
    return (
        (futureDate.getFullYear() - currentDate.getFullYear()) * 12 +
        (futureDate.getMonth() - currentDate.getMonth())
    );
}

export default function ProfilePage() {
    const { user, language, milestoneInfo, loading } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [ageAlert, setAgeAlert] = useState<{ age: number; date: string; riskLevel: string } | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        const fetchBookings = async () => {
            const { data } = await supabase
                .from('bookings')
                .select('*, slots(*, centers(*))')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            setBookings(data || []);
            setLoadingBookings(false);
        };
        fetchBookings();
    }, [user]);

    useEffect(() => {
        if (!user || !user.date_of_birth) return;

        // console.log("DOB String from DB:", user.date_of_birth);

        const dob = parseDateString(user.date_of_birth);
        const today = new Date();

        // Specifically calculate for Age 15
        const milestoneAge = 15;
        const milestoneDate = new Date(dob.getFullYear() + milestoneAge, dob.getMonth(), dob.getDate());

        const monthsDiff = monthsBetween(milestoneDate, today);
        // console.log("Months Remaining:", monthsDiff);

        let riskLevel = null;
        if (monthsDiff < 0 || monthsDiff <= 1) {
            riskLevel = "high";
        } else if (monthsDiff <= 5) {
            riskLevel = "upcoming";
        }
        console.log("Calculated Risk Level:", riskLevel);

        if (riskLevel) {
            setAgeAlert({
                age: milestoneAge,
                date: milestoneDate.toDateString(),
                riskLevel: riskLevel
            });
        }
    }, [user]);

    if (loading || !user) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <span className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></span>
        </div>
    );

    // Mask Aadhaar: show only last 4 digits
    const maskedAadhaar = user.aadhaar_number
        ? `XXXX-XXXX-${user.aadhaar_number.slice(-4)}`
        : '----';

    const langNames: Record<string, string> = { en: 'English', hi: 'हिंदी', te: 'తెలుగు' };

    const infoRows = [
        { label: t(language, 'profile_name'), value: user.name, icon: <span>👤</span> },
        { label: t(language, 'profile_aadhaar'), value: maskedAadhaar, icon: <Fingerprint size={16} /> },
        { label: t(language, 'profile_email'), value: user.email, icon: <Mail size={16} /> },
        { label: t(language, 'profile_mobile'), value: user.mobile || user.phone || '—', icon: <Phone size={16} /> },
        { label: t(language, 'profile_dob'), value: user.date_of_birth, icon: <Calendar size={16} /> },
        { label: t(language, 'profile_language'), value: langNames[user.preferred_language || 'en'], icon: <Globe size={16} /> },
    ];

    return (
        <>
            <Navbar />
            <div className="page-container fade-in-up">
                <div className="page-header">
                    <h1 className="page-title">{t(language, 'profile_title')}</h1>
                    <p className="page-subtitle">Your Aadhaar account information</p>
                </div>

                {/* Milestone Alert */}
                {milestoneInfo && (
                    <div className="alert-warning" style={{ marginBottom: '24px' }}>
                        <div><AlertTriangle size={20} color="#f59e0b" /></div>
                        <div>
                            <div style={{ fontWeight: '700', color: '#fbbf24', marginBottom: '4px' }}>
                                {t(language, 'milestone_alert')}
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                {getMilestoneMessage(milestoneInfo)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Risk-Based Update Alert System */}
                {ageAlert && ageAlert.riskLevel === "high" && (
                    <div style={{
                        backgroundColor: "#ffebee",
                        border: "2px solid #d32f2f",
                        color: "#b71c1c",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        fontWeight: "bold"
                    }}>
                        🔴 HIGH RISK: Biometric & Face Authentication Update Required Immediately.

                        <br /><br />
                        You turn {ageAlert.age} on {ageAlert.date}.<br />
                        Please book your biometric update appointment.
                    </div>
                )}
                {ageAlert && ageAlert.riskLevel === "upcoming" && (
                    <div style={{
                        backgroundColor: "#fff8e1",
                        border: "2px solid #fbc02d",
                        color: "#f57f17",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        fontWeight: "bold"
                    }}>
                        ⚠️ Upcoming Biometric Update

                        <br /><br />
                        You will turn {ageAlert.age} on {ageAlert.date}.<br />
                        Please book your biometric update appointment soon.
                    </div>
                )}

                <div className="grid-2" style={{ alignItems: 'start' }}>
                    {/* Profile Info */}
                    <div>
                        {/* Avatar + Name Header */}
                        <div className="profile-header">
                            <div className="profile-avatar">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{user.name}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Aadhaar Card Holder</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Member since {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        {/* Info Rows */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '8px 24px' }}>
                            {infoRows.map(row => (
                                <div key={row.label} className="profile-info-row">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                        {row.icon}
                                        {row.label}
                                    </div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px', maxWidth: '55%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {row.value || '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bookings */}
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
                            {t(language, 'profile_bookings')}
                        </h2>

                        {loadingBookings ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <span className="spinner" style={{ width: '28px', height: '28px' }}></span>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t(language, 'no_active_bookings')}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {bookings.map(b => (
                                    <div key={b.id} style={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '14px',
                                        padding: '16px',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', flex: 1, marginRight: '8px' }}>
                                                {b.slots?.centers?.center_name || 'Aadhaar Center'}
                                            </div>
                                            <span className={`badge badge-${b.status.toLowerCase()}`} style={{ whiteSpace: 'nowrap' }}>{b.status}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={11} /> {b.slots?.date}
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={11} /> {b.slots?.time}
                                            </span>
                                            {b.booking_type === 'Age Milestone' && (
                                                <span className="badge badge-milestone" style={{ fontSize: '11px', padding: '2px 8px' }}>Milestone</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <AiAssistant />
        </>
    );
}
