import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = (): [Theme, () => void] => {
    const getStoredTheme = (): Theme => {
        if (typeof window === 'undefined') return 'dark';
        const stored = window.localStorage.getItem('banduka-theme');
        return stored === 'light' || stored === 'dark' ? stored : 'dark';
    };

    const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        window.localStorage.setItem('banduka-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark');
    };

    return [theme, toggleTheme];
};
