import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";

    document.documentElement.dataset.theme = saved;
    setDark(saved === "dark");
  }, []);

  function toggleTheme() {
    const next = dark ? "light" : "dark";

    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);

    setDark(next === "dark");
  }

  return (
    <button type="button" onClick={toggleTheme}>
      {dark ? "🌸 Modo claro" : "🌙 Modo escuro"}
    </button>
  );
}
