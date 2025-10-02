import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
                // Ticlin brand colors
                ticlin: {
                    DEFAULT: '#d3d800',
                    light: '#e4e830',
                    dark: '#b6bb00',
                    50: '#f9facc',
                    100: '#f2f499',
                    200: '#ebee66',
                    300: '#e4e833',
                    400: '#d3d800',
                    500: '#128C7E', // Verde WhatsApp oficial
                    600: '#0F7A6E', // Verde mais escuro
                    700: '#0C675D',
                    800: '#09544B',
                    900: '#06413A',
                    950: '#032E28',
                },
                // Pulse colors for new gradient system
                pulse: {
                    "50": "#fffef0",
                    "100": "#fffacc",
                    "200": "#fff599",
                    "300": "#ffee66",
                    "400": "#ffe433",
                    "500": "#dedc00", // Primary yellow
                    "600": "#95c11f", // Primary green
                    "700": "#7ba018",
                    "800": "#628012",
                    "900": "#4f660e",
                    "950": "#2d3808",
                },
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
                'fade-in': {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(10px)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0)'
                    }
                },
                'scale-in': {
                    '0%': {
                        opacity: '0',
                        transform: 'scale(0.95)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'scale(1)'
                    }
                },
                'flow-pulse': {
                    '0%, 100%': { opacity: '0.5' },
                    '50%': { opacity: '1' }
                },
                'flow-float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' }
                },
                'flow-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
                    '50%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)' }
                }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.4s ease-out',
                'scale-in': 'scale-in 0.3s ease-out',
                'flow-pulse': 'flow-pulse 8s ease-in-out infinite',
                'flow-float': 'flow-float 3s ease-in-out infinite',
                'flow-glow': 'flow-glow 2s ease-in-out infinite'
			},
			fontFamily: {
				inter: ['Inter', 'sans-serif'],
			},
			boxShadow: {
				glass: "0 4px 32px 0 rgba(31, 38, 135, 0.07)",
				'glass-lg': "0 8px 40px 0 rgba(31, 38, 135, 0.12)",
			},
			backgroundImage: {
				'glass-light': "linear-gradient(135deg, rgba(255,255,255,0.60) 80%, rgba(245,245,245,0.76) 100%)",
				'glass-dark': "linear-gradient(135deg, rgba(30,30,30,0.76) 80%, rgba(18,18,18,0.9) 100%)",
				'pulse-gradient': 'linear-gradient(180deg, rgba(222, 220, 0, 0.8) 0%, rgba(149, 193, 31, 0) 100%)',
				'flow-gradient-primary': 'linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(220 100% 66%) 100%)',
				'flow-gradient-canvas': 'linear-gradient(135deg, hsl(250 100% 97%) 0%, hsl(220 70% 95%) 100%)',
				'flow-gradient-node': 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
