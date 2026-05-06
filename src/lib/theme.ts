//src/lib/theme.ts
export const themeManager = {
  setDark() {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  },

  setLight() {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  },

  toggle() {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      this.setLight();
    } else {
      this.setDark();
    }
  },

  init() {
    const saved = localStorage.getItem("theme");

    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else if (saved === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // default system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      if (prefersDark) {
        document.documentElement.classList.add("dark");
      }
    }
  },
};
