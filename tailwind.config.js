module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        background: '#0B0E18',
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
        },
        accent: '#2DF1B0',
        success: '#00E17A',
        error: '#FF5E5E',
        border: '#000000',
      },
      boxShadow: {
        'glow-accent': '0 0 16px 0 #2DF1B0',
        'glow-border': '0 0 8px 0 #00D0FF',
      },
    },
  },
  plugins: [],
};
