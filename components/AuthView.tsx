import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, Settings, BusinessType } from '../types';
import * as db from '../utils/offlineDb';
import { App } from '../App';
import LoginView from './LoginView';
import ForgotPasswordView from './ForgotPasswordView';
import Toast from './common/Toast';
import { ToastData } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import UserSelectionView from './UserSelectionView';
import UserPinView from './UserPinView';
import StaffPasscodeView from './StaffPasscodeView';
import WelcomeView from './setup/WelcomeView';
import SignUpView from './SignUpView';
import { isBackendConfigured, logout as logoutApi } from '../utils/api';
import { bootstrapSessionFromServer, loginAndBootstrapFromServer } from '../utils/serverSync';


type AuthState = 'loading' | 'setup' | 'user_selection' | 'pin_entry' | 'staff_login' | 'admin_login' | 'forgot_password' | 'signup' | 'app';

const AuthView: React.FC = () => {
    const [authState, setAuthState] = useState<AuthState>('loading');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userForPin, setUserForPin] = useState<User | null>(null);
    const [userForStaffLogin, setUserForStaffLogin] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = useCallback((message: string, type: ToastData['type'] = 'info') => {
        const newToast: ToastData = { id: Date.now(), message, type };
        setToasts(prev => [newToast]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 3000);
    }, []);

    useEffect(() => {
        const checkInitialState = async () => {
            try {
                await db.initDB();
                const canUseServer = isBackendConfigured() && navigator.onLine;

                if (canUseServer) {
                    try {
                        const { currentUser: serverUser, users: serverUsers } = await bootstrapSessionFromServer();
                        setAllUsers(serverUsers);
                        setCurrentUser(serverUser);
                        setAuthState('app');
                        return;
                    } catch {
                        // No active backend session yet. Continue with local bootstrap.
                    }
                }

                let users = await db.getAllItems<User>('users');

                if (users.length === 0) {
                    setAuthState(canUseServer ? 'admin_login' : 'setup');
                    return;
                }
                
                setAllUsers(users);
                
                const rememberedUserId = localStorage.getItem('banduka_pos_remembered_user');
                if (rememberedUserId) {
                    const rememberedUser = users.find(u => u.id === rememberedUserId);
                    if (rememberedUser) {
                        setCurrentUser(rememberedUser);
                        setAuthState('app');
                        return;
                    } else {
                        localStorage.removeItem('banduka_pos_remembered_user');
                    }
                }

                setAuthState('user_selection');
            } catch (error) {
                console.error("Error during initial application load:", error);
                showToast("Failed to load application data. Please refresh.", "error");
                setAuthState('loading');
            }
        };
        checkInitialState();
    }, [showToast]);

    const handleSetupComplete = async (setupData: { 
        businessInfo: Partial<Settings['businessInfo']>,
        businessType: BusinessType,
        adminEmail: string,
        adminPass: string 
    }) => {
        try {
            const adminUser: User = {
                id: `user_admin_${Date.now()}`,
                name: 'Admin',
                username: setupData.adminEmail,
                email: setupData.adminEmail,
                password: setupData.adminPass,
                role: 'Admin',
            };
            await db.saveItem('users', adminUser);

            const newSettings: Settings = {
                ...DEFAULT_SETTINGS,
                isSetupComplete: true,
                businessType: setupData.businessType,
                businessInfo: {
                    ...DEFAULT_SETTINGS.businessInfo,
                    ...setupData.businessInfo,
                    email: setupData.adminEmail,
                }
            };
            await db.saveItem('settings', newSettings);

            setAllUsers([adminUser]);
            setCurrentUser(adminUser);
            setAuthState('app');
            localStorage.setItem('banduka_pos_remembered_user', adminUser.id);
            showToast(`Welcome to Banduka POS, ${setupData.businessInfo.name}!`, 'success');
            
            return true;
        } catch (error) {
            console.error("Failed during initial setup:", error);
            showToast("An error occurred during setup. Please try again.", "error");
            return false;
        }
    };
    
    const handleAdminLogin = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
        if (isBackendConfigured() && navigator.onLine) {
            try {
                const { currentUser: serverUser, users: serverUsers } = await loginAndBootstrapFromServer(email, password);
                setAllUsers(serverUsers);
                setCurrentUser(serverUser);
                setAuthState('app');
                if (rememberMe) {
                    localStorage.setItem('banduka_pos_remembered_user', serverUser.id);
                } else {
                    localStorage.removeItem('banduka_pos_remembered_user');
                }
                return true;
            } catch (error) {
                console.error("Backend login failed:", error);
            }
        }

        const user = allUsers.find(u => u.username && u.username.toLowerCase() === email.toLowerCase());
        if (user && user.password === password) {
            setCurrentUser(user);
            setAuthState('app');
            if (rememberMe) {
                localStorage.setItem('banduka_pos_remembered_user', user.id);
            } else {
                localStorage.removeItem('banduka_pos_remembered_user');
            }
            return true;
        }
        showToast('Invalid admin credentials.', 'error');
        return false;
    };

    const handleUserSelect = (user: User) => {
        if (user.role === 'Admin' || user.email) {
            setAuthState('admin_login');
            return;
        }

        if (user.pin && user.pin.length === 4) {
            setUserForPin(user);
            setAuthState('pin_entry');
        } else if (user.password) {
            setUserForStaffLogin(user);
            setAuthState('staff_login');
        } else {
            showToast(`${user.name} does not have a PIN or Passcode set up. Please ask an admin to set one.`, 'error');
        }
    };
    
    const handlePinLogin = async (pin: string): Promise<boolean> => {
        if (userForPin && userForPin.pin === pin) {
            setCurrentUser(userForPin);
            setAuthState('app');
            localStorage.removeItem('banduka_pos_remembered_user');
            return true;
        }
        return false;
    };

    const handleRequirePasswordFallback = () => {
        if (!userForPin) {
            setAuthState('user_selection');
            return;
        }

        if (userForPin.password) {
            setUserForStaffLogin(userForPin);
            setUserForPin(null);
            setAuthState('staff_login');
            showToast('PIN entry locked. Continue with your password.', 'info');
            return;
        }

        setUserForPin(null);
        setAuthState('user_selection');
        showToast('PIN entry locked. Please ask an admin to set a password for this user.', 'error');
    };

    const handleStaffLogin = async (username: string, password: string): Promise<boolean> => {
        if (userForStaffLogin && userForStaffLogin.username.toLowerCase() === username.toLowerCase() && userForStaffLogin.password === password) {
            setCurrentUser(userForStaffLogin);
            setAuthState('app');
            localStorage.removeItem('banduka_pos_remembered_user');
            return true;
        }
        return false;
    };


    const handleSignUp = async (userData: { businessName: string; email: string; password: string }): Promise<boolean> => {
        try {
            const adminUser: User = {
                id: `user_admin_${Date.now()}`,
                name: userData.businessName,
                username: userData.email,
                email: userData.email,
                password: userData.password,
                role: 'Admin',
            };
            await db.saveItem('users', adminUser);

            const { DEFAULT_SETTINGS } = await import('../constants');
            const newSettings = {
                ...DEFAULT_SETTINGS,
                isSetupComplete: true,
                businessInfo: { ...DEFAULT_SETTINGS.businessInfo, name: userData.businessName, email: userData.email },
            };
            await db.saveItem('settings', newSettings);

            setAllUsers([adminUser]);
            setCurrentUser(adminUser);
            localStorage.setItem('banduka_pos_remembered_user', adminUser.id);
            setAuthState('app');
            showToast(`Welcome to Banduka POS, ${userData.businessName}!`, 'success');
            return true;
        } catch (error) {
            console.error('Sign up failed:', error);
            showToast('Sign up failed. Please try again.', 'error');
            return false;
        }
    };

    const handleLogout = () => {
        void logoutApi().catch((error) => {
            console.error("Backend logout failed:", error);
        });
        setCurrentUser(null);
        localStorage.removeItem('banduka_pos_remembered_user');
        setAuthState('user_selection');
    };
    
    const handleFindUser = async (email: string): Promise<User | null> => {
        return allUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
    };

    const handleResetPassword = async (password: string, userToReset: User) => {
        try {
            const updatedUser = { ...userToReset, password };
            await db.saveItem('users', updatedUser);
            setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            showToast(`Password for ${userToReset.name} has been reset successfully.`, 'success');
            setAuthState('admin_login');
        } catch (error) {
            console.error("Failed to reset password:", { userId: userToReset.id, error });
            showToast("An error occurred while resetting the password.", "error");
        }
    };
    
    const handleAddUser = async (userData: Omit<User, 'id'>) => {
        try {
            const newUser = { ...userData, id: `user_${Date.now()}` };
            setAllUsers(prev => [...prev, newUser]);
            await db.saveItem('users', newUser);
        } catch (error) {
            console.error("Failed to add new user:", { userData, error });
            showToast("Error adding new user. Please try again.", "error");
            throw error;
        }
    };

    const handleUpdateUser = async (user: User) => {
        try {
            setAllUsers(prev => prev.map(u => (u.id === user.id ? user : u)));
            await db.saveItem('users', user);
        } catch (error) {
            console.error("Failed to update user:", { user, error });
            showToast("Error updating user. Please try again.", "error");
            throw error;
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            setAllUsers(prev => prev.filter(u => u.id !== userId));
            await db.deleteItem('users', userId);
        } catch (error) {
            console.error("Failed to delete user:", { userId, error });
            showToast("Error deleting user. Please try again.", "error");
            throw error;
        }
    };

    const renderContent = () => {
        switch (authState) {
            case 'loading':
                return <div className="h-screen w-screen flex items-center justify-center text-foreground-muted">Loading Application...</div>;
            case 'setup':
                return <WelcomeView onComplete={handleSetupComplete} />;
            case 'user_selection':
                return <UserSelectionView users={allUsers} onUserSelect={handleUserSelect} />;
            case 'pin_entry':
                if (userForPin) return <UserPinView user={userForPin} onPinSubmit={handlePinLogin} onBack={() => { setUserForPin(null); setAuthState('user_selection'); }} onRequirePasswordFallback={handleRequirePasswordFallback} />;
                setAuthState('user_selection'); return null;
            case 'staff_login':
                if (userForStaffLogin) return <StaffPasscodeView user={userForStaffLogin} onLogin={handleStaffLogin} onBack={() => { setUserForStaffLogin(null); setAuthState('user_selection'); }} />;
                setAuthState('user_selection'); return null;
            case 'admin_login':
                return <LoginView onLogin={handleAdminLogin} onForgotPassword={() => setAuthState('forgot_password')} onNavigateToSignUp={() => setAuthState('signup')} onBack={allUsers.length > 1 ? () => setAuthState('user_selection') : undefined} />;
            case 'forgot_password':
                return <ForgotPasswordView onFindUser={handleFindUser} onResetPassword={handleResetPassword} onBackToLogin={() => setAuthState('admin_login')} />;
            case 'signup':
                return <SignUpView onSignUp={handleSignUp} onNavigateToLogin={() => setAuthState('admin_login')} />;
            case 'app':
                if (currentUser) {
                    return (
                        <App 
                            currentUser={currentUser} 
                            onLogout={handleLogout} 
                            allUsers={allUsers}
                            onAddUser={handleAddUser}
                            onUpdateUser={handleUpdateUser}
                            onDeleteUser={handleDeleteUser}
                        />
                    );
                }
                setAuthState('user_selection');
                return null;
        }
    };
    
    return (
        <>
            <AnimatePresence mode="wait">
                 <motion.div
                    key={authState}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} />
                ))}
            </AnimatePresence>
        </>
    );
};

export default AuthView;
