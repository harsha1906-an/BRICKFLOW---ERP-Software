// Navigation functionality
document.addEventListener('DOMContentLoaded', function () {
    // Login functionality
    const loginForm = document.getElementById('loginForm');
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        // Hide login screen and show main app
        loginScreen.style.display = 'none';
        mainApp.style.display = 'flex';
    });

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('pageTitle');

    // Handle navigation clicks
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            const targetPage = this.getAttribute('data-page');

            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked item
            this.classList.add('active');

            // Hide all pages
            pages.forEach(page => page.classList.remove('active'));

            // Show target page
            const targetElement = document.getElementById(targetPage);
            if (targetElement) {
                targetElement.classList.add('active');
            }

            // Update page title
            const navText = this.querySelector('.nav-text').textContent;
            pageTitle.textContent = navText;
        });
    });

    // Handle browser back/forward buttons
    window.addEventListener('hashchange', function () {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const targetNav = document.querySelector(`[data-page="${hash}"]`);
            if (targetNav) {
                targetNav.click();
            }
        }
    });

    // Load initial page from URL hash
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        const initialNav = document.querySelector(`[data-page="${initialHash}"]`);
        if (initialNav) {
            initialNav.click();
        }
    }
});
