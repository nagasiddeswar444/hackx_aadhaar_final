'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/lib/translations';
import { supabase, Booking } from '@/lib/supabase';
import { formatDate, formatTime } from '@/lib/ai-recommendation';
import Navbar from '@/components/Navbar';
import AiAssistant from '@/components/AiAssistant';
import { MapPin, Calendar, Clock, CheckCircle, Circle, XCircle } from 'lucide-react';

const STEPS = ['Booked', 'Confirmed', 'Completed'];

function ProgressBar({ status }: { status: string }) {
    const stepIndex = STEPS.indexOf(status);
    const isCancelled = status === 'Cancelled';

    return (
        <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 4px' }}>
            {STEPS.map((step, i) => {
                const isCompleted = !isCancelled && i < stepIndex;
                const isActive = !isCancelled && i === stepIndex;
                return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 1,
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '2px solid',
                                borderColor: isCancelled ? '#374151' : isCompleted ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--border)',
                                background: isCancelled ? 'transparent' : isCompleted ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--bg-card)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isCompleted || isActive ? 'white' : 'var(--text-muted)',
                                fontSize: '12px',
                                fontWeight: '700',
                                boxShadow: isActive ? '0 0 16px rgba(26,86,219,0.5)' : 'none',
                                transition: 'all 0.3s',
                            }}>
                                {isCompleted ? <CheckCircle size={14} /> : i + 1}
                            </div>
                            <div style={{
                                marginTop: '6px',
                                fontSize: '11px',
                                color: isCancelled ? 'var(--text-muted)' : isCompleted || isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontWeight: isActive ? '600' : '400',
                                whiteSpace: 'nowrap',
                            }}>{step}</div>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div style={{
                                flex: 1,
                                height: '2px',
                                background: !isCancelled && i < stepIndex ? 'var(--success)' : 'var(--border)',
                                margin: '0 4px',
                                marginBottom: '22px',
                                transition: 'background 0.5s',
                            }}></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function TrackingPage() {
    const { user, language, loading } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    const fetchBookings = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('bookings')
            .select('*, slots(*, centers(*))')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        setBookings(data || []);
        setLoadingBookings(false);
    };

    useEffect(() => {
        fetchBookings();
    }, [user]);

    const handleCancel = async (bookingId: string) => {
        setCancellingId(bookingId);
        await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', bookingId);
        await fetchBookings();
        setCancellingId(null);
    };

    if (loading || !user) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <span className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></span>
        </div>
    );

    const activeBookings = bookings.filter(b => b.status !== 'Cancelled');
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled');

    return (
        <>
            <Navbar />
            <div className="page-container fade-in-up">
                <div className="page-header">
                    <h1 className="page-title">{t(language, 'tracking_title')}</h1>
                    <p className="page-subtitle">{t(language, 'tracking_subtitle')}</p>
                </div>

                {loadingBookings ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        <span className="spinner" style={{ width: '32px', height: '32px' }}></span>
                    </div>
                ) : bookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                        <h3 style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>No Bookings Yet</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{t(language, 'no_active_bookings')}</p>
                        <button onClick={() => router.push('/booking')} className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>
                            {t(language, 'quick_book')}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Active Bookings */}
                        {activeBookings.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Active Bookings ({activeBookings.length})
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {activeBookings.map(b => (
                                        <div key={b.id} style={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            position: 'relative',
                                        }}>
                                            {b.booking_type === 'Age Milestone' && (
                                                <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                                                    <span className="badge badge-milestone">🎯 Milestone</span>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                                                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(26,86,219,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                                                    📍
                                                </div>
                                                <div style={{ flex: 1, paddingRight: b.booking_type === 'Age Milestone' ? '100px' : '0' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                                                        {b.slots?.centers?.center_name || 'Aadhaar Center'}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <Calendar size={13} /> {b.slots?.date ? formatDate(b.slots.date) : '—'}
                                                        </span>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <Clock size={13} /> {b.slots?.time ? formatTime(b.slots.time) : '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <ProgressBar status={b.status} />

                                            {b.status !== 'Completed' && (
                                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn-danger"
                                                        onClick={() => handleCancel(b.id)}
                                                        disabled={cancellingId === b.id}
                                                    >
                                                        {cancellingId === b.id ? <span className="spinner" style={{ width: '14px', height: '14px' }}></span> : <><XCircle size={13} style={{ marginRight: '5px' }} />{t(language, 'cancel_booking')}</>}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cancelled Bookings */}
                        {cancelledBookings.length > 0 && (
                            <div>
                                <h2 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Cancelled ({cancelledBookings.length})
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {cancelledBookings.map(b => (
                                        <div key={b.id} style={{
                                            background: 'rgba(30,41,59,0.5)',
                                            border: '1px solid rgba(148,163,184,0.1)',
                                            borderRadius: '12px',
                                            padding: '16px 20px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            opacity: 0.7,
                                            flexWrap: 'wrap',
                                            gap: '8px',
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>{b.slots?.centers?.center_name || 'Aadhaar Center'}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.slots?.date} • {b.slots?.time}</div>
                                            </div>
                                            <span className="badge badge-cancelled">{t(language, 'status_cancelled')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <AiAssistant />
        </>
    );
}
