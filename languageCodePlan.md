Feature 3 — Language Switching (i18n) — Phased
Current state: LanguageContext.tsx + translations.ts exist with partial Vietnamese coverage; Settings UI already built; language stored in localStorage (per-device, not per-user).

Architecture: English text = key; Vietnamese value in vi.json. setLanguage() persists to the backend via PUT /users/me/profile (cross-device); localStorage acts as a cache for the pre-auth / loading state. The user_profiles table gets a new language column.

Phase 1 Steps
Backend (user-service) — parallel with frontend infrastructure work:

DB migration: add language VARCHAR(10) DEFAULT 'en' to user_profiles table
UserProfileEntity.java — add @Column(name = "language") private String language;
UserProfileResponseDTO.java — add String language to the record
UserService.java → updateOwnProfile() — handle "language" key in the existing map-update logic
Verify GET /users/me includes language in its response
Frontend infrastructure — parallel with backend:
6. Create src/locales/en.json — identity map (key = English value)
7. Create src/locales/vi.json — migrate all keys from translations.ts + add Phase 1 keys
8. Update LanguageContext.tsx:

Import JSON files instead of translations.ts
On mount: seed language from currentUser.language (via useAuth())
setLanguage(lang): call PUT /users/me/profile { language: lang } and also update localStorage as cache
Use localStorage as fallback while user is loading or unauthenticated
Phase 1 translation coverage — depends on steps 6–8:
9. src/components/navigation/Sidebar.tsx — nav item labels
10. src/components/common/Header.tsx — header UI labels
11. src/features/settings/pages/SettingsPage.tsx — fix missing vi.json keys for all strings that already call t()
12. Common reusable components (buttons: Save, Cancel, Delete, Add, Upload, etc.)

Phases 2 & 3 (future implementation passes):

Phase 2: features/projects/ + features/tasks/ pages and all their components
Phase 3: Announcements, Chat, Profile, Positions, Admin, Dashboard
Relevant files:

UserProfileEntity.java
UserProfileResponseDTO.java
UserService.java
frontend/main-webapp/src/locales/en.json — NEW
frontend/main-webapp/src/locales/vi.json — NEW
translations.ts — remove after migration
LanguageContext.tsx