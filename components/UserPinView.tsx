import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';

interface UserPinViewProps {
    user: User;
    onPinSubmit: (pin: string) => Promise<boolean>;
    onBack: () => void;
    onRequirePasswordFallback: () => void;
}

const MAX_PIN_ATTEMPTS = 5;

const UserPinView: React.FC<UserPinViewProps> = ({ user, onPinSubmit, onBack, onRequirePasswordFallback }) => {
    const [enteredPin, setEnteredPin] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(0);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isLockedOut, setIsLockedOut] = useState(false);

    useEffect(() => {
        if (enteredPin.length === 4) {
            checkPin();
        }
    }, [enteredPin]);

    const checkPin = async () => {
        if (isLockedOut) {
            return;
        }

        const success = await onPinSubmit(enteredPin);
        if (!success) {
            const nextAttempts = failedAttempts + 1;
            setFailedAttempts(nextAttempts);

            if (nextAttempts >= MAX_PIN_ATTEMPTS) {
                setIsLockedOut(true);
                setError('Too many PIN attempts. Continue with your password.');
                setTimeout(() => {
                    onRequirePasswordFallback();
                }, 1200);
                return;
            }

            setError(`Incorrect PIN. ${MAX_PIN_ATTEMPTS - nextAttempts} attempt(s) remaining.`);
            setShake(s => s + 1); // Trigger shake animation
            setTimeout(() => {
                setEnteredPin('');
                setError('');
            }, 1000);
        }
    };

    const handleKeyPress = (key: string) => {
        if (enteredPin.length < 4) {
            setEnteredPin(prev => prev + key);
        }
    };
    
    const handleBackspace = () => {
        setEnteredPin(prev => prev.slice(0, -1));
    };

    const PinDots = () => (
        <div className="flex justify-center space-x-4">
            {[...Array(4)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-4 h-4 rounded-full border-2"
                    animate={{ 
                        backgroundColor: i < enteredPin.length ? 'hsl(var(--success))' : 'transparent',
                        borderColor: i < enteredPin.length ? 'hsl(var(--success))' : 'hsl(var(--border))',
                        scale: i === enteredPin.length - 1 ? [1, 1.2, 1] : 1
                    }}
                    transition={{ duration: 0.2 }}
                />
            ))}
        </div>
    );

    const Keypad = () => {
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
        return (
            <div className="grid grid-cols-3 gap-4">
                {keys.map((key, i) => (
                    <motion.button
                        key={i}
                        onClick={() => key === '⌫' ? handleBackspace() : key ? handleKeyPress(key) : null}
                        whileTap={{ scale: 0.95 }}
                        className="p-4 bg-card/80 dark:bg-dark-card/80 text-foreground dark:text-dark-foreground rounded-2xl text-2xl font-bold enabled:hover:bg-muted dark:enabled:hover:bg-dark-muted disabled:opacity-0 transition-colors shadow-sm border border-border dark:border-dark-border"
                        disabled={!key || isLockedOut}
                    >
                        {key}
                    </motion.button>
                ))}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 auth-background flex flex-col items-center justify-center z-50 p-4"
        >
            <motion.div
                className="w-full max-w-sm text-center"
                animate={{ x: shake ? [-10, 10, -10, 10, 0] : 0 }}
                transition={{ duration: 0.4 }}
                onAnimationComplete={() => setShake(0)}
            >
                <div className="w-24 h-24 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-5xl mx-auto mb-4 border-4 border-card dark:border-dark-card shadow-lg">
                     <span>{user.name.charAt(0)}</span>
                </div>

                <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Welcome, {user.name}</h1>
                <p className="text-foreground-muted dark:text-dark-foreground-muted mt-2">
                    {isLockedOut ? 'PIN entry locked. Continue with your password.' : 'Enter your 4-digit PIN to sign in.'}
                </p>
                
                <div className="my-8">
                    <PinDots />
                </div>
                
                 <AnimatePresence>
                    {error && (
                         <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-danger font-semibold mb-4 h-5">{error}</motion.p>
                    )}
                     {!error && <div className="h-5 mb-4"></div>}
                </AnimatePresence>
                
                <div className="max-w-xs mx-auto">
                    <Keypad />
                </div>
                
                <div className="mt-8">
                    <button onClick={isLockedOut ? onRequirePasswordFallback : onBack} className="text-sm font-medium text-primary hover:text-primary-focus">
                        {isLockedOut ? 'Use Password Instead' : '\u2190 Switch User'}
                    </button>
                </div>

            </motion.div>
        </motion.div>
    );
};

export default UserPinView;
