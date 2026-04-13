

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';

interface PinLockViewProps {
    currentUser: User;
    onUnlock: () => void;
    onForceLogout: () => void;
}

const MAX_PIN_ATTEMPTS = 5;

const PinLockView: React.FC<PinLockViewProps> = ({ currentUser, onUnlock, onForceLogout }) => {
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

    const checkPin = () => {
        if (isLockedOut) {
            return;
        }

        if (enteredPin === currentUser.pin) {
            onUnlock();
        } else {
            const nextAttempts = failedAttempts + 1;
            setFailedAttempts(nextAttempts);

            if (nextAttempts >= MAX_PIN_ATTEMPTS) {
                setIsLockedOut(true);
                setError('Too many PIN attempts. Logging out for safety.');
                setTimeout(() => {
                    onForceLogout();
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
                        backgroundColor: i < enteredPin.length ? '#34d399' : 'transparent',
                        borderColor: i < enteredPin.length ? '#34d399' : '#94a3b8',
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
                        className="p-4 bg-white/10 backdrop-blur-sm text-white rounded-full text-2xl font-bold enabled:hover:bg-white/20 disabled:opacity-0 transition-colors"
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
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4"
        >
            <motion.div
                className="w-full max-w-sm text-center"
                animate={{ x: shake ? [-10, 10, -10, 10, 0] : 0 }}
                transition={{ duration: 0.4 }}
                onAnimationComplete={() => setShake(0)}
            >
                <div className="w-20 h-20 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-3xl mx-auto mb-4 border-4 border-white/20">
                     <span>{currentUser.name.charAt(0)}</span>
                </div>

                <h1 className="text-2xl font-bold text-white">Welcome Back, {currentUser.name}</h1>
                <p className="text-slate-300 mt-2">
                    {isLockedOut ? 'PIN entry locked. Logging out.' : 'Enter your 4-digit PIN to unlock.'}
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
                            className="text-red-400 font-semibold mb-4 h-5">{error}</motion.p>
                    )}
                     {!error && <div className="h-5 mb-4"></div>}
                </AnimatePresence>
                
                <div className="max-w-xs mx-auto">
                    <Keypad />
                </div>
                
                <div className="mt-8">
                    <button onClick={onForceLogout} className="text-sm font-medium text-primary hover:text-dark-primary-focus">
                        Not you? Logout
                    </button>
                </div>

            </motion.div>
        </motion.div>
    );
};

export default PinLockView;
