# Blood Donation Management System - Technical Requirements Document

## Executive Summary

This document outlines the complete technical architecture for a Blood Donation Management Web Application with a **React.js Frontend** and **Spring Boot + MongoDB Backend** (already implemented). The system enables efficient blood donor-patient matching, emergency request management, and a 90-day donation cooldown tracking system.

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### Technology Stack

#### Frontend
- **Framework**: React.js 18+ with React Router v6
- **State Management**: Context API + React Query (for server state)
- **Authentication**: Firebase Authentication
- **Styling**: Tailwind CSS / Material-UI
- **HTTP Client**: Axios
- **Build Tool**: Vite / Create React App

#### Backend (Existing)
- **Framework**: Spring Boot 3.5.3
- **Database**: MongoDB Atlas
- **Authentication**: Firebase Admin SDK
- **Security**: Spring Security + Custom JWT Filter
- **API**: RESTful API (already implemented)

---

## 2. CORE FEATURES & REQUIREMENTS

### 2.1 Authentication & Authorization

#### User Roles
1. **GUEST** - Unauthenticated users
2. **DONOR/USER** - Registered donors
3. **ADMIN** - System administrators

#### Access Control Matrix

| Feature | Guest | User/Donor | Admin |
|---------|-------|------------|-------|
| View Home Page | ✅ | ✅ | ✅ |
| Search Donors (Public) | ✅ | ✅ | ✅ |
| View Active Requests | ✅ | ✅ | ✅ |
| Login/Register | ✅ | ❌ | ❌ |
| View Dashboard | ❌ | ✅ | ✅ |
| Create Blood Request | ❌ | ✅ | ✅ |
| Respond to Request | ❌ | ✅ | ✅ |
| View My Requests | ❌ | ✅ | ✅ |
| Toggle Availability | ❌ | ✅ | ✅ |
| View Donation History | ❌ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Delete Requests | ❌ | ❌ | ✅ |

### 2.2 Donor Availability Engine

#### 90-Day Cooldown Logic
- When a donor marks "Donated Today":
  - `lastDonationDate` is set to current date
  - `available` flag is set to `false`
  - Backend automatically calculates next eligible donation date
- Scheduled job (already implemented in `AvailabilityScheduler.java`) runs daily to:
  - Check if 90 days have passed since `lastDonationDate`
  - Auto-update `available = true` when cooldown expires

#### Frontend Requirements
- Display availability toggle on dashboard
- Show countdown timer: "Available in X days"
- Disable toggle during cooldown period
- Visual indicator (badge/icon) showing availability status

### 2.3 Emergency Blood Request System

#### Request Workflow
1. **Creation**: Authenticated user submits request with:
   - Patient name
   - Blood group required
   - Hospital name & district
   - Units needed
   - Contact number
   - Date needed
   - Urgency level (optional)

2. **Notification**: Backend matches:
   - Blood group compatibility
   - Location (district/upazila)
   - Availability status

3. **Response**: Donors can:
   - Offer to donate
   - Withdraw offer
   - View requester contact (only after responding)

4. **Completion**: Requester can:
   - Mark as FULFILLED
   - Update status to CANCELLED
   - View all donor responses

### 2.4 Smart Routing & Redirect Flow

#### Protected Route Logic
```
User clicks protected route (e.g., /dashboard)
↓
Check authentication status
↓
If NOT authenticated:
  - Save intended destination to state/query param
  - Redirect to /login?redirectTo=/dashboard
↓
User logs in successfully
↓
Read redirectTo parameter
↓
Navigate to original destination OR default to /dashboard
```

---

## 3. FRONTEND ARCHITECTURE

### 3.1 Folder Structure

