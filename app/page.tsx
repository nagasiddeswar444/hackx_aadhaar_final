'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Language, t } from '@/lib/translations';
import { Shield, BrainCircuit, ScanFace, CalendarClock, Globe } from 'lucide-react';
import { Variants, motion } from 'framer-motion';

const LANGUAGES: { code: Language; name: string; native: string; flag: string }[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🏳️' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🏳️' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🏳️' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🏳️' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🏳️' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🏳️' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🏳️' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🏳️' },
];

const FEATURES = [
  { icon: <BrainCircuit size={28} />, title: "AI Slot Recommendation", desc: "Smart algorithms suggest times with the lowest crowd traffic." },
  { icon: <ScanFace size={28} />, title: "Face Verification", desc: "Military-grade 128-d biometric identity verification." },
  { icon: <CalendarClock size={28} />, title: "Age Milestone Booking", desc: "Automated booking prompts when mandatory updates are due." },
  { icon: <Globe size={28} />, title: "Multi-Language Support", desc: "Fully accessible in 10 regional Indian languages." }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function LandingPage() {
  const { setLanguage, language } = useAuth();
  const [selected, setSelected] = useState<Language>(language);
  const router = useRouter();

  const handleContinue = () => {
    setLanguage(selected);
    router.push('/login');
  };

  return (
    <div className="auth-wrapper" style={{ overflowY: 'auto', padding: '40px 20px', alignItems: 'flex-start' }}>
      <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '60px' }}>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ textAlign: 'center', marginTop: '20px' }}
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            style={{ width: '80px', height: '80px', margin: '0 auto 24px', background: 'var(--gradient-1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(59,130,246,0.5)', transform: 'rotate(-5deg)' }}
          >
            <Shield size={40} color="white" />
          </motion.div>

          <h1 className="glow-text" style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '800', marginBottom: '16px', lineHeight: '1.2' }}>
            AI-Powered Aadhaar Lifecycle Management System
          </h1>
          <p style={{ color: 'var(--accent)', fontSize: '18px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Secure • Intelligent • Proactive
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid-4"
          style={{ gap: '20px' }}
        >
          {FEATURES.map((feat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="glass-card"
              style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', cursor: 'default' }}
            >
              <div style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', padding: '16px', borderRadius: '50%' }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{feat.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Language Selection Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="auth-card"
          style={{ maxWidth: '800px', margin: '0 auto', width: '100%', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
        >
          <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {t(selected, 'select_language')}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px' }}>
            Choose your preferred language / अपनी भाषा चुनें / మీ భాషను ఎంచుకోండి
          </p>

          <div className="grid-4" style={{ marginBottom: '32px', gap: '12px' }}>
            {LANGUAGES.map(lang => (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                style={{
                  background: selected === lang.code ? 'var(--gradient-1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected === lang.code ? 'transparent' : 'var(--border)'}`,
                  borderRadius: '16px',
                  padding: '16px',
                  color: selected === lang.code ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.3s'
                }}
              >
                <div style={{ fontSize: '24px' }}>{lang.flag}</div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{lang.native}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{lang.name}</div>
              </motion.button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinue}
              className="btn-primary"
              style={{ maxWidth: '300px', fontSize: '16px', padding: '16px' }}
            >
              {t(selected, 'continue')} &nbsp; →
            </motion.button>
          </div>
        </motion.div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', paddingBottom: '40px' }}>
          Powered by UIDAI Service Architecture
        </p>
      </div>
    </div>
  );
}
