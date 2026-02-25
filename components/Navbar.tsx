'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/lib/translations';
import { LayoutDashboard, User, CalendarPlus, ListChecks, LogOut, Shield, ChevronDown, Check, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Language } from '@/lib/translations';

export default function Navbar() {
    const { user, language, logout, setLanguage } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isLangOpen, setIsLangOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (!user) return null;

    const links = [
        { href: '/dashboard', label: t(language, 'nav_dashboard'), icon: <LayoutDashboard size={16} /> },
        { href: '/profile', label: t(language, 'nav_profile'), icon: <User size={16} /> },
        { href: '/booking', label: t(language, 'nav_booking'), icon: <CalendarPlus size={16} /> },
        { href: '/tracking', label: t(language, 'nav_tracking'), icon: <ListChecks size={16} /> },
        { href: '/helpline/', label: 'Help Line', icon: <Phone size={16} />, isExternal: true },
    ];

    const languages: { code: Language, label: string, flag: string }[] = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
        { code: 'te', label: 'తెలుగు', flag: '🏳️' },
        { code: 'ta', label: 'தமிழ்', flag: '🏳️' },
        { code: 'kn', label: 'ಕನ್ನಡ', flag: '🏳️' },
        { code: 'ml', label: 'മലയാളം', flag: '🏳️' },
        { code: 'mr', label: 'मराठी', flag: '🏳️' },
        { code: 'bn', label: 'বাংলা', flag: '🏳️' },
        { code: 'gu', label: 'ગુજરાતી', flag: '🏳️' },
        { code: 'pa', label: 'ਪੰਜਾਬੀ', flag: '🏳️' },
    ];

    const currentLang = languages.find(l => l.code === language) || languages[0];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="navbar"
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: 'var(--gradient-1)', borderRadius: '12px', boxShadow: '0 0 15px rgba(59,130,246,0.3)' }}>
                    <Shield size={20} color="white" />
                </div>
                <span className="nav-logo" style={{ fontSize: '22px' }}>{t(language, 'app_name')}</span>
            </div>

            <div className="nav-links">
                {links.map(link => (
                    link.isExternal ? (
                        <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nav-link"
                            style={{ position: 'relative' }}
                        >
                            {link.icon}
                            {link.label}
                        </a>
                    ) : (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                            style={{ position: 'relative' }}
                        >
                            {link.icon}
                            {link.label}
                            {pathname === link.href && (
                                <motion.div
                                    layoutId="navIndicator"
                                    style={{ position: 'absolute', bottom: '-24px', left: 0, right: 0, height: '3px', background: 'var(--primary)', borderRadius: '3px 3px 0 0', boxShadow: '0 -2px 10px rgba(59,130,246,0.5)' }}
                                />
                            )}
                        </Link>
                    )
                ))}
            </div>

            <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

                {/* Language Switcher */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: '12px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                        <span>{currentLang.flag}</span>
                        <span style={{ fontWeight: '500' }}>{currentLang.label}</span>
                        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>

                    <AnimatePresence>
                        {isLangOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    width: '180px',
                                    background: 'var(--bg-card)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '16px',
                                    padding: '8px',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                    zIndex: 200,
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}
                            >
                                {languages.map(lang => (
                                    <div
                                        key={lang.code}
                                        onClick={() => { setLanguage(lang.code); setIsLangOpen(false); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s',
                                            background: language === lang.code ? 'rgba(59,130,246,0.1)' : 'transparent',
                                            color: language === lang.code ? 'var(--primary)' : 'var(--text-primary)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = language === lang.code ? 'rgba(59,130,246,0.1)' : 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span>{lang.flag}</span>
                                            <span>{lang.label}</span>
                                        </div>
                                        {language === lang.code && <Check size={14} color="var(--primary)" />}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>

                {/* Profile & Logout */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '12px',
                        background: 'var(--gradient-1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '14px',
                        color: 'white',
                        boxShadow: '0 4px 10px rgba(59,130,246,0.4)'
                    }}>
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                </div>

                <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px', borderRadius: '12px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }} title="Logout">
                    <LogOut size={16} />
                </button>
            </div>
        </motion.nav>
    );
}
