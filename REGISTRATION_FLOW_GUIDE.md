# Multi-Step Registration Flow - Implementation Guide

## Overview
Implemented a complete 3-step registration system with state persistence, password visibility toggles, and legal document navigation.

## Registration Steps

### **Step 1: Basic Information**
- Full Name (required)
- Email Address (required)
- Phone Number (required)
- Button: "Next: Medical Info →"

### **Step 2: Medical & Location**
- Blood Group (required) - dropdown
- Gender (required) - Male/Female/Other
- Date of Birth (required)
- **Location Section** with cascading dropdowns:
  - Division (optional)
  - District (optional)
  - Upazila (optional)
- Last Blood Donation Date (optional)
- Buttons: "← Back" | "Next: Set Password →"

### **Step 3: Password & Agreement**
- Password (required, min 6 chars) - with eye icon to show/hide
- Confirm Password (required) - with eye icon to show/hide
- Checkbox: "I agree to the Privacy Policy and Terms & Conditions" (required)
  - Privacy Policy and Terms & Conditions are clickable links
- Buttons: "← Back" | "Complete Registration"

## Key Features

### ✅ Progress Indicator
- Visual progress bar showing Steps 1, 2, 3
- Completed steps show checkmark (✓)
- Active step highlighted in red
- Progress lines connect steps

### ✅ Password Visibility Toggle
- Eye icon (👁️) next to password fields
- Click to toggle between show/hide
- Changes to closed eye (🙈) when password is visible
- Separate toggle for password and confirm password

### ✅ Legal Documents
- **Privacy Policy** page at `/privacy-policy`
- **Terms & Conditions** page at `/terms-conditions`
- Both pages have:
  - Back button using `javascript:history.back()`
  - Returns to exact registration step user was on
  - Full legal content with proper formatting

### ✅ State Persistence
- Uses `sessionStorage` to save:
  - Current step number
  - All form data from all steps
- When user clicks Privacy Policy/Terms:
  - Current state is saved
  - User navigates to legal page
  - Clicks back button
  - Returns to exact same step with all data preserved
- State cleared after successful registration

### ✅ Location Hierarchy
- Division → District → Upazila cascade
- Uses `bd-locations.js` for Bangladesh administrative areas
- Automatically populates districts when division selected
- Automatically populates upazilas when district selected

### ✅ Form Validation
- Required field validation
- Email format validation
- Password match validation
- Minimum password length (6 characters)
- Privacy policy agreement validation

### ✅ Error Handling
- Clear error messages for:
  - Missing required fields
  - Password mismatch
  - Email already in use
  - Weak password
  - Network errors
- Success message on completion
- Auto-hide errors after 5 seconds

## Backend Updates

### Database Models Updated
1. **User.java** - Added fields:
   - `gender` (String)
   - `dateOfBirth` (LocalDate)

2. **UserRegistrationDto.java** - Added fields:
   - `gender`
   - `dateOfBirth`
   - `division`

3. **UserUpdateDto.java** - Added fields:
   - `gender`
   - `dateOfBirth`

4. **UserService.java** - Updated to save new fields

### New Routes Added
- `/privacy-policy` → `privacy-policy.html`
- `/terms-conditions` → `terms-conditions.html`

## Files Created/Modified

### Created:
- `src/main/resources/static/js/register.js` - Multi-step registration logic
- `src/main/resources/templates/privacy-policy.html` - Privacy policy page
- `src/main/resources/templates/terms-conditions.html` - Terms & conditions page
- `REGISTRATION_FLOW_GUIDE.md` - This documentation

### Modified:
- `src/main/resources/templates/register.html` - 3-step form UI
- `src/main/java/com/example/blood_donation/model/User.java` - Added gender, DOB
- `src/main/java/com/example/blood_donation/dto/UserRegistrationDto.java` - Added fields
- `src/main/java/com/example/blood_donation/dto/UserUpdateDto.java` - Added fields
- `src/main/java/com/example/blood_donation/service/UserService.java` - Handle new fields
- `src/main/java/com/example/blood_donation/controller/PageController.java` - Added routes

## User Flow Example

1. User visits `/register`
2. Fills Step 1: Name, Email, Phone → Clicks "Next"
3. Fills Step 2: Blood group, Gender, DOB, Location → Clicks "Next"
4. Fills Step 3: Password → Checks "I agree" checkbox
5. User clicks "Privacy Policy" link
6. Privacy Policy page opens
7. User reads policy, clicks "← Back"
8. Returns to Step 3 with all data intact
9. User clicks "Complete Registration"
10. Firebase account created
11. Profile saved to MongoDB
12. Redirected to `/profile` with all information auto-filled

## Profile Auto-Fill

After registration, user's profile page automatically shows:
- Name (from Step 1)
- Email (from Step 1)
- Phone (from Step 1)
- Blood Group (from Step 2)
- Gender (from Step 2)
- Date of Birth (from Step 2)
- Location: Division, District, Upazila (from Step 2)
- Last Donation Date (from Step 2, if provided)

Users can edit any of these details from their profile page later.

## Testing Checklist

- [ ] Step 1 → Step 2 navigation
- [ ] Step 2 → Step 3 navigation
- [ ] Back buttons work correctly
- [ ] Progress indicator updates properly
- [ ] Password eye icons toggle visibility
- [ ] Privacy Policy link opens correct page
- [ ] Terms & Conditions link opens correct page
- [ ] Back from legal pages returns to correct step
- [ ] Form data preserved after back navigation
- [ ] Location cascade (Division → District → Upazila) works
- [ ] Form validation shows appropriate errors
- [ ] Checkbox validation (must agree to proceed)
- [ ] Firebase account creation
- [ ] MongoDB profile save
- [ ] Redirect to profile after success
- [ ] Profile shows all registered information

## Security Notes

- Passwords never stored in plain text (handled by Firebase)
- Form data temporarily in sessionStorage (cleared after registration)
- Token stored in localStorage for authenticated requests
- Backend validates all inputs
- Privacy policy and terms clearly presented

---

**Status**: ✅ Complete and Ready for Testing
