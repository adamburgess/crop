const colors = require('tailwindcss/colors');

module.exports = {
    content: [
        './src/**/*.{html,tsx}'
    ],
    theme: {
        extend: {
            colors: {
                gray: colors.neutral
            }
        },
    },
};
