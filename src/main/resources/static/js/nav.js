/**
 * Shared navbar behaviour — hamburger, active route, auth UI, dropdown.
 */
(function () {
  'use strict';

  var hamburger = document.getElementById('nav-hamburger');
  var mobileMenu = document.getElementById('nav-mobile');
  var nav = document.getElementById('main-nav');

  hamburger && hamburger.addEventListener('click', function () {
    var open = hamburger.classList.toggle('open');
    mobileMenu && mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileMenu && mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      hamburger && hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger && hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  window.addEventListener('scroll', function () {
    nav && nav.classList.toggle('scrolled', window.scrollY > 50);
  });
  if (nav && window.scrollY > 50) nav.classList.add('scrolled');
  if (nav && !document.body.classList.contains('page-home')) nav.classList.add('scrolled');

  var path = window.location.pathname;
  var map = {
    '/search':        ['nav-link-search', 'mob-search'],
    '/request-blood': ['nav-link-request', 'mob-request'],
    '/profile':       ['mob-profile'],
    '/my-requests':   ['nav-link-my-requests', 'mob-my-requests'],
    '/inbox':         ['nav-link-inbox', 'mob-inbox'],
    '/login':         ['nav-link-login', 'mob-login'],
    '/register':      ['nav-link-register', 'mob-register'],
    '/admin/dashboard': ['mob-admin']
  };
  Object.keys(map).forEach(function (route) {
    if (path === route || path.startsWith(route + '/')) {
      map[route].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('nav-active');
      });
    }
  });

  function buildDropdownItems(role) {
    var items = document.getElementById('nav-dd-items');
    if (!items) return;
    items.innerHTML = '';

    var defs = [
      { label: 'Profile',          href: '/profile',           icon: '<i class="fas fa-user"></i>', cls: '' },
      { label: 'Admin Dashboard',  href: '/admin/dashboard',   icon: '<i class="fas fa-cog"></i>', cls: 'nav-dropdown-item--admin', roles: ['ADMIN'] }
    ];

    defs.forEach(function (d) {
      if (d.roles && d.roles.indexOf(role) === -1) return;
      var a = document.createElement('a');
      a.href = d.href;
      a.className = 'nav-dropdown-item ' + (d.cls || '');
      a.setAttribute('role', 'menuitem');
      a.innerHTML = '<span class="nav-dropdown-icon">' + d.icon + '</span>' + d.label;
      // Explicitly navigate on click — prevents any event interference
      a.addEventListener('click', function (e) {
        e.stopPropagation();
        var href = d.href;
        // Close dropdown first, then navigate
        if (dropMenu) dropMenu.classList.remove('open');
        if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
        window.location.href = href;
      });
      items.appendChild(a);
    });

    var divider = document.createElement('div');
    divider.className = 'nav-dropdown-separator';
    items.appendChild(divider);

    var logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'nav-dropdown-item nav-dropdown-item--logout';
    logoutBtn.setAttribute('role', 'menuitem');
    logoutBtn.id = 'nav-logout-btn';
    logoutBtn.innerHTML = '<span class="nav-dropdown-icon"><i class="fas fa-sign-out-alt"></i></span>Logout';
    items.appendChild(logoutBtn);
  }

  function updateDropdownHeader(name, role) {
    var ddName = document.getElementById('nav-dd-name');
    var ddRole = document.getElementById('nav-dd-role');
    var navName = document.getElementById('nav-profile-name');
    var initials = document.getElementById('nav-avatar-initials');
    if (ddName) ddName.textContent = name || 'User';
    if (ddRole) ddRole.textContent = role || 'DONOR';
    if (navName) navName.textContent = (name || 'Account').split(' ')[0];
    if (initials) {
      var parts = (name || 'U').trim().split(' ');
      initials.textContent = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }
  }

  function setProfilePhoto(url) {
    var avatar = document.getElementById('nav-profile-avatar');
    if (!avatar || !url) return;
    avatar.innerHTML = '<img src="' + url + '" alt="" />';
  }

  function applyAuthState(loggedIn) {
    var out = document.getElementById('nav-logged-out');
    var inn = document.getElementById('nav-logged-in');
    var mLogin = document.getElementById('mob-login');
    var mReg = document.getElementById('mob-register');
    var mLogout = document.getElementById('mob-logout');
    var mAdmin = document.getElementById('mob-admin');
    var mProfile = document.getElementById('mob-profile');
    var myRequestsLi = document.getElementById('nav-my-requests-li');
    var mobMyRequests = document.getElementById('mob-my-requests');
    var inboxLi = document.getElementById('nav-inbox-li');
    var mobInbox = document.getElementById('mob-inbox');

    var role = localStorage.getItem('hemo_user_role') || 'DONOR';
    var name = localStorage.getItem('hemo_user_name') || '';
    var photo = localStorage.getItem('hemo_user_photo') || '';

    if (loggedIn) {
      if (out) out.style.setProperty('display', 'none', 'important');
      if (inn) inn.style.setProperty('display', 'flex', 'important');
      if (mLogin) mLogin.style.setProperty('display', 'none', 'important');
      if (mReg) mReg.style.setProperty('display', 'none', 'important');
      if (mLogout) mLogout.style.removeProperty('display');
      if (mProfile) mProfile.style.removeProperty('display');
      if (mAdmin) mAdmin.style.setProperty('display', role === 'ADMIN' ? 'block' : 'none', 'important');
      if (myRequestsLi) myRequestsLi.style.removeProperty('display');
      if (mobMyRequests) mobMyRequests.style.removeProperty('display');
      if (inboxLi) inboxLi.style.removeProperty('display');
      if (mobInbox) mobInbox.style.removeProperty('display');
      updateDropdownHeader(name, role);
      buildDropdownItems(role);
      if (photo) setProfilePhoto(photo);
    } else {
      if (out) out.style.setProperty('display', 'flex', 'important');
      if (inn) inn.style.setProperty('display', 'none', 'important');
      if (mLogin) mLogin.style.removeProperty('display');
      if (mReg) mReg.style.removeProperty('display');
      if (mLogout) mLogout.style.setProperty('display', 'none', 'important');
      if (mProfile) mProfile.style.setProperty('display', 'none', 'important');
      if (mAdmin) mAdmin.style.setProperty('display', 'none', 'important');
      if (myRequestsLi) myRequestsLi.style.setProperty('display', 'none', 'important');
      if (mobMyRequests) mobMyRequests.style.setProperty('display', 'none', 'important');
      if (inboxLi) inboxLi.style.setProperty('display', 'none', 'important');
      if (mobInbox) mobInbox.style.setProperty('display', 'none', 'important');
    }
  }

  window._navApplyAuthState = applyAuthState;
  window._navSetProfilePhoto = setProfilePhoto;
  applyAuthState(!!localStorage.getItem('hemo_id_token'));

  var profileBtn = document.getElementById('nav-profile-btn');
  var dropMenu = document.getElementById('nav-dropdown-menu');

  profileBtn && profileBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = dropMenu.classList.toggle('open');
    profileBtn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', function (e) {
    if (dropMenu && dropMenu.classList.contains('open')) {
      if (!dropMenu.contains(e.target) && !profileBtn.contains(e.target)) {
        dropMenu.classList.remove('open');
        profileBtn.setAttribute('aria-expanded', 'false');
      }
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dropMenu && dropMenu.classList.contains('open')) {
      dropMenu.classList.remove('open');
      profileBtn && profileBtn.setAttribute('aria-expanded', 'false');
      profileBtn && profileBtn.focus();
    }
  });

  var mobLogout = document.getElementById('mob-logout');
  mobLogout && mobLogout.addEventListener('click', function (e) {
    e.preventDefault();
    window._hemoLogout && window._hemoLogout();
  });
})();
