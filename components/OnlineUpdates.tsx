'use client';

import React, { useState, useEffect } from 'react';
import { supabase, User } from '@/lib/supabase';
import { Phone, Mail, Home, CheckCircle, AlertCircle, X, Clock, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FaceScanner from '@/components/FaceScanner';
import { euclideanDistance } from '@/lib/face-api';

const UPDATE_STEPS = [
    { id: 'submitted', label: 'Submitted' },
    { id: 'center_verified', label: 'Center Verification' },
    { id: 'vro_verified', label: 'VRO Verification' },
    { id: 'mro_verified', label: 'MRO Approval' },
    { id: 'approved', label: 'Final Approval' }
];

function UpdateProgressBar({ status }: { status: string }) {
    // Map 'pending' from legacy requests to 'submitted'
    const normalizedStatus = status === 'pending' ? 'submitted' : status;
    const isRejected = normalizedStatus === 'rejected';

    let currentStepIndex = UPDATE_STEPS.findIndex(s => s.id === normalizedStatus);

    // If approved, jump to end
    if (normalizedStatus === 'approved') currentStepIndex = UPDATE_STEPS.length - 1;

    return (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '12px' }}>
            {UPDATE_STEPS.map((step, i) => {
                const isCompleted = !isRejected && i < currentStepIndex;
                const isActive = !isRejected && i === currentStepIndex;

                let ringColor = 'var(--border)';
                let bgColor = 'var(--bg-card)';
                let textColor = 'var(--text-muted)';
                let weight = '400';

                if (isRejected) {
                    if (i === currentStepIndex || (currentStepIndex === -1 && i === 0)) {
                        ringColor = '#ef4444'; // Red
                        bgColor = '#ef4444';
                        textColor = '#ef4444';
                        weight = '600';
                    }
                } else if (isCompleted || normalizedStatus === 'approved') {
                    ringColor = '#10b981'; // Green
                    bgColor = '#10b981';
                    textColor = 'var(--text-primary)';
                } else if (isActive) {
                    ringColor = '#3b82f6'; // Blue
                    bgColor = 'var(--bg-card)';
                    textColor = '#3b82f6';
                    weight = '600';
                }

                return (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < UPDATE_STEPS.length - 1 ? 1 : 0, minWidth: '80px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                border: `2px solid ${ringColor}`,
                                background: bgColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: (isCompleted || normalizedStatus === 'approved') ? 'white' : ringColor,
                                fontSize: '11px',
                                fontWeight: '700',
                                boxShadow: isActive ? '0 0 12px rgba(59,130,246,0.3)' : 'none',
                                transition: 'all 0.3s',
                            }}>
                                {(isCompleted || normalizedStatus === 'approved') && !isRejected ? <CheckCircle size={14} color="white" /> : (isRejected && i === currentStepIndex ? <X size={14} color="white" /> : i + 1)}
                            </div>
                            <div style={{
                                marginTop: '6px',
                                fontSize: '11px',
                                color: textColor,
                                fontWeight: weight,
                                whiteSpace: 'nowrap',
                                textAlign: 'center'
                            }}>
                                {isRejected && i === currentStepIndex ? 'Rejected' : step.label}
                            </div>
                        </div>
                        {i < UPDATE_STEPS.length - 1 && (
                            <div style={{
                                flex: 1,
                                height: '2px',
                                background: (!isRejected && (i < currentStepIndex || normalizedStatus === 'approved')) ? '#10b981' : 'var(--border)',
                                margin: '0 4px',
                                marginBottom: '20px',
                                transition: 'background 0.5s',
                            }}></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function OnlineUpdates({ user }: { user: User }) {
    const [activeTab, setActiveTab] = useState<'mobile' | 'email' | 'address' | null>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({}); // NEW: Local status overrides for demo

    const fetchRequests = async () => {
        if (!user?.id) return;
        const { data, error } = await supabase
            .from('update_requests')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setRequests(data);
        }
        setLoadingRequests(false);
    };

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const handleRequestSubmitted = () => {
        setActiveTab(null);
        fetchRequests();
    };

    const handleAdminNextStage = (reqId: string, currentStatus: string) => {
        const normalized = currentStatus === 'pending' ? 'submitted' : currentStatus;
        const currentIndex = UPDATE_STEPS.findIndex(s => s.id === normalized);

        if (currentIndex !== -1 && currentIndex < UPDATE_STEPS.length - 1) {
            const nextStatus = UPDATE_STEPS[currentIndex + 1].id;
            setStatusOverrides(prev => ({ ...prev, [reqId]: nextStatus }));
        }
    };

    const handleAdminReject = (reqId: string) => {
        setStatusOverrides(prev => ({ ...prev, [reqId]: 'rejected' }));
    };

    return (
        <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
                Online Aadhaar Updates
            </h2>
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <UpdateOption
                    icon={<Phone size={24} />}
                    title="Mobile Number"
                    desc="Update linked mobile"
                    color="#3b82f6" bg="rgba(59,130,246,0.1)"
                    onClick={() => setActiveTab('mobile')}
                    active={activeTab === 'mobile'}
                />
                <UpdateOption
                    icon={<Mail size={24} />}
                    title="Email Address"
                    desc="Update linked email"
                    color="#ec4899" bg="rgba(236,72,153,0.1)"
                    onClick={() => setActiveTab('email')}
                    active={activeTab === 'email'}
                />
                <UpdateOption
                    icon={<Home size={24} />}
                    title="Residential Address"
                    desc="Update home address"
                    color="#10b981" bg="rgba(16,185,129,0.1)"
                    onClick={() => setActiveTab('address')}
                    active={activeTab === 'address'}
                />
            </div>

            <AnimatePresence>
                {activeTab === 'mobile' && <UpdateForm type="mobile" user={user} onClose={() => setActiveTab(null)} onSuccess={handleRequestSubmitted} />}
                {activeTab === 'email' && <UpdateForm type="email" user={user} onClose={() => setActiveTab(null)} onSuccess={handleRequestSubmitted} />}
                {activeTab === 'address' && <AddressUpdateForm user={user} onClose={() => setActiveTab(null)} onSuccess={handleRequestSubmitted} />}
            </AnimatePresence>

            {/* Tracking Section */}
            <div style={{ marginTop: '40px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} color="var(--primary)" />
                    My Update Requests
                </h2>

                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    {loadingRequests ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <span className="spinner" style={{ width: '24px', height: '24px' }}></span>
                        </div>
                    ) : requests.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <p>No update requests found.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '16px', fontWeight: '600', fontSize: '13px', color: 'var(--text-secondary)' }}>Update Type</th>
                                        <th style={{ padding: '16px', fontWeight: '600', fontSize: '13px', color: 'var(--text-secondary)' }}>New Value</th>
                                        <th style={{ padding: '16px', fontWeight: '600', fontSize: '13px', color: 'var(--text-secondary)' }}>Status</th>
                                        <th style={{ padding: '16px', fontWeight: '600', fontSize: '13px', color: 'var(--text-secondary)' }}>Requested Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((req) => (
                                        <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '16px', color: 'var(--text-primary)', textTransform: 'capitalize', fontWeight: '500' }}>
                                                {req.type}
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {req.new_value}
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                                {new Date(req.created_at).toLocaleDateString('en-IN', {
                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Detailed Tracking Workflow Section */}
                            <div style={{ padding: '0 16px', marginTop: '16px' }}>
                                {requests.map((req, index) => {
                                    const displayStatus = statusOverrides[req.id] || req.status;
                                    const normalizedDisplay = displayStatus === 'pending' ? 'submitted' : displayStatus;

                                    return (
                                        <div key={`tracker-${req.id}`} style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '12px',
                                            padding: '24px',
                                            marginBottom: index === requests.length - 1 ? '16px' : '16px',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ fontWeight: '600', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                                    {req.type} Update
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '8px' }}>
                                                        ({new Date(req.created_at).toLocaleDateString()})
                                                    </span>
                                                </div>
                                                <span className={`badge badge-${normalizedDisplay.toLowerCase()}`} style={{ height: 'fit-content' }}>
                                                    {normalizedDisplay === 'submitted' ? 'Submitted' : normalizedDisplay.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <UpdateProgressBar status={displayStatus} />

                                            {/* Admin Demo Mode Console */}
                                            {user?.role === 'admin' && (
                                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                                                        Admin Demo Mode Simulation Tools (Frontend Only)
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <button
                                                            onClick={() => handleAdminNextStage(req.id, displayStatus)}
                                                            disabled={normalizedDisplay === 'approved' || normalizedDisplay === 'rejected'}
                                                            className="btn-primary"
                                                            style={{ padding: '6px 12px', fontSize: '12px', opacity: (normalizedDisplay === 'approved' || normalizedDisplay === 'rejected') ? 0.5 : 1 }}
                                                        >
                                                            Next Stage
                                                        </button>
                                                        <button
                                                            onClick={() => handleAdminReject(req.id)}
                                                            disabled={normalizedDisplay === 'approved' || normalizedDisplay === 'rejected'}
                                                            className="btn-danger"
                                                            style={{ padding: '6px 12px', fontSize: '12px', opacity: (normalizedDisplay === 'approved' || normalizedDisplay === 'rejected') ? 0.5 : 1 }}
                                                        >
                                                            Reject
                                                        </button>

                                                        {statusOverrides[req.id] && (
                                                            <button
                                                                onClick={() => {
                                                                    const newOverrides = { ...statusOverrides };
                                                                    delete newOverrides[req.id];
                                                                    setStatusOverrides(newOverrides);
                                                                }}
                                                                className="btn-secondary"
                                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                                            >
                                                                Reset Demo
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function UpdateOption({ icon, title, desc, color, bg, onClick, active }: any) {
    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: '0 10px 20px -10px rgba(0,0,0,0.5)' }}
            onClick={onClick}
            className="glass-panel"
            style={{
                padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                border: active ? `2px solid ${color}` : '1px solid var(--border)',
                background: active ? bg : 'var(--bg-card)'
            }}
        >
            <div style={{ background: bg, color: color, padding: '16px', borderRadius: '50%', marginBottom: '12px' }}>
                {icon}
            </div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{desc}</div>
        </motion.div>
    );
}

function UpdateForm({ type, user, onClose, onSuccess }: { type: 'mobile' | 'email', user: User, onClose: () => void, onSuccess: () => void }) {
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    const currentValue = type === 'mobile' ? (user.mobile || user.phone) : user.email;
    const label = type === 'mobile' ? 'Mobile Number' : 'Email Address';

    const handlePreSubmit = async () => {
        setError('');
        if (!user.face_descriptor) return setError('Face verification unavailable. No face registered on this account.');
        if (!value) return setError('Please enter a new value');
        if (value === currentValue) return setError('New value cannot be same as existing value');

        setLoading(true);
        try {
            // Check for pending requests
            const { data: pending } = await supabase
                .from('update_requests')
                .select('id')
                .eq('user_id', user.id)
                .eq('type', type)
                .eq('status', 'pending');

            if (pending && pending.length > 0) {
                setLoading(false);
                return setError('You already have a pending request for this update type');
            }

            // Validations pass, show Face Scanner
            setShowScanner(true);
        } catch (err: any) {
            setError(err.message || 'An error occurred while validating.');
        } finally {
            setLoading(false);
        }
    };

    const handleFaceCapture = async (data: { descriptor: number[] }) => {
        setError('');
        setLoading(true);

        try {
            if (!user.face_descriptor) {
                throw new Error("No stored face profile found.");
            }

            const liveDescriptor = new Float32Array(data.descriptor);
            const storedDescriptor = new Float32Array(user.face_descriptor);

            const distance = euclideanDistance(liveDescriptor, storedDescriptor);

            if (distance > 0.5) {
                // Face mismatch
                setShowScanner(false);
                throw new Error("Face verification failed. Request denied.");
            }

            // Face matched, insert request
            const { error: insertErr } = await supabase.from('update_requests').insert({
                user_id: user.id,
                type: type,
                new_value: value,
                status: 'pending' // Reverted to pending due to check constraint
            });

            if (insertErr) throw insertErr;

            setSuccess('Face Verified. Your update request has been submitted successfully.');
            setTimeout(() => {
                onSuccess();
            }, 1500);

        } catch (err: any) {
            setError(err.message || "Face Verification failed.");
            setShowScanner(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div className="glass-panel" style={{ marginTop: '16px', padding: '24px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                    {showScanner ? "Verify Identity" : `Update ${label}`}
                </h3>

                {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}><AlertCircle size={16} />{error}</div>}

                {success ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                        <div style={{ color: '#10b981', fontWeight: '600', fontSize: '18px' }}>Success</div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>{success}</p>
                    </div>
                ) : showScanner ? (
                    <div>
                        <FaceScanner
                            onCapture={handleFaceCapture}
                            onError={(err) => setError(err)}
                            buttonText="Verify Face to Submit"
                        />
                        <button className="btn-secondary" onClick={() => setShowScanner(false)} disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
                            Cancel Verification
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Current {label}</label>
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-muted)' }}>{currentValue || 'Not provided'}</div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>New {label}</label>
                            <input
                                type={type === 'email' ? 'email' : 'text'}
                                className="input-field"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={`Enter new ${label.toLowerCase()}`}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <button className="btn-primary" onClick={handlePreSubmit} disabled={loading || !value} style={{ width: '100%' }}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function AddressUpdateForm({ user, onClose, onSuccess }: { user: User, onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({ house_no: '', street: '', city: '', state: '', pincode: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    const handlePreSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user.face_descriptor) return setError('Face verification unavailable. No face registered on this account.');
        if (!formData.house_no || !formData.street || !formData.city || !formData.state || !formData.pincode) {
            return setError('Please fill all address fields');
        }

        setLoading(true);
        try {
            // Check for pending requests
            const { data: pending } = await supabase
                .from('update_requests')
                .select('id')
                .eq('user_id', user.id)
                .eq('type', 'address')
                .eq('status', 'pending');

            if (pending && pending.length > 0) {
                setLoading(false);
                return setError('You already have a pending request for this update type');
            }

            // Validations pass, show Face Scanner
            setShowScanner(true);
        } catch (err: any) {
            setError(err.message || 'An error occurred while validating.');
        } finally {
            setLoading(false);
        }
    };

    const handleFaceCapture = async (data: { descriptor: number[] }) => {
        setError('');
        setLoading(true);

        try {
            if (!user.face_descriptor) {
                throw new Error("No stored face profile found.");
            }

            const liveDescriptor = new Float32Array(data.descriptor);
            const storedDescriptor = new Float32Array(user.face_descriptor);

            const distance = euclideanDistance(liveDescriptor, storedDescriptor);

            if (distance > 0.5) {
                // Face mismatch
                setShowScanner(false);
                throw new Error("Face verification failed. Request denied.");
            }

            const addressString = `${formData.house_no}, ${formData.street}, ${formData.city}, ${formData.state} - ${formData.pincode}`;

            // Face matched, insert request
            const { error: insertErr } = await supabase.from('update_requests').insert({
                user_id: user.id,
                type: 'address',
                new_value: addressString,
                status: 'pending' // Reverted to pending due to check constraint
            });

            if (insertErr) throw insertErr;

            setSuccess('Face Verified. Your update request has been submitted successfully.');
            setTimeout(() => {
                onSuccess();
            }, 1500);

        } catch (err: any) {
            setError(err.message || "Face Verification failed.");
            setShowScanner(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div className="glass-panel" style={{ marginTop: '16px', padding: '24px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                    {showScanner ? "Verify Identity" : "Update Address"}
                </h3>

                {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}><AlertCircle size={16} />{error}</div>}

                {success ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                        <div style={{ color: '#10b981', fontWeight: '600', fontSize: '18px' }}>Success</div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>{success}</p>
                    </div>
                ) : showScanner ? (
                    <div>
                        <FaceScanner
                            onCapture={handleFaceCapture}
                            onError={(err) => setError(err)}
                            buttonText="Verify Face to Submit"
                        />
                        <button className="btn-secondary" onClick={() => setShowScanner(false)} disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
                            Cancel Verification
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handlePreSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>House/Flat No.</label>
                                <input type="text" className="input-field" value={formData.house_no} onChange={e => setFormData({ ...formData, house_no: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Street/Locality</label>
                                <input type="text" className="input-field" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>City</label>
                                <input type="text" className="input-field" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>State</label>
                                <input type="text" className="input-field" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)' }} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Pincode</label>
                                <input type="text" className="input-field" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)' }} />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>
                )}
            </div>
        </motion.div>
    );
}

