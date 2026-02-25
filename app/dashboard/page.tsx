'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/lib/translations';
import { supabase, Booking } from '@/lib/supabase';
import { getMilestoneMessage } from '@/lib/age-milestone';
import Navbar from '@/components/Navbar';
import AiAssistant from '@/components/AiAssistant';
import { CalendarPlus, User, ListChecks, AlertTriangle, Calendar, Clock, MapPin, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import OnlineUpdates from '@/components/OnlineUpdates';

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



export default function DashboardPage() {
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
                .in('status', ['Booked', 'Confirmed'])
                .order('created_at', { ascending: false })
                .limit(3);
            setBookings(data || []);
            setLoadingBookings(false);
        };
        fetchBookings();
    }, [user]);

    useEffect(() => {
        if (!user || !user.date_of_birth) return;

        console.log("DOB String from user object:", user.date_of_birth);

        const dob = parseDateString(user.date_of_birth);
        const today = new Date();

        // Specifically calculate for Age 15
        const milestoneAge = 15;
        const milestoneDate = new Date(dob.getFullYear() + milestoneAge, dob.getMonth(), dob.getDate());

        const monthsDiff = monthsBetween(milestoneDate, today);
        console.log("Months Remaining:", monthsDiff);

        let riskLevel = null;
        if (monthsDiff < 0 || monthsDiff <= 1) {
            riskLevel = "high";
        } else if (monthsDiff <= 5) {
            riskLevel = "upcoming";
        }

        if (riskLevel) {
            setAgeAlert({
                age: milestoneAge,
                date: milestoneDate.toDateString(),
                riskLevel: riskLevel
            });
        }
    }, [user]);

    if (loading || !user) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
            <span className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px', borderColor: 'rgba(59,130,246,0.3)', borderTopColor: '#3b82f6' }}></span>
        </div>
    );

    const maskAadhaar = (aadhaar: string) => `XXXX - XXXX - ${aadhaar.slice(-4)}`;

    return (
        <>
            <Navbar />
            <div className="page-container" style={{ maxWidth: '1000px' }}>

                {/* 3D Digital ID Card Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                    className="glass-card"
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        marginBottom: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '0'
                    }}
                >
                    <div style={{ height: '100px', background: 'var(--gradient-1)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '20px', right: '24px', opacity: 0.2 }}>
                            <ShieldCheck size={100} />
                        </div>
                    </div>
                    <div style={{ padding: '0 32px 32px', position: 'relative' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '24px',
                            background: 'var(--bg-card)',
                            border: '4px solid var(--bg)',
                            marginTop: '-40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '36px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                            overflow: 'hidden'
                        }}>
                            {user.face_image_url ? (
                                <img src={user.face_image_url} alt="User Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span>👤</span>
                            )}
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {user.name}
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
                                        <ShieldCheck size={14} /> Verified ID
                                    </span>
                                </h1>
                                <p style={{ color: 'var(--accent)', fontSize: '18px', fontWeight: '600', letterSpacing: '2px', fontFamily: 'monospace' }}>
                                    {maskAadhaar(user.aadhaar_number)}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Date of Birth</div>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.date_of_birth}</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Age-Based Update Alert System */}
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

                {/* AI Milestone Alert - Glowing Highlight Phase */}
                {milestoneInfo && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card"
                        style={{
                            marginBottom: '32px',
                            padding: '24px',
                            border: '1px solid rgba(22, 163, 74, 0.4)',
                            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Glow effect */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--success)', boxShadow: '0 0 20px #10b981' }} />

                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            <div style={{ background: 'rgba(16,185,129,0.2)', padding: '16px', borderRadius: '16px', color: '#10b981' }}>
                                <AlertTriangle size={28} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '800', color: '#34d399', marginBottom: '8px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="badge badge-ai" style={{ background: 'transparent', padding: 0, border: 'none', animation: 'none' }}>✨ AI Recommended</span>
                                    {t(language, 'milestone_alert')}
                                </div>
                                <div style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.5', marginBottom: '16px' }}>
                                    {getMilestoneMessage(milestoneInfo)}. {t(language, 'milestone_auto_booked')}
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Link href="/booking">
                                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-success" style={{ padding: '10px 24px', fontWeight: '600', border: 'none', background: '#10b981', color: '#022c22' }}>
                                            {t(language, 'confirm')}
                                        </motion.button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="grid-2" style={{ gap: '32px' }}>

                    {/* Left Column: Quick Actions */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
                            Quick Actions
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { icon: <CalendarPlus size={22} />, label: t(language, 'quick_book'), desc: "Schedule a new center visit", href: '/booking', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
                                { icon: <ListChecks size={22} />, label: t(language, 'track_bookings'), desc: "View appointment statuses", href: '/tracking', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
                                { icon: <User size={22} />, label: t(language, 'view_profile'), desc: "Update your linked data", href: '/profile', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)' },
                            ].map((card, i) => (
                                <Link key={i} href={card.href} style={{ textDecoration: 'none' }}>
                                    <motion.div
                                        whileHover={{ x: 8, backgroundColor: 'rgba(30,41,59,0.9)' }}
                                        className="glass-panel"
                                        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer', transition: 'background 0.3s' }}
                                    >
                                        <div style={{ background: card.bg, color: card.color, padding: '12px', borderRadius: '12px' }}>
                                            {card.icon}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '15px' }}>{card.label}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{card.desc}</div>
                                        </div>
                                        <div style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Column: Upcoming Bookings */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
                            {t(language, 'upcoming_appointments')}
                        </h2>

                        {loadingBookings ? (
                            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                <span className="spinner" style={{ width: '28px', height: '28px', borderColor: 'rgba(59,130,246,0.3)', borderTopColor: '#3b82f6' }}></span>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.3))' }}>📅</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>{t(language, 'no_bookings')}</p>
                                <Link href="/booking" style={{ textDecoration: 'none', width: '100%' }}>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary" style={{ width: '100%' }}>
                                        {t(language, 'quick_book')}
                                    </motion.button>
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {bookings.map(b => (
                                    <motion.div
                                        whileHover={{ y: -4, boxShadow: '0 15px 30px -10px rgba(0,0,0,0.5)' }}
                                        key={b.id}
                                        className="glass-panel"
                                        style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span>
                                            {b.booking_type === 'Age Milestone' && <span className="badge badge-milestone" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>✨ Milestone</span>}
                                        </div>

                                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '16px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                            <MapPin size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            {(b as any).slots?.centers?.center_name || 'Aadhaar Center'}
                                        </div>

                                        <div style={{ display: 'flex', gap: '24px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ background: 'rgba(34,211,238,0.15)', padding: '8px', borderRadius: '10px' }}><Calendar size={16} color="#22d3ee" /></div>
                                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{(b as any).slots?.date}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ background: 'rgba(139,92,246,0.15)', padding: '8px', borderRadius: '10px' }}><Clock size={16} color="#8b5cf6" /></div>
                                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{(b as any).slots?.time}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Online Updates Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <OnlineUpdates user={user} />
                </motion.div>
            </div>
            <AiAssistant />
        </>
    );
}
