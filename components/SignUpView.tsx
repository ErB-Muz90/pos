import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface SignUpViewProps {
    onSignUp: (userData: { businessName: string; location: string; phone: string; email: string; password: string }) => Promise<boolean>;
    onNavigateToLogin: () => void;
}

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
);

const KENYAN_PHONE_RE = /^(07|01)\d{8}$/;

const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    const map = ['', 'Weak', 'Medium', 'Strong', 'Very Strong'];
    const colors = ['', 'bg-red-500', 'bg-yellow-400', 'bg-green-400', 'bg-primary'];
    return { score, label: map[score] ?? '', color: colors[score] ?? '' };
};

const InputField: React.FC<{
    id: string; label: string; type?: string; placeholder?: string; value: string;
    onChange: (v: string) => void; required?: boolean; autoComplete?: string;
    rightSlot?: React.ReactNode;
}> = ({ id, label, type = 'text', placeholder, value, onChange, required, autoComplete, rightSlot }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">{label}</label>
        <div className="relative">
            <input
                id={id} type={type} placeholder={placeholder} required={required}
                autoComplete={autoComplete} value={value}
                onChange={e => onChange(e.target.value)}
                className="block w-full px-3 py-2 border border-border dark:border-dark-border rounded-xl shadow-sm placeholder-foreground-muted dark:placeholder-dark-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary sm:text-sm bg-card dark:bg-dark-background text-foreground dark:text-dark-foreground"
            />
            {rightSlot && <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightSlot}</div>}
        </div>
    </div>
);

const SignUpView: React.FC<SignUpViewProps> = ({ onSignUp, onNavigateToLogin }) => {
    const [businessName, setBusinessName] = useState('');
    const [location, setLocation] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

    const isValid = businessName.trim() && location.trim() && KENYAN_PHONE_RE.test(phone) && email.trim() && password.length >= 6;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!KENYAN_PHONE_RE.test(phone)) {
            setError('Phone must be a valid Kenyan number (e.g. 0712345678).');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setIsSubmitting(true);
        await onSignUp({ businessName, location, phone, email, password });
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen auth-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="sm:mx-auto sm:w-full sm:max-w-md"
            >
                <div className="bg-card dark:bg-dark-card py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-border dark:border-dark-border">
                    {/* Header */}
                    <div className="mb-5 text-center">
                        <h2 className="text-3xl font-extrabold text-foreground dark:text-dark-foreground">Welcome to Banduka POS™</h2>
                        <p className="mt-1 text-sm text-foreground-muted dark:text-dark-foreground-muted">
                            Let's get your business set up. Built by Eruns Technologies.
                        </p>
                    </div>

                    {/* Auth toggle */}
                    <div className="relative flex bg-muted dark:bg-dark-muted p-1 rounded-xl mb-5">
                        <motion.div layoutId="auth-toggle" className="absolute h-full w-1/2 bg-card dark:bg-dark-card rounded-lg shadow-sm" style={{ right: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                        <button onClick={onNavigateToLogin} className="relative w-1/2 py-2 text-sm font-semibold text-foreground-muted dark:text-dark-foreground-muted rounded-lg z-10">Sign In</button>
                        <button className="relative w-1/2 py-2 text-sm font-semibold text-primary dark:text-dark-primary rounded-lg z-10">Sign Up</button>
                    </div>

                    {/* 14-day trial callout */}
                    <div className="mb-5 flex items-start gap-2 rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 px-4 py-3">
                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-green-800 dark:text-green-300 font-medium">
                            <span className="font-bold">14-Day Free Trial</span> — Full access to all features. No payment required.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Section 1 */}
                        <fieldset className="space-y-3">
                            <legend className="text-xs font-bold uppercase tracking-widest text-foreground-muted dark:text-dark-foreground-muted">1. Your Business</legend>
                            <InputField id="businessName" label="Business Name" placeholder="Your Company Name" value={businessName} onChange={setBusinessName} required />
                            <InputField id="location" label="Location" placeholder="e.g., Mombasa" value={location} onChange={setLocation} required />
                            <InputField id="phone" label="Phone Number" placeholder="e.g., 0712345678" value={phone} onChange={setPhone} required autoComplete="tel" />
                        </fieldset>

                        {/* Section 2 */}
                        <fieldset className="space-y-3">
                            <legend className="text-xs font-bold uppercase tracking-widest text-foreground-muted dark:text-dark-foreground-muted">2. Administrator Account</legend>
                            <InputField id="email" label="Admin Email" type="email" placeholder="admin@yourbusiness.com" value={email} onChange={setEmail} required autoComplete="email" />
                            <InputField
                                id="password" label="Admin Password" type={showPassword ? 'text' : 'password'}
                                placeholder="Min. 6 characters" value={password} onChange={setPassword}
                                required autoComplete="new-password"
                                rightSlot={
                                    <button type="button" onClick={() => setShowPassword(p => !p)} className="text-foreground-muted hover:text-foreground">
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                }
                            />
                            {password && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-foreground-muted dark:text-dark-foreground-muted">Password Strength</span>
                                        <span className={`font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}>{passwordStrength.label}</span>
                                    </div>
                                    <div className="w-full bg-muted dark:bg-dark-muted rounded-full h-1.5">
                                        <motion.div
                                            className={`h-1.5 rounded-full ${passwordStrength.color}`}
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${passwordStrength.score * 25}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                </div>
                            )}
                        </fieldset>

                        {error && <p className="text-center text-sm text-danger">{error}</p>}

                        <motion.button
                            type="submit"
                            whileTap={{ scale: 0.98 }}
                            disabled={!isValid || isSubmitting}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-primary-content bg-primary hover:bg-primary-focus transition-all shadow-clay-dark active:shadow-clay-dark-inset disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Setting up...' : 'Complete Setup & Launch'}
                        </motion.button>
                    </form>

                    <div className="mt-5 text-center space-y-1 text-xs text-foreground-muted dark:text-dark-foreground-muted">
                        <p>
                            <a href="#" className="underline hover:text-foreground">Terms of Service</a>
                            {' · '}
                            <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
                        </p>
                        <p>
                            Already have an account?{' '}
                            <button onClick={onNavigateToLogin} className="font-semibold text-primary dark:text-dark-primary hover:underline">Sign In</button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SignUpView;
