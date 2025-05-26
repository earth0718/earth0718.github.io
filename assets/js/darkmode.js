document.addEventListener('DOMContentLoaded', function () {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;

  // Function to apply the theme
  function applyTheme(theme) {
    if (theme === 'dark') {
      body.classList.add('dark-mode');
      darkModeToggle.textContent = '☀️'; // Sun icon for dark mode
      localStorage.setItem('theme', 'dark');
    } else {
      body.classList.remove('dark-mode');
      darkModeToggle.textContent = '🌙'; // Moon icon for light mode
      localStorage.setItem('theme', 'light');
    }
  }

  // Event listener for the toggle button
  darkModeToggle.addEventListener('click', function () {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
      applyTheme('light');
    } else {
      applyTheme('dark');
    }
  });

  // Load saved preference or default to light mode
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme('light'); // Default to light mode
  }
});