```
blood-donation-frontend/
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
│       └── images/
│
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Root component
│   │
│   ├── components/                 # Reusable components
│   │   ├── common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── Toast.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── ProtectedRoute.jsx   # ⭐ Core protected route wrapper
│   │   │   ├── AdminRoute.jsx
│   │   │   └── AuthGuard.jsx
│   │   │
│   │   ├── donor/
│   │   │   ├── DonorCard.jsx
│   │   │   ├── DonorSearchFilter.jsx
│   │   │   └── AvailabilityToggle.jsx
│   │   │
│   │   ├── request/
│   │   │   ├── BloodRequestCard.jsx
│   │   │   ├── CreateRequestForm.jsx
│   │   │   └── DonorResponseList.jsx
│   │   │
│   │   └── dashboard/
│   │       ├── StatsCard.jsx
│   │       ├── DonationHistoryTable.jsx
│   │       └── CooldownTimer.jsx
│   │
│   ├── pages/                      # Page components
│   │   ├── public/
│   │   │   ├── HomePage.jsx
│   │   │   ├── SearchDonorsPage.jsx
│   │   │   ├── ActiveRequestsPage.jsx
│   │   │   ├── LoginPage.jsx         # ⭐ Implements redirect back logic
│   │   │   └── RegisterPage.jsx
│   │   │
│   │   ├── protected/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── CreateRequestPage.jsx
│   │   │   ├── MyRequestsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── NotificationsPage.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageUsers.jsx
│   │   │   └── ManageRequests.jsx
│   │   │
│   │   └── error/
│   │       ├── NotFoundPage.jsx      # ⭐ 404 Page
│   │       └── ForbiddenPage.jsx     # ⭐ 403 Page
│   │
│   ├── contexts/                   # Context providers
│   │   ├── AuthContext.jsx          # ⭐ Firebase auth state
│   │   ├── UserContext.jsx          # User profile data
│   │   └── ToastContext.jsx
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useUser.js
│   │   ├── useProtectedRoute.js
│   │   └── useDonorSearch.js
│   │
│   ├── services/                   # API services
│   │   ├── api.js                   # Axios instance
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── requestService.js
│   │   └── donorService.js
│   │
│   ├── utils/                      # Utility functions
│   │   ├── constants.js
│   │   ├── dateHelpers.js
│   │   ├── validators.js
│   │   └── bloodGroupHelpers.js
│   │
│   ├── config/
│   │   ├── firebase.js              # Firebase configuration
│   │   └── routes.js                # Route constants
│   │
│   └── styles/
│       ├── index.css
│       └── tailwind.css
│
├── .env                            # Environment variables
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 4. ROUTING ARCHITECTURE

### 4.1 Route Configuration

```javascript
// src/config/routes.js

export const ROUTES = {
  // Public Routes
  HOME: '/',
  SEARCH_DONORS: '/search',
  ACTIVE_REQUESTS: '/requests',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Protected Routes (Require Authentication)
  DASHBOARD: '/dashboard',
  CREATE_REQUEST: '/request-blood',
  MY_REQUESTS: '/my-requests',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  
  // Admin Routes (Require ADMIN role)
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_REQUESTS: '/admin/requests',
  
  // Error Pages
  NOT_FOUND: '/404',
  FORBIDDEN: '/403',
};
```

### 4.2 Route Protection Levels

1. **Public Routes** - No authentication required
2. **Protected Routes** - Requires authentication (any logged-in user)
3. **Admin Routes** - Requires authentication + ADMIN role
4. **Special Routes** - Error pages (404, 403)

---

## 5. KEY IMPLEMENTATION DETAILS

### 5.1 Authentication Flow

#### Firebase Integration
```javascript
// Login Process
1. User submits credentials → Firebase Authentication
2. Firebase returns ID Token
3. Token sent to backend via Authorization header
4. Backend validates token via Firebase Admin SDK
5. User data fetched from MongoDB
6. Frontend stores auth state in Context
```

#### Token Management
- ID Token stored in memory (AuthContext)
- Refresh token handled by Firebase SDK
- Token automatically added to API requests via Axios interceptor

### 5.2 Protected Route Implementation Strategy

#### Core Logic
```
1. Wrap protected pages with <ProtectedRoute>
2. Check if user is authenticated
3. If NO:
   - Capture current location
   - Redirect to /login with state
4. If YES:
   - Check role requirements (if admin route)
   - Render component if authorized
   - Show 403 page if unauthorized
