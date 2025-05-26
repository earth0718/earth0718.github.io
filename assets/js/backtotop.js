document.addEventListener('DOMContentLoaded', function () {
  const backToTopBtn = document.getElementById('backToTopBtn');

  if (!backToTopBtn) {
    return; // Exit if the button isn't found
  }

  // Show or hide the button based on scroll position
  window.addEventListener('scroll', function () {
    if (window.pageYOffset > 300 || document.documentElement.scrollTop > 300) {
      backToTopBtn.style.display = 'block';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });

  // Scroll to top when the button is clicked
  backToTopBtn.addEventListener('click', function (event) {
    event.preventDefault(); // Prevent default anchor behavior
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});
