'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/lib/translations';
import { Bot, X, Send, MessageCircle } from 'lucide-react';

interface Message {
    role: 'user' | 'bot';
    text: string;
}

function getResponse(input: string, lang: string): string {
    const lower = input.toLowerCase();

    // 1. Slot booking process
    if (lower.match(/(book|slot|schedule|appointment|बुक|స్లాట్|स्लॉट)/)) {
        return 'To book a slot, select your update type, enter your PIN code, and pick a recommended center based on AI availability. After booking, you will receive a QR code and WhatsApp confirmation.';
    }

    // 2. AI slot recommendation
    if (lower.match(/(recommend|ai slot|best time|smart pick|best center)/)) {
        return 'Our AI automatically recommends the best centers and off-peak slots for minimal wait times. It picks locations nearest to your PIN code.';
    }

    // 3. Age-based biometric update alerts & 4. Risk classification
    if (lower.match(/(age|5|15|50|child|kid|milestone|birthday|alert|risk|upcoming|urgent|priority)/)) {
        return 'The system highlights upcoming mandatory updates (e.g., at age 5 or 15). "High Risk" requires immediate attention, while "Upcoming" means an update is due soon. Alerts appear 5 months prior.';
    }

    // 5. QR code after booking & 6. WhatsApp booking sharing
    if (lower.match(/(qr|code|whatsapp|share|message)/)) {
        return 'Once a slot is booked, you receive a unique QR code for quick check-in at the center. You can also share these details via WhatsApp instantly.';
    }

    // 7. Required documents for each update type
    if (lower.match(/(document|proof|required|certificate|id proof|address proof|doc)/)) {
        return 'Required documents depend on the update type: Address (Utility bill, Rent agreement), Name/DOB (Passport, Birth Certificate, PAN). Biometric updates usually only require your current Aadhaar.';
    }

    // 8. Multi-stage verification & 9. Center -> VRO -> MRO tracking
    if (lower.match(/(verify|verification|stage|vro|mro|flow|approve|reject|process)/)) {
        return 'Updates follow a multi-stage workflow: Started at the Aadhaar Center, verified by the VRO (Village Revenue Officer), and approved or rejected by the MRO (Mandal Revenue Officer).';
    }

    // 10. Tracking
    if (lower.match(/(track|status|update request|check|स्थिति|ట్రాక్|ट्रैक)/)) {
        return 'You can track the real-time stage of your update request (Center -> VRO -> MRO) from the "My Bookings" or Profile dashboard.';
    }

    // 11. Admin demo tools
    if (lower.match(/(admin|demo|tool|test|simulate)/)) {
        return 'The Admin demo tools are designed to simulate the verification workflow (Center -> VRO -> MRO) state without modifying the actual backend database.';
    }

    // 12. Booking rescheduling & Cancellation
    if (lower.match(/(reschedule|cancel|change time|postpone|delete booking)/)) {
        return 'You can easily reschedule or cancel your existing bookings directly from your profile dashboard.';
    }

    // 13. Biometric and face authentication updates, Updates in general
    if (lower.match(/(biometric|face|scan|fingerprint|iris|photo|auth|update|change|address|name|मोबाइल|अपडेट|అప్‌డేట్)/)) {
        return 'You can update your demographics (Name, Address) or Biometrics (Fingerprints, Iris, Face scan). Biometric updates mandate a center appointment.';
    }

    // General Help Context
    if (lower.match(/(hello|hi|hey|help|how|namaste|नमस्ते|హలో|सहायता|సహాయం)/)) {
        return 'I can help with slot booking, tracking multi-stage verifications, age-based alerts, QR features, and required documents. How can I assist?';
    }

    // Fallback: outside project scope
    return 'I am designed to assist with Aadhaar booking and update services.';
}

export default function AiAssistant() {
    const { language } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', text: t(language, 'ai_greeting') },
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    const sendMessage = () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        const userMsg: Message = { role: 'user', text: trimmed };
        const botResponse = getResponse(trimmed, language);
        const botMsg: Message = { role: 'bot', text: botResponse };

        setMessages(prev => [...prev, userMsg, botMsg]);
        setInput('');
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating button */}
            <button className="ai-chat-btn" onClick={() => setOpen(o => !o)} aria-label="AI Assistant">
                {open ? <X size={22} color="white" /> : <Bot size={22} color="white" />}
            </button>

            {/* Chat Drawer */}
            {open && (
                <div className="ai-chat-drawer">
                    {/* Header */}
                    <div className="ai-chat-header">
                        <Bot size={18} />
                        <span>{t(language, 'ai_title')}</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span style={{ fontSize: '12px', opacity: 0.8 }}>Online</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="ai-chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`ai-msg ${msg.role}`}>
                                {msg.text}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <div className="ai-chat-input-area">
                        <input
                            className="ai-chat-input"
                            placeholder={t(language, 'ai_placeholder')}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                        />
                        <button className="ai-send-btn" onClick={sendMessage}>
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
