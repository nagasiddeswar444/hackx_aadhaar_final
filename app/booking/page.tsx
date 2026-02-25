'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/lib/translations';
import { supabase, Slot, Center } from '@/lib/supabase';
import { recommendSlots, ScoredSlot, formatTime, formatDate } from '@/lib/ai-recommendation';
import { checkAgeMilestone } from '@/lib/age-milestone';
import { euclideanDistance } from '@/lib/face-api';
import FaceScanner from '@/components/FaceScanner';
import Navbar from '@/components/Navbar';
import AiAssistant from '@/components/AiAssistant';
import { QRCodeCanvas } from 'qrcode.react';
import { MapPin, Calendar, Clock, Users, Sparkles, CheckCircle, ChevronRight, AlertCircle, ArrowLeft, RefreshCw, Smartphone, Mail, Home, Fingerprint, UserSquare, CalendarCheck, Download, FileText } from 'lucide-react';

// New Update Types for Step 1
const UPDATE_TYPES = [
    { id: 'name', label: 'Name Correction', icon: <UserSquare size={24} color="#3b82f6" /> },
    { id: 'dob', label: 'Date of Birth Update', icon: <CalendarCheck size={24} color="#ec4899" /> },
    { id: 'gender', label: 'Gender Update', icon: <Users size={24} color="#f59e0b" /> },
    { id: 'mobile', label: 'Mobile Number', icon: <Smartphone size={24} color="#10b981" /> },
    { id: 'email', label: 'Email Address', icon: <Mail size={24} color="#8b5cf6" /> },
    { id: 'address', label: 'Address Update', icon: <Home size={24} color="#ef4444" /> },
    { id: 'biometric', label: 'Biometric Update', icon: <Fingerprint size={24} color="#06b6d4" /> },
];

// Document requirements mapping (Frontend only)
const DOCUMENT_REQUIREMENTS: Record<string, string[]> = {
    'Name Correction': [
        'Original Aadhaar Card',
        'Gazette Notification (if applicable)',
        'Valid Identity Proof (Passport, PAN, Voter ID, etc.)'
    ],
    'Date of Birth Update': [
        'Birth Certificate',
        'SSC Certificate / Marksheet',
        'Passport'
    ],
    'Gender Update': [
        'Self Declaration Form',
        'Aadhaar Copy'
    ],
    'Mobile Number': [
        'No physical documents required (Requires Biometric Authentication)'
    ],
    'Email Address': [
        'No physical documents required (Requires Biometric Authentication)'
    ],
    'Address Update': [
        'Utility Bill (Electricity/Water/Gas) - last 3 months',
        'Bank Statement / Passbook',
        'Rental Agreement / Lease'
    ],
    'Biometric Update': [
        'Original Aadhaar Card'
    ]
};

