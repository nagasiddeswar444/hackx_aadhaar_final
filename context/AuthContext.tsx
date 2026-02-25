'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, User } from '@/lib/supabase';
import { Language, getStoredLanguage, setStoredLanguage } from '@/lib/translations';
import { checkAgeMilestone, MilestoneInfo } from '@/lib/age-milestone';

interface AuthContextType {
    user: User | null;
    language: Language;
    milestoneInfo: MilestoneInfo | null;
    loading: boolean;
    setLanguage: (lang: Language) => void;
    login: (aadhaar: string, password: string) => Promise<{ error?: string }>;
    register: (data: RegisterData) => Promise<{ error?: string }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

interface RegisterData {
    aadhaar_number: string;
    name: string;
    email: string;
    mobile: string;
    date_of_birth: string;
    password: string;
    preferred_language: string;
    face_image_base64?: string;
    face_descriptor?: number[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [language, setLang] = useState<Language>('en');
    const [milestoneInfo, setMilestoneInfo] = useState<MilestoneInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedLang = getStoredLanguage();
        setLang(storedLang);

        const storedUser = localStorage.getItem('aadhaar_user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            const dob = parsedUser.date_of_birth || parsedUser.dob;
            if (dob) {
                setMilestoneInfo(checkAgeMilestone(dob));
            }
        }
        setLoading(false);
    }, []);

    const setLanguage = (lang: Language) => {
        setLang(lang);
        setStoredLanguage(lang);
        if (user) {
            supabase.from('users').update({ preferred_language: lang }).eq('id', user.id);
        }
    };

    const login = async (aadhaar: string, password: string): Promise<{ error?: string }> => {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .eq('aadhaar_number', aadhaar)
                .limit(1);

            if (error || !users || users.length === 0) {
                return { error: 'Invalid Aadhaar number or password.' };
            }

            const foundUser = users[0];

            // Use bcrypt comparison via API route
            const res = await fetch('/api/auth/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, hash: foundUser.password_hash }),
            });
            const { valid } = await res.json();

            if (!valid) {
                return { error: 'Invalid Aadhaar number or password.' };
            }

            setUser(foundUser);
            localStorage.setItem('aadhaar_user', JSON.stringify(foundUser));

            const lang = (foundUser.preferred_language as Language) || 'en';
            setLang(lang);
            setStoredLanguage(lang);

            const dob = foundUser.date_of_birth || foundUser.dob;
            if (dob) setMilestoneInfo(checkAgeMilestone(dob));

            // Update last_login
            await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', foundUser.id);

            return {};
        } catch (err) {
            return { error: 'Login failed. Please try again.' };
        }
    };

    const register = async (data: RegisterData): Promise<{ error?: string }> => {
        try {
            // Check uniqueness
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('aadhaar_number', data.aadhaar_number)
                .limit(1);

            if (existing && existing.length > 0) {
                return { error: 'Aadhaar number already registered.' };
            }

            // Hash password via API route
            const res = await fetch('/api/auth/hash-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: data.password }),
            });
            const { hash } = await res.json();

            // Upload face image if provided
            let face_image_url = null;
            if (data.face_image_base64) {
                try {
                    const res = await fetch(data.face_image_base64);
                    const blob = await res.blob();
                    const filename = `${data.aadhaar_number}-${Date.now()}.jpg`;
                    const { error: uploadErr } = await supabase.storage.from('faces').upload(filename, blob, { contentType: 'image/jpeg' });

                    if (!uploadErr) {
                        const { data: publicData } = supabase.storage.from('faces').getPublicUrl(filename);
                        face_image_url = publicData.publicUrl;
                    } else {
                        console.error('Face upload error:', uploadErr);
                    }
                } catch (e) {
                    console.error('Error generating image blob:', e);
                }
            }

            const { error } = await supabase.from('users').insert({
                aadhaar_number: data.aadhaar_number,
                name: data.name,
                email: data.email,
                mobile: data.mobile,
                phone: data.mobile,
                date_of_birth: data.date_of_birth,
                password_hash: hash,
                preferred_language: data.preferred_language,
                face_image_url: face_image_url,
                face_descriptor: data.face_descriptor,
                is_active: true,
                is_verified: false,
            });

            if (error) {
                if (error.message.includes('unique')) {
                    return { error: 'Email or Aadhaar already registered.' };
                }
                return { error: error.message };
            }

            return {};
        } catch (err) {
            return { error: 'Registration failed. Please try again.' };
        }
    };

    const logout = () => {
        setUser(null);
        setMilestoneInfo(null);
        localStorage.removeItem('aadhaar_user');
    };

    const refreshUser = async () => {
        if (!user) return;
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (data) {
            setUser(data);
            localStorage.setItem('aadhaar_user', JSON.stringify(data));
        }
    };

    return (
        <AuthContext.Provider value={{ user, language, milestoneInfo, loading, setLanguage, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
