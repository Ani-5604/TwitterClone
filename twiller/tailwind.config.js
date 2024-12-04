// tailwind.config.js
const daisyUIThemes = require('daisyui/src/theming/themes');

module.exports = {
    content: [
        './src/**/*.{js,jsx,ts,tsx}', // Adjust paths according to your project structure
    ],
    theme: {
        extend: {
            // Custom themes configuration
            themes: [
                "light",
                "dark",
                {
                    white: {
                        ...daisyUIThemes["white"],
                        primary: "rgb(29, 155, 240)", // Custom primary color
                        secondary: "rgb(24, 24, 24)", // Custom secondary color
                    },
                },
            ],
        },
    },
    plugins: [
        require('daisyui'),
    ],
};