```

### 5.3 Database Schema (MongoDB)

#### User Collection (Existing)
```javascript
{
  _id: ObjectId,
  firebaseUid: String (unique, indexed),
  name: String,
  email: String (unique, indexed),
  phone: String,
  bloodGroup: String, // A+, A-, B+, B-, O+, O-, AB+, AB-
  district: String,
  upazila: String,
  division: String,
  latitude: Double,
  longitude: Double,
  locationUpdatedAt: DateTime,
  lastDonationDate: Date,      // ⭐ Last donation date
  available: Boolean,            // ⭐ Availability status
  role: String,                  // DONOR, USER, ADMIN
  createdAt: DateTime,
  active: Boolean,
  profilePhotoUrl: String
}
```

#### BloodRequest Collection (Existing)
```javascript
{
  _id: ObjectId,
  patientName: String,
  bloodGroup: String,
  hospitalName: String,
  district: String,
  unitsNeeded: Number,
  contactNumber: String,
  dateNeeded: Date,
  status: String,                // PENDING, FULFILLED, CANCELLED
  createdAt: DateTime,
  requestedByUid: String,
  requestedByName: String,
  donorResponses: [              // ⭐ Embedded donor responses
    {
      donorUid: String,
      donorName: String,
      donorPhone: String,
      donorBloodGroup: String,
      respondedAt: DateTime,
      status: String             // OFFERED, WITHDRAWN
    }
  ]
}
```

#### DonationHistory Collection (Existing)
```javascript
{
  _id: ObjectId,
  donorUid: String (indexed),
  recipientName: String,
  hospitalName: String,
  bloodGroup: String,
  unitsGiven: Number,
  donationDate: Date,
  notes: String,
  createdAt: DateTime
}
```

---

## 6. API ENDPOINTS (Already Implemented)

### 6.1 User Endpoints
- `POST /api/v1/users/register` - Register new user
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile
- `PATCH /api/v1/users/me/location` - Update location

### 6.2 Donor Search
- `GET /api/v1/donors/search?bloodGroup=A+&district=Dhaka` - Search donors

### 6.3 Blood Request
- `POST /api/v1/requests` - Create blood request
- `GET /api/v1/requests` - Get all pending requests
- `GET /api/v1/requests/my` - Get my requests (protected)
- `PATCH /api/v1/requests/{id}/status` - Update request status
- `PUT /api/v1/requests/{id}` - Edit request
- `POST /api/v1/requests/{id}/respond` - Respond to request
- `DELETE /api/v1/requests/{id}/respond` - Withdraw response
- `GET /api/v1/requests/{id}/responses` - Get donor responses

### 6.4 Donation History
- `POST /api/v1/donations/log` - Log donation
- `GET /api/v1/donations/my` - Get my donation history
- `GET /api/v1/donations/my/count` - Get donation count

### 6.5 Admin Endpoints
- `GET /api/v1/admin/requests?page=0&size=10&status=ALL`
- `GET /api/v1/admin/users?page=0&size=10`
- `DELETE /api/v1/admin/requests/{id}`
- `PATCH /api/v1/admin/users/{id}/deactivate`
- `PATCH /api/v1/admin/users/{id}/role`

### 6.6 Stats
- `GET /api/v1/stats` - Get system statistics

---

## 7. FRONTEND REQUIREMENTS

### 7.1 Must-Have Pages

#### Public Pages
1. **Home Page** (`/`)
   - Hero section with CTA
   - Key statistics (total donors, lives saved)
   - How it works section
   - Emergency helpline
   - Recent requests preview

2. **Search Donors** (`/search`)
   - Filter by blood group, district, upazila
   - Display donor cards (name, blood group, location only)
   - No contact info visible to guests
   - Login prompt to see full details

3. **Active Requests** (`/requests`)
   - List all pending blood requests
   - Filter by blood group, location
   - Login required to respond

4. **Login Page** (`/login`)
   - Email/password login
   - Google sign-in
   - Remember redirect destination
   - Link to register

5. **Register Page** (`/register`)
   - Multi-step form
   - Blood group selection
   - Location picker
   - Terms & conditions

#### Protected Pages
1. **Dashboard** (`/dashboard`)
   - Welcome message
   - Availability toggle with cooldown timer
   - Quick stats (donations made, pending requests)
   - Recent donation history
   - Shortcuts to create request, search donors

2. **Create Request** (`/request-blood`)
   - Form with validation
   - Auto-fill user location
   - Urgency level selection
   - Preview before submit

3. **My Requests** (`/my-requests`)
   - List of user's requests
   - Status badges
   - View donor responses
   - Edit/cancel options
   - Mark as fulfilled

4. **Profile** (`/profile`)
   - Edit personal info
   - Update location
   - Change password
   - Donation statistics

5. **Notifications** (`/notifications`)
   - New blood requests matching criteria
   - Responses to your requests
   - System announcements

#### Admin Pages
1. **Admin Dashboard** (`/admin`)
   - System-wide statistics
   - Recent activity
   - Pending verifications

2. **Manage Users** (`/admin/users`)
   - User list with filters
   - Role management
   - Deactivate/reactivate users

3. **Manage Requests** (`/admin/requests`)
   - All requests (pending/fulfilled/cancelled)
   - Delete fraudulent requests
   - View details

#### Error Pages
1. **404 Not Found** (`/404` or `/*`)
   - Custom styled page
   - "Back to Home" button
   - Search bar

2. **403 Forbidden** (`/403`)
   - "You don't have permission"
   - "Go back" button
   - Contact admin link

---

## 8. UI/UX REQUIREMENTS

### 8.1 Design Principles
- **Mobile-first**: Responsive design for all screen sizes
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Fast load times, lazy loading
- **Consistency**: Unified color scheme and typography

### 8.2 Key UI Components
- Loading states (skeletons, spinners)
- Toast notifications (success, error, info)
- Confirmation modals
- Form validation feedback
- Empty states
- Pagination

### 8.3 Blood Group Color Coding
```javascript
const BLOOD_GROUP_COLORS = {
  'A+': '#E53E3E',  // Red
  'A-': '#DD6B20',  // Orange
  'B+': '#D69E2E',  // Yellow
  'B-': '#38A169',  // Green
  'O+': '#3182CE',  // Blue
  'O-': '#805AD5',  // Purple
  'AB+': '#D53F8C', // Pink
  'AB-': '#718096', // Gray
};
```

---

## 9. SECURITY CONSIDERATIONS

### 9.1 Frontend Security
- Never store sensitive data in localStorage
- Sanitize user inputs
- Implement CSRF protection
- Use HTTPS only
- Content Security Policy (CSP)

### 9.2 Backend Security (Already Implemented)
- Firebase token validation
- Rate limiting (Bucket4j)
- Input validation
- MongoDB injection prevention
- CORS configuration

### 9.3 Privacy
- Hide donor contact info from public search
- Only reveal after response commitment
- Option to hide profile from search
- GDPR compliance (data export/deletion)

---

## 10. PERFORMANCE REQUIREMENTS

### 10.1 Frontend Performance
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90
- Code splitting per route
- Image optimization (WebP, lazy loading)
- CDN for static assets

### 10.2 Backend Performance (Already Optimized)
- API response time: < 300ms
- Database queries optimized with indexes
- Connection pooling
- Caching strategy (Redis - future)

---

## 11. TESTING REQUIREMENTS

### 11.1 Frontend Testing
- **Unit Tests**: Jest + React Testing Library
  - Component rendering
  - Hook logic
  - Utility functions
  
- **Integration Tests**:
  - Protected route behavior
  - Form submissions
  - API integration
  
- **E2E Tests**: Cypress / Playwright
  - Complete user flows
  - Authentication scenarios
  - Critical paths

### 11.2 Test Coverage Goals
- Unit tests: > 80%
- Integration tests: Critical paths
- E2E tests: Happy paths + edge cases

---

## 12. DEPLOYMENT STRATEGY

### 12.1 Frontend Deployment
- **Hosting**: Vercel / Netlify / AWS Amplify
- **CI/CD**: GitHub Actions
- **Environment Variables**:
  ```
  VITE_API_BASE_URL=https://api.blooddonation.com
  VITE_FIREBASE_API_KEY=xxx
  VITE_FIREBASE_AUTH_DOMAIN=xxx
  VITE_FIREBASE_PROJECT_ID=xxx
  ```

### 12.2 Backend Deployment (Current)
- **Hosting**: Heroku / AWS / Railway
- **Database**: MongoDB Atlas
- **Monitoring**: Spring Boot Actuator

---

## 13. FUTURE ENHANCEMENTS

1. **Real-time Notifications**: WebSocket/Socket.io
2. **SMS Alerts**: Twilio integration
3. **Geolocation**: Auto-detect nearby donors
4. **Multilingual**: i18n support (Bengali, English)
5. **Progressive Web App**: Offline support
6. **Blood Bank Integration**: Connect with hospitals
7. **Donation Certificates**: Downloadable PDFs
8. **Gamification**: Badges, leaderboards
9. **Social Sharing**: Share requests on social media
10. **Analytics Dashboard**: Usage metrics

---

## 14. DEVELOPMENT TIMELINE

### Phase 1 (Weeks 1-2): Foundation
- Setup React project
- Configure Firebase
- Implement authentication flow
- Create ProtectedRoute component

### Phase 2 (Weeks 3-4): Public Pages
- Home page
- Search donors page
- Active requests page
- Error pages (404, 403)

### Phase 3 (Weeks 5-6): Protected Features
- Dashboard
- Create request
- My requests
- Profile management

### Phase 4 (Weeks 7-8): Admin & Polish
- Admin panel
- Donation history
- Notifications
- UI/UX refinements

### Phase 5 (Week 9): Testing & Deployment
- Testing
- Bug fixes
- Deployment
- Documentation

---

## 15. SUCCESS METRICS

### KPIs
- User registration rate
- Blood request fulfillment rate
- Average response time to requests
- Donor retention rate
- Search-to-contact conversion rate
- System uptime (> 99.5%)

---

## CONCLUSION

This document provides the complete technical blueprint for building a production-ready Blood Donation Management System. The architecture is scalable, secure, and user-centric, designed to save lives through efficient donor-patient matching.

**Next Steps**: Proceed to implementation phase with provided code templates.
