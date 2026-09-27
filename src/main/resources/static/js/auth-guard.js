// src/main/resources/static/js/auth-guard.js

/**
 * ⭐ AUTH GUARD - Protected Route Logic (Vanilla JavaScript)
 * 
 * Purpose:
 * - Check if user is authenticated before accessing protected pages
 * - Save intended destination for redirect back after login
 * - Role-based access control (RBAC)
 * 
 * Usage: Include this script at the TOP of every protected page
 */

(function() {
    'use strict';

    // ══════════════════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════════════════
    
    const CONFIG = {
        LOGIN_PAGE: '/login',
        FORBIDDEN_PAGE: '/403',
        HOME_PAGE: '/',
        
        // Routes that require authentication
        PROTECTED_ROUTES: [
            '/dashboard',
            '/request-blood',
            '/my-requests',
            '/profile',
            '/notifications'
        ],
        
        // Routes that require ADMIN role
        ADMIN_ROUTES: [
            '/admin',
            '/admin/dashboard',
            '/admin/users',
            '/admin/requests'
        ]
    };

    // ══════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ══════════════════════════════════════════════════════════

    /**
     * Get current page path
     */
    function getCurrentPath() {
        return window.location.pathname;
    }

    /**
     * Check if current route requires authentication
     */
    function isProtectedRoute() {
        const path = getCurrentPath();
        return CONFIG.PROTECTED_ROUTES.some(route => path.startsWith(route)) ||
               CONFIG.ADMIN_ROUTES.some(route => path.startsWith(route));
    }

    /**
     * Check if current route requires admin role
     */
    function isAdminRoute() {
        const path = getCurrentPath();
        return CONFIG.ADMIN_ROUTES.some(route => path.startsWith(route));
    }

    /**
     * Save intended destination to sessionStorage
     */
    function saveIntendedDestination() {
        const intendedPath = getCurrentPath() + window.location.search;
        sessionStorage.setItem('redirectAfterLogin', intendedPath);
        console.log('🔒 Saved intended destination:', intendedPath);
    }

    /**
     * Redirect to login with intended destination
     */
    function redirectToLogin() {
        saveIntendedDestination();
        window.location.href = CONFIG.LOGIN_PAGE;
    }

    /**
     * Redirect to forbidden page
     */
    function redirectToForbidden() {
        window.location.href = CONFIG.FORBIDDEN_PAGE;
    }

    // ══════════════════════════════════════════════════════════
    // FIREBASE AUTH CHECK
    // ══════════════════════════════════════════════════════════

    /**
     * Check authentication status
     */
    function checkAuthentication() {
        return new Promise((resolve) => {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    // User is signed in
                    try {
                        // Fetch user profile from backend to get role
                        const token = await user.getIdToken();
                        const profile = await fetchUserProfile(token);
                        
                        resolve({
                            authenticated: true,
                            user: user,
                            profile: profile,
                            role: profile?.role || 'DONOR'
                        });
                    } catch (error) {
                        console.error('Error fetching profile:', error);
                        resolve({
                            authenticated: true,
                            user: user,
                            profile: null,
                            role: 'DONOR'
                        });
                    }
                } else {
                    // No user signed in
                    resolve({
                        authenticated: false,
                        user: null,
                        profile: null,
                        role: null
                    });
                }
            });
        });
    }

    /**
     * Fetch user profile from backend
     */
    async function fetchUserProfile(token) {
        try {
            const response = await fetch('/api/v1/users/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return await response.json();
            } else {
                console.warn('Failed to fetch profile:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }

    // ══════════════════════════════════════════════════════════
    // MAIN GUARD LOGIC
    // ══════════════════════════════════════════════════════════

    /**
     * ⭐ Main Auth Guard Function
     * Call this on page load to protect routes
     */
    window.authGuard = async function() {
        console.log('🔐 Auth Guard: Checking access for', getCurrentPath());

        // Check if current page needs protection
        if (!isProtectedRoute()) {
            console.log('✅ Public route, access granted');
            return true;
        }

        // Show loading indicator
        showLoadingScreen();

        // Check authentication
        const authState = await checkAuthentication();

        if (!authState.authenticated) {
            console.log('❌ Not authenticated, redirecting to login');
            redirectToLogin();
            return false;
        }

        console.log('✅ User authenticated:', authState.user.email);

        // Check role for admin routes
        if (isAdminRoute() && authState.role !== 'ADMIN') {
            console.log('❌ Insufficient permissions, redirecting to 403');
            hideLoadingScreen();
            redirectToForbidden();
            return false;
        }

        console.log('✅ Access granted');
        hideLoadingScreen();
        
        // Store user info globally for page use
        window.currentUser = authState.user;
        window.currentUserProfile = authState.profile;
        
        return true;
    };

    // ══════════════════════════════════════════════════════════
    // LOADING SCREEN HELPERS
    // ══════════════════════════════════════════════════════════

    function showLoadingScreen() {
        const loader = document.getElementById('auth-loading');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    function hideLoadingScreen() {
        const loader = document.getElementById('auth-loading');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    // ══════════════════════════════════════════════════════════
    // AUTO-RUN ON PROTECTED PAGES
    // ══════════════════════════════════════════════════════════

    /**
     * Automatically run guard if page has data-protected attribute
     * Add this to your protected pages: <body data-protected="true">
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (document.body.dataset.protected === 'true') {
                window.authGuard();
            }
        });
    } else {
        if (document.body.dataset.protected === 'true') {
            window.authGuard();
        }
    }

})();


/**
 * ═══════════════════════════════════════════════════════════
 * USAGE EXAMPLES:
 * ═══════════════════════════════════════════════════════════
 * 
 * Method 1: Auto-run (Recommended)
 * Add to your protected page's <body> tag:
 * 
 *   <body data-protected="true">
 * 
 * 
 * Method 2: Manual call
 * Call in your page's script:
 * 
 *   <script>
 *       window.authGuard().then(authorized => {
 *           if (authorized) {
 *               // Load page content
 *               initializePage();
 *           }
 *       });
 *   </script>
 * 
 * 
 * Method 3: Admin route protection
 * For admin pages, add:
 * 
 *   <body data-protected="true" data-admin-only="true">
 * 
 * ═══════════════════════════════════════════════════════════
 */
