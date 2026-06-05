import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Design system: Vegas / De Vega
        surface: {
          DEFAULT: "#f9f9ff",
          dim: "#d3daea",
          bright: "#f9f9ff",
          lowest: "#ffffff",
          low: "#f0f3ff",
          container: "#e7eefe",
          "container-high": "#e2e8f8",
          "container-highest": "#dce2f3",
        },
        primary: {
          DEFAULT: "#8b1e3f",
          dark: "#6c0029",
          container: "#8b1e3f",
          fixed: "#ffd9de",
          "fixed-dim": "#ffb2bf",
          "on-container": "#ff9db0",
          hover: "#7a1a36",
        },
        secondary: {
          DEFAULT: "#f97316",
          dark: "#9d4300",
          container: "#fd761a",
          fixed: "#ffdbca",
          "fixed-dim": "#ffb690",
          hover: "#e8650b",
        },
        tertiary: {
          DEFAULT: "#111827",
          dark: "#2d3344",
          container: "#434a5b",
        },
        outline: {
          DEFAULT: "#897174",
          variant: "#ddbfc3",
        },
        on: {
          surface: "#151c27",
          "surface-variant": "#564145",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      spacing: {
        xs: "0.5rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        gutter: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
