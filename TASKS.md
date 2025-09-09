# 📋 Nutrition App Development Tasks - Phase 1: Authentication & Onboarding

---

## 🔧 Step 1: Set Up Authentication Flow
**Goal**: Users can sign up, log in, and log out securely.

| Task ID | Description | Acceptance Criteria | Files / Commands |
|---------|-------------|---------------------|------------------|
| 1.1 | Install auth dependencies | No install errors, lock-file updated | `npm i @supabase/auth-helpers-react @supabase/auth-helpers-nextjs expo-secure-store` |
| 1.2 | Scaffold Auth context | TS errors = 0, exports typed | `packages/app/provider/AuthProvider.tsx` |
| 1.3 | Build `useAuth` hook | Returns `{user, signIn, signUp, signOut, loading, error}` | `packages/app/hooks/useAuth.ts` |
| 1.4 | Expo sign-in screen | Pixel-perfect with Figma, 100% width CTA | `apps/expo/app/auth/signin.tsx` |
| 1.5 | Expo sign-up screen | Shows password strength, links ToS | `apps/expo/app/auth/signup.tsx` |
| 1.6 | ProtectedRoute wrapper | Redirects unauthed → `/auth/signin` | `packages/app/components/ProtectedRoute.tsx` |
| 1.7 | Secure token storage | Works on iOS/Android/Web | `packages/app/utils/authStorage.ts` |
| 1.8 | End-to-end auth test | All flows pass manual QA | Record loom video |

---

## 🧍 Step 2: Build Onboarding Flow
**Goal**: Collect profile → calc TDEE → save targets → mark onboarded.

| Task ID | Description | Acceptance Criteria | Files |
|---------|-------------|---------------------|-------|
| 2.1 | Onboarding navigator | No header back btn on step 1 | `apps/expo/app/onboarding/_layout.tsx` |
| 2.2 | Basic-info screen | Validation before continue | `apps/expo/app/onboarding/01-basic-info.tsx` |
| 2.3 | Body-measure screen | Real-time BF%, optional skip | `apps/expo/app/onboarding/02-body-measurements.tsx` |
| 2.4 | Goals screen | Slider −1 kg → +1 kg/week | `apps/expo/app/onboarding/03-goals.tsx` |
| 2.5 | Review screen | Displays macros, CTA → start | `apps/expo/app/onboarding/04-review.tsx` |
| 2.6 | Onboarding store | Zustand, typed state, persist | `packages/app/store/onboardingStore.ts` |
| 2.7 | Calc utils | Unit tests ≥ 90% coverage | `packages/app/utils/calculations.ts` |
| 2.8 | DB schema | Migration runs, RLS enabled | `supabase/migrations/001_create_users_table.sql` |
| 2.9 | Supabase client fns | Typed with `database.types.ts` | `packages/app/utils/supabase.ts` |
| 2.10 | Onboarding service | Tx-like save, rollback on fail | `packages/app/services/onboardingService.ts` |

---

## 🧪 Step 3: Test Onboarding End-to-End

| Task ID | Description | Checklist | Owner |
|---------|-------------|-----------|-------|
| 3.1 | Write test plan | Happy + skip + error paths | QA (you) |
| 3.2 | Validate inputs | Age 13-100, wt 30-300, ht 100-250 | — |
| 3.3 | Calc accuracy | Spreadsheet parity ±1% | — |
| 3.4 | Data persistence | Row in `users`, flag = true | — |
| 3.5 | Error handling | Offline, 500, duplicate email | — |

---

## 📁 Step 4: Project Structure Cleanup

| Task ID | What | Where |
|-------|------|-------|
| 4.1 | Shared TS types | `packages/app/types/{user,onboarding}.ts` |
| 4.2 | Reusable UI comps | `packages/ui/components/{Button,Input,ProgressBar}.tsx` |
| 4.3 | Zod schemas | `packages/app/validation/onboardingSchemas.ts` |
| 4.4 | Formatters | `packages/app/utils/formatters.ts` |
| 4.5 | Constants | `packages/app/constants/index.ts` |

---

## ✅ Step 5: Checkpoint & Test

| Check | Item | Status |
|-------|------|--------|
| ☐ | Auth flows work on iOS / Android / Web | |
| ☐ | Onboarding &lt; 2 min, no jank | |
| ☐ | Accessible (labels, 44px tap, WCAG) | |
| ☐ | Secure (sanitized, RLS, HTTPS) | |
| ☐ | No TS errors, lint clean, tests green | |

---

## 🧭 Next Phase (after this)
1. Daily dashboard with macro rings  
2. Food search + USDA API  
3. Weight entry & trends  
4. TDEE auto-adjust algo

---

## 📅 Time Grid (realistic)
| Days | Tasks |
|------|-------|
| 1-2 | Step 1 (auth) |
| 3-5 | Step 2 (onboarding) |
| 6 | Step 3 (testing) |
| 7 | Step 4 (cleanup) |
| 8 | Buffer / review |

---

## 🆘 Quick Commands
```bash
# Run lint + typecheck
npm run lint && npm run type-check

# Run tests
npm test

# Open Supabase local studio
npx supabase status

# Generate new migration
npx supabase migration new &lt;name&gt;

# Build native
eas build --platform ios --profile preview