// DarkModeToggle.jsx
import React from 'react';
import { Moon } from 'lucide-react';

function DarkModeToggle() {
  function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="absolute top-2 right-4 z-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-700 transition duration-200"
      >
      <Moon />
    </button>
  );
}

export default DarkModeToggle;
