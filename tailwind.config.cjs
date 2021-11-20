const colors = require('tailwindcss/colors');

module.exports = {
    mode: 'jit',
    theme: {
        extend: {
            colors: {
                gray: colors.trueGray,
                coolGrey: colors.coolGray
            }
        },
    },
};