export default function BookingPage() {
    const { user, language, loading } = useAuth();
    const router = useRouter();

    // Wizard State (Now 1-6 instead of 1-5 due to the new Step 1)
    const [step, setStep] = useState<number>(1);

    // Data State
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [slots, setSlots] = useState<ScoredSlot[]>([]);

    // Selection State
    const [selectedUpdateType, setSelectedUpdateType] = useState<string>(''); // NEW
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<ScoredSlot | null>(null);

    // UI State
    const [loadingData, setLoadingData] = useState(false);
    const [bookingInProgress, setBookingInProgress] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [faceVerified, setFaceVerified] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState<any>(null); // NEW: Store inserted row

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    // Initialize Step 2: generating next 3 dates
    useEffect(() => {
        const dates: string[] = [];
        const today = new Date();
        for (let i = 0; i < 3; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        setAvailableDates(dates);
    }, []);

    // Fetch Centers when moving to step 3
    useEffect(() => {
        if (step === 3 && centers.length === 0) {
            setLoadingData(true);
            supabase.from('centers').select('*').then(({ data }) => {
                if (data) setCenters(data as Center[]);
                setLoadingData(false);
            });
        }
    }, [step, centers.length]);

    // Fetch Slots when moving to step 4
    useEffect(() => {
        if (step === 4 && selectedCenter && selectedDate) {
            setLoadingData(true);
            setSlots([]);
            supabase.from('slots')
                .select('*, centers(*)')
                .eq('center_id', selectedCenter.id)
                .eq('date', selectedDate)
                .order('time', { ascending: true })
                .then(({ data }) => {
                    if (data && data.length > 0) {
                        const scored = recommendSlots(data as Slot[]);
                        setSlots(scored);
                    }
                    setLoadingData(false);
                });
        }
    }, [step, selectedCenter, selectedDate]);

    // Validate Step 1 progression
    const handleProceedFromStep1 = () => {
        if (!selectedUpdateType) {
            setError('Please select an update type to continue');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleFaceCapture = (data: { imageBase64: string, descriptor: number[], allDescriptors?: number[][] }) => {
        if (!user) return;

        setError('');
        if (!user.face_descriptor) {
            setError('No face registered for this account. Please update your profile first.');
            return;
        }

        let storedDescArr: number[];
        if (typeof user.face_descriptor === 'string') {
            try {
                storedDescArr = JSON.parse(user.face_descriptor);
            } catch (e) {
                setError('Stored face descriptor corrupted.');
                return;
            }
        } else {
            storedDescArr = user.face_descriptor;
        }

        if (!storedDescArr || storedDescArr.length !== 128) {
            setError('Stored face descriptor corrupted.');
            return;
        }

        const storedFloat = new Float32Array(storedDescArr);

        const liveDescriptors = data.allDescriptors || [data.descriptor];
        let totalDistance = 0;
        let validFrames = 0;

        for (const liveDescArr of liveDescriptors) {
            if (!liveDescArr || liveDescArr.length !== 128) continue;
            const liveFloat = new Float32Array(liveDescArr);
            totalDistance += euclideanDistance(liveFloat, storedFloat);
            validFrames++;
        }

        if (validFrames === 0) {
            setError('Live face descriptor invalid.');
            return;
        }

        const avgDistance = totalDistance / validFrames;
        const confidenceVal = (1 - avgDistance).toFixed(2);
        const displayConf = Math.round(parseFloat(confidenceVal) * 100);

        if (avgDistance < 0.45) {
            setFaceVerified(true);
            setSuccess(`Face Verified Successfully (Match Confidence: ${displayConf}%)`);
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(`Face Verification Failed. (Match Confidence: ${displayConf}%)`);
        }
    };

    const handleConfirmBooking = async () => {
        if (!user || !selectedSlot || !selectedUpdateType) return;
        setError('');
        setBookingInProgress(true);

        const dob = user.date_of_birth;
        const milestone = dob ? checkAgeMilestone(dob) : null;
        const bookingType = milestone ? 'Age Milestone' : 'Normal';

        try {
            // Check existing active booking for this slot
            const { data: existing } = await supabase
                .from('bookings')
                .select('id')
                .eq('user_id', user.id)
                .eq('slot_id', selectedSlot.id)
                .in('status', ['Booked', 'Confirmed'])
                .limit(1);

            if (existing && existing.length > 0) {
                setError('You have already booked this slot.');
                setBookingInProgress(false);
                return;
            }

            // Standard Insert Body
            const insertPayload: any = {
                user_id: user.id,
                slot_id: selectedSlot.id,
                status: 'Booked',
                booking_type: bookingType,
                update_type: selectedUpdateType // Included for the new feature spec
            };

            // Attempt to insert with `update_type`. Supabase will throw a specific error if the column doesn't exist
            const { data: insertedBooking, error: bookErr } = await supabase
                .from('bookings')
                .insert(insertPayload)
                .select()
                .single();

            if (bookErr) {
                if (bookErr.message.includes('update_type')) {
                    throw new Error("update_type column required in bookings table. Please add it to your Supabase schema to complete this booking.");
                }
                throw bookErr;
            }

            // Increment booked count
            await supabase.from('slots')
                .update({ booked_count: selectedSlot.booked_count + 1 })
                .eq('id', selectedSlot.id);

            setConfirmedBooking(insertedBooking);
            setSuccess('Booking confirmed successfully!');
            setStep(6); // Success step

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Booking failed.');
        }
        setBookingInProgress(false);
    };

    if (loading || !user) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <span className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></span>
        </div>
    );

    return (
        <>
            <Navbar />
            <div className="page-container fade-in-up" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>

                {step < 6 && (
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h1 className="page-title" style={{ margin: 0 }}>{t(language, 'booking_title')}</h1>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)', background: 'var(--primary-light)', padding: '6px 12px', borderRadius: '12px' }}>
                                Step {step} of 5
                            </div>
                        </div>
                        {error && <div className="alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

                        {/* Progress Bar */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <div key={s} style={{
                                    flex: 1,
                                    height: '4px',
                                    borderRadius: '2px',
                                    background: s <= step ? 'var(--primary)' : 'var(--border)',
                                    transition: 'all 0.3s ease'
                                }} />
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 1: Select Update Type (NEW) */}
                {step === 1 && (
                    <div className="fade-in-up">
                        <h2 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>Select Update Type</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>What do you need an appointment for?</p>

                        <div className="grid-3" style={{ gap: '16px', marginBottom: '24px' }}>
                            {UPDATE_TYPES.map((type) => (
                                <div
                                    key={type.id}
                                    onClick={() => { setSelectedUpdateType(type.label); setError(''); }}
                                    style={{
                                        padding: '20px',
                                        background: selectedUpdateType === type.label ? 'rgba(59, 130, 246, 0.05)' : 'var(--surface)',
                                        border: selectedUpdateType === type.label ? '2px solid var(--primary)' : '1px solid var(--border)',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px',
                                        boxShadow: selectedUpdateType === type.label ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none'
                                    }}
                                    className="hover-lift"
                                >
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '50%' }}>
                                        {type.icon}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {type.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', padding: '16px', fontSize: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}
                            onClick={handleProceedFromStep1}
                        >
                            Continue <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {/* STEP 2: Select Date (Previously Step 1) */}
                {step === 2 && (
                    <div className="fade-in-up">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <ArrowLeft size={18} color="var(--text-secondary)" />
                            </button>
                            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>Select a Date</h2>
                        </div>

                        <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={16} color="var(--primary)" />
                            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Reason: <strong style={{ color: 'var(--text-primary)' }}>{selectedUpdateType}</strong></span>
                        </div>

                        <div className="grid-3" style={{ gap: '16px' }}>
                            {availableDates.map((date, idx) => (
                                <button
                                    key={date}
                                    onClick={() => { setSelectedDate(date); setStep(3); }}
                                    style={{
                                        padding: '24px',
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        width: '100%'
                                    }}
                                    className="hover-lift"
                                >
                                    <Calendar size={28} color="var(--primary)" />
                                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {formatDate(date)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : ''}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: Select Center (Previously Step 2) */}
                {step === 3 && (
                    <div className="fade-in-up">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <ArrowLeft size={18} color="var(--text-secondary)" />
                            </button>
                            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>Select a Center</h2>
                        </div>

                        {loadingData ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner"></span></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {centers.map((center, idx) => {
                                    // Mock distance for UI realism
                                    const distance = (2.4 + (idx * 3.1)).toFixed(1);

                                    return (
                                        <div
                                            key={center.id}
                                            onClick={() => { setSelectedCenter(center); setStep(4); }}
                                            style={{
                                                padding: '20px',
                                                background: 'var(--surface)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.2s ease'
                                            }}
                                            className="hover-border-primary"
                                        >
                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <MapPin size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{center.center_name}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{center.address}</div>
                                                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: '500' }}>
                                                        <span style={{ color: 'var(--primary)' }}>{distance} km away</span>
                                                        <span style={{ color: 'var(--success)' }}>Slots available</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight color="var(--border)" />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: Select Time Slot (Previously Step 3) */}
                {step === 4 && (
                    <div className="fade-in-up">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <ArrowLeft size={18} color="var(--text-secondary)" />
                            </button>
                            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>Select a Time Slot</h2>
                        </div>

                        {/* AI Banner */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(26,86,219,0.1) 0%, rgba(124,58,237,0.1) 100%)',
                            border: '1px solid rgba(129,140,248,0.3)',
                            borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px'
                        }}>
                            <Sparkles size={20} style={{ color: '#818cf8', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontWeight: '600', color: '#a5b4fc', fontSize: '14px', marginBottom: '2px' }}>AI Slot Optimization</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Slots are analyzed based on historical crowding and off-peak hours.
                                </div>
                            </div>
                        </div>

                        {loadingData ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner"></span></div>
                        ) : slots.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <AlertCircle size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                                <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-secondary)' }}>No slots available for this date.</div>
                                <button className="btn-secondary" style={{ marginTop: '16px' }} onClick={() => setStep(2)}>Choose another date</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {slots.map(slot => {
                                    const avail = slot.capacity - slot.booked_count;
                                    return (
                                        <div
                                            key={slot.id}
                                            onClick={() => { setSelectedSlot(slot); setStep(5); }}
                                            className={`slot-card ${slot.isRecommended ? 'recommended' : ''}`}
                                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    {slot.isRecommended && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                            <span className="badge badge-ai"><Sparkles size={11} /> {t(language, 'ai_recommended')}</span>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{slot.reason}</span>
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                                        {formatTime(slot.time)}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Users size={14} /> <span style={{ color: avail > 5 ? 'var(--success)' : 'var(--warning)', fontWeight: '600' }}>{avail}</span> {t(language, 'available')}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={14} /> Est. wait: {slot.estimatedWaitTime} mins
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight color="var(--border)" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 5: Confirm Booking (Previously Step 4) */}
                {step === 5 && selectedSlot && selectedCenter && (
                    <div className="fade-in-up">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <button onClick={() => setStep(4)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <ArrowLeft size={18} color="var(--text-secondary)" />
                            </button>
                            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>Confirm Booking</h2>
                        </div>

                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
                            {success && <div className="alert-success" style={{ margin: '16px' }}>{success}</div>}

                            {!faceVerified ? (
                                <div style={{ padding: '24px', textAlign: 'center' }}>
                                    <AlertCircle size={32} color="var(--warning)" style={{ marginBottom: '12px' }} />
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Security Check</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                                        Please verify your identity via webcam to proceed with booking.
                                    </p>
                                    <FaceScanner
                                        onCapture={handleFaceCapture}
                                        onError={(err) => setError(err)}
                                        buttonText="Verify Identity"
                                        captureMultiple={true}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-50)' }}>
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Appointment at</div>
                                                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>{selectedCenter.center_name}</div>
                                                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{selectedCenter.address}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                    {selectedUpdateType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed var(--border)' }}>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Date</div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatDate(selectedDate)}</div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed var(--border)' }}>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Time</div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatTime(selectedSlot.time)}</div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed var(--border)' }}>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Estimated Wait</div>
                                            <div style={{ fontWeight: '600', color: 'var(--warning)' }}>~{selectedSlot.estimatedWaitTime} mins</div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Applicant</div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {faceVerified && (
                            <button
                                className="btn-primary"
                                style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                                onClick={handleConfirmBooking}
                                disabled={bookingInProgress}
                            >
                                {bookingInProgress ? <><span className="spinner"></span> Confirming...</> : 'Confirm Appointment'}
                            </button>
                        )}
                    </div>
                )}

                {/* STEP 6: Success (Previously Step 5) */}
                {step === 6 && (
                    <div className="fade-in-up" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(52, 211, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <CheckCircle size={40} color="#34d399" />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>Booking Confirmed!</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px' }}>
                            Your Aadhaar {selectedUpdateType} service slot has been successfully scheduled.
                        </p>

                        {confirmedBooking && selectedCenter && selectedSlot && (
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', marginBottom: '32px', display: 'inline-block' }}>
                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    <QRCodeCanvas
                                        id="booking-qr-code"
                                        value={JSON.stringify({
                                            bookingId: confirmedBooking.id,
                                            userId: confirmedBooking.user_id,
                                            updateType: confirmedBooking.update_type,
                                            center: selectedCenter.center_name,
                                            date: selectedDate,
                                            time: selectedSlot.time
                                        })}
                                        size={220}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px', margin: '0 auto' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        onClick={() => {
                                            const canvas = document.getElementById('booking-qr-code') as HTMLCanvasElement;
                                            if (canvas) {
                                                const url = canvas.toDataURL('image/png');
                                                const link = document.createElement('a');
                                                link.download = `Booking-${confirmedBooking.id}.png`;
                                                link.href = url;
                                                link.click();
                                            }
                                        }}
                                    >
                                        <Download size={18} /> Download QR Code
                                    </button>

                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`Aadhaar Appointment Confirmation\n\nBooking ID: ${confirmedBooking.id}\nUpdate Type: ${confirmedBooking.update_type}\nCenter: ${selectedCenter.center_name}\nDate: ${formatDate(selectedDate)}\nTime: ${formatTime(selectedSlot.time)}\n\nPlease bring this QR code to the center.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary"
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', color: '#fff', border: 'none' }}
                                    >
                                        <Smartphone size={18} /> Share via WhatsApp
                                    </a>
                                </div>
                            </div>
                        )}

                        {confirmedBooking && DOCUMENT_REQUIREMENTS[confirmedBooking.update_type] && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '32px', textAlign: 'left', maxWidth: '400px', margin: '0 auto 32px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={18} color="var(--primary)" />
                                    Documents Required for This Service
                                </h3>
                                <ul style={{ listStyleType: 'disc', paddingLeft: '24px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {DOCUMENT_REQUIREMENTS[confirmedBooking.update_type].map((doc, idx) => (
                                        <li key={idx}>{doc}</li>
                                    ))}
                                </ul>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#d97706', fontSize: '13px', fontWeight: '500' }}>
                                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                    Please carry original documents to the Aadhaar Service Center.
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <button className="btn-secondary" onClick={() => router.push('/dashboard')}>Dashboard</button>
                            <button className="btn-primary" onClick={() => router.push('/tracking')}>Track Booking</button>
                        </div>
                    </div>
                )}

            </div>
            <AiAssistant />
        </>
    );
}
