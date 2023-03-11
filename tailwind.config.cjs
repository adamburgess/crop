/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{html,tsx}'
    ],
    experimental: {
        optimizeUniversalDefaults: true
    },
    future: {
        disableColorOpacityUtilitiesByDefault: true
    },
    corePlugins: {
        filter: false /* because we use the word 'filter' this is enabled... */
    }
};
