/**
 * redirect-handler.js — Global redirect management for login/register flow
 * Saves the intended destination before login and restores it after successful auth
 */
(function () {
  const REDIRECT_KEY = 'hemo_redirect_after_login';

  window.RedirectHandler = {
    /**
     * Save current path before redirecting to login/register
     * @param {string} currentPath - Optional path to save (defaults to current location)
     */
    saveRedirect: function(currentPath) {
      const path = currentPath || window.location.pathname;
      
      // Don't save login/register pages themselves as redirect target
      if (path === '/login' || path === '/register' || path === '/dashboard') {
        return;
      }
      
      // Save the path (including search params if any)
      const fullPath = path + (window.location.search || '');
      sessionStorage.setItem(REDIRECT_KEY, fullPath);
      console.log('[RedirectHandler] Saved redirect path:', fullPath);
    },

    /**
     * Redirect to login page and save current location
     */
    redirectToLogin: function() {
      this.saveRedirect();
      window.location.href = '/login';
    },

    /**
     * Redirect to register page and save current location
     */
    redirectToRegister: function() {
      this.saveRedirect();
      window.location.href = '/register';
    },

    /**
     * Redirect back to saved path after successful login/register
     * Falls back to home page if no path was saved
     */
    redirectBack: function() {
      const savedPath = sessionStorage.getItem(REDIRECT_KEY);
      
      if (savedPath) {
        console.log('[RedirectHandler] Redirecting to saved path:', savedPath);
        sessionStorage.removeItem(REDIRECT_KEY);
        window.location.href = savedPath;
      } else {
        console.log('[RedirectHandler] No saved path, redirecting to home');
        window.location.href = '/';
      }
    },

    /**
     * Clear saved redirect path
     */
    clearRedirect: function() {
      sessionStorage.removeItem(REDIRECT_KEY);
    },

    /**
     * Get saved redirect path without removing it
     */
    getRedirect: function() {
      return sessionStorage.getItem(REDIRECT_KEY);
    },

    /**
     * Check if there's a saved redirect path
     */
    hasRedirect: function() {
      return !!sessionStorage.getItem(REDIRECT_KEY);
    },

    /**
     * Peek at the redirect path without removing it (alias for getRedirect)
     */
    peekRedirect: function() {
      return this.getRedirect();
    }
  };

  // Auto-save redirect when user clicks login links
  document.addEventListener('DOMContentLoaded', function() {
    // Find all login/register links and add click handlers
    const loginLinks = document.querySelectorAll('a[href="/login"], a[href="/register"]');
    
    loginLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // Only save redirect if not already on login/register page
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.RedirectHandler.saveRedirect();
        }
      });
    });
  });

  // Expose utility for inline onclick handlers
  window.goToLogin = function() {
    window.RedirectHandler.redirectToLogin();
  };

  window.goToRegister = function() {
    window.RedirectHandler.redirectToRegister();
  };
})();
