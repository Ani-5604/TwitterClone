import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa'; // Import icons for light and dark themes

const ThemeSwitcher = () => {
    const changeTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme); // Save theme in local storage
    };

    const handleChange = (e) => {
        changeTheme(e.target.value);
    };

    // Get the saved theme from localStorage when component mounts
    React.useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light
        changeTheme(savedTheme);
    }, []);

    return (
        <div className="flex items-center gap-2">
            <span className="text-blue cursor-pointer" onClick={() => changeTheme('light')}>
                <FaSun className="w-5 h-5" />
            </span>
            <span className="text-yellow cursor-pointer" onClick={() => changeTheme('dark')}>
                <FaMoon className="w-5 h-5" />
            </span>
        </div>
    );
};

export default ThemeSwitcher;
