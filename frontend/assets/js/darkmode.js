// Dark Mode Toggle Utility
function initDarkMode() {
  const darkModeEnabled = localStorage.getItem('darkMode') !== 'false';
  const darkModeToggle = document.getElementById('darkModeToggle');
  const logoImg = document.querySelector('.logo-btn img');

  // Set initial state
  if (darkModeEnabled) {
    enableDarkMode();
    if (darkModeToggle) darkModeToggle.checked = true;
    if (logoImg) logoImg.src = '../assets/logos/fitnest logo dark.png';
  } else {
    disableDarkMode();
    if (darkModeToggle) darkModeToggle.checked = false;
    if (logoImg) logoImg.src = '../assets/logos/fitnest logo clear.png';
  }

  // Add event listener to toggle
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', function() {
      if (this.checked) {
        enableDarkMode();
        localStorage.setItem('darkMode', 'true');
        if (logoImg) logoImg.src = '../assets/logos/fitnest logo dark.png';
      } else {
        disableDarkMode();
        localStorage.setItem('darkMode', 'false');
        if (logoImg) logoImg.src = '../assets/logos/fitnest logo clear.png';
      }
      // Reload charts if they exist
      if (window.updateCharts) {
        window.updateCharts();
      }
    });
  }
}

function enableDarkMode() {
  document.documentElement.setAttribute('data-theme', 'dark');
}

function disableDarkMode() {
  document.documentElement.setAttribute('data-theme', 'light');
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
  initDarkMode();
}
