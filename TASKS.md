# 📋 Nutrition App Development Tasks - ship 6-week MVP that beats MacroFactor on (1) real-time auto-adjust, (2) 3-click onboarding, (3) fast barcode, (4) price.

---

## 🔧 Step 1: Set Up Authentication Flow (FULL DETAIL)
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

## 🧍 Step 2: Build Onboarding Flow (INCLUDES HEALTH IMPORT)
**Goal**: Collect profile → calc TDEE → save targets → mark onboarded.

| Task ID | Description | Acceptance Criteria | Files |
|---------|-------------|---------------------|-------|
| 2.1 | Onboarding navigator | No header back btn on step 1 | `apps/expo/app/onboarding/_layout.tsx` |
| 2.2 | Basic-info screen | Validation before continue | `apps/expo/app/onboarding/01-basic-info.tsx` |
| 2.2a | **ADD** Apple/Google Health import btn | Imports last 30 days weight in 1 tap | `packages/app/hooks/useHealthData.ts` |
| 2.3 | Body-measure screen | Real-time BF%, optional skip | `apps/expo/app/onboarding/02-body-measurements.tsx` |
| 2.3a | **ADD** “Quick-import last 30 days” switch | Removes 15-field pain | — |
| 2.4 | Goals screen | Slider −1 kg → +1 kg/week | `apps/expo/app/onboarding/03-goals.tsx` |
| 2.5 | Review screen | Displays macros, CTA → start | `apps/expo/app/onboarding/04-review.tsx` |
| 2.5a | **ADD** macro-style picker (Balanced / High-carb / Low-carb) | Needed for refeed logic later | — |
| 2.6 | Onboarding store | Zustand, typed state, persist | `packages/app/store/onboardingStore.ts` |
| 2.7 | Calc utils | Unit tests ≥ 90% coverage | `packages/app/utils/calculations.ts` |
| 2.7a | **UPDATE** calc utils → export `goalToWeeklyRate()` & `macroSplit()` | Supports % BW + macro style | — |
| 2.8 | DB schema | Migration runs, RLS enabled | `supabase/migrations/001_create_users_table.sql` |
| 2.8a | **ADD** col `auto_adjust boolean default false` to users | Pay-wall flag | — |
| 2.8b | **ADD** table `targets_history` (keeps every auto-adjust row) | Trend guard-rail audit trail | — |
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

## 🆕  NEW TASK BLOCK: Real-Time Auto-Adjust (Edge Function)

| Task ID | Description | Acceptance Criteria | Files |
|---------|-------------|---------------------|-------|
| A1 | Create Supabase Edge Function `auto_adjust` | Deploys, no type errors | `supabase/functions/auto-adjust/index.ts` |
| A2 | Logic: ≥3 weights in 10 d → regression slope | Unit test ±1 kcal vs sheet | `packages/app/utils/__tests__/autoAdjust.test.ts` |
| A3 | Enforce guard-rail: if scale↓ but trend↑ → freeze 3 d | Test case inside A2 | — |
| A4 | Insert new targets into `targets_history` | Row written, RLS ok | — |
| A5 | Trigger: `after insert` on `weights` table | SQL trigger calls edge hook | `supabase/migrations/002_add_adjust_trigger.sql` |
| A6 | Push notification “+120 kcal today” | Works on iOS/Android | `packages/app/lib/notifyTargetChange.ts` |
| A7 | Pay-wall check: `users.auto_adjust = true` | Free users skip function | — |

---

## 🆕  NEW TASK BLOCK: Barcode & Food Logger (MVP scope)

| Task ID | Description | Acceptance Criteria | Files |
|---------|-------------|---------------------|-------|
| B1 | Install `expo-barcode-scanner` | No permission crash | — |
| B2 | Cache USDA 2 000 whole foods in SQLite | &lt; 3 MB bundle growth | `assets/db/usda.sql lite` |
| B3 | Search screen: local FTS + debounce 300 ms | &lt;150 ms search | `apps/expo/app/food/search.tsx` |
| B4 | Barcode: hit OpenFoodFacts free tier (≤500/day) | Falls back to manual | `packages/app/services/barcodeLookup.ts` |
| B5 | Quick-add “Calories only” row | Saves w/ 0 macros | `apps/expo/app/food/quick-add.tsx` |
| B6 | Day view grouped by meal | Swipe delete, edit qty | `apps/expo/app/daily-log.tsx` |
| B7 | Macro ring (today vs target) | Uses Tamagui SVG | `packages/ui/components/MacroRing.tsx` |

---

## 🆕  NEW TASK BLOCK: Pricing & Pay-wall

| Task ID | Description | Acceptance Criteria | Files |
|---------|-------------|---------------------|-------|
| C1 | RevenueCat SDK install | Products fetched sandbox | `packages/app/lib/revenuecat.ts` |
| C2 | Create products: monthly $2.99, annual $19.99 | 15% store fee after $1 M | App Store Connect + Play Console |
| C3 | Gate auto-adjust (A5) & guard-rail (A3) | Free = static targets | `packages/app/hooks/usePaywall.ts` |
| C4 | Offer 7-day free trial | Converts &gt;30% trials | — |
| C5 | Web landing w/ Stripe annual $19.99 | Keep 90% after Stripe | `apps/next/pages/pricing.tsx` |

---

## 🆕  NEW TASK BLOCK: Social Proof (Zero Backend)

| Task ID | Description | Acceptance Criteria | Files |
|---------|-------------|---------------------|-------|
| D1 | Weekly summary screen | Shows % target hit, rank | `apps/expo/app/summary/index.tsx` |
| D2 | Pre-formatted screenshot | 1080×1920, dark & light | `packages/app/utils/shareImage.ts` |
| D3 | Share button → #LogSmarter | Copy includes referral code | — |

---

## 🆕  NEW TASK BLOCK: Optional Micronutrient “Fortified Estimate”

| Task ID | Description | Acceptance Criteria | Files |
|---------|-------------|---------------------|-------|
| E1 | Add cols `mg_magnesium, mg_iron …` to food_cache | USDA avg if null | Migration |
| E2 | Toggle in settings (default OFF) | Label shown “~estimated” | `apps/expo/app/settings/nutrients.tsx` |

---

## 📅 UPDATED TIME GRID (6 weeks solo)

| Week | Focus |
|------|-------|
| 1 | Finish onboarding mods (2.2a-2.8b) |
| 2 | Edge function auto-adjust (A1-A7) |
| 3 | Food logger + barcode (B1-B7) |
| 4 | Pay-wall & RevenueCat (C1-C5) |
| 5 | Social proof + polish (D1-D3, E1-E2) |
| 6 | QA, TestFlight, collect Reddit testers |

---

## 🧪 NEW MVP Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Day-7 log adherence | ≥60% | Proves logger usable |
| Weight entries / user | ≥5 in 14 d | Enough data for adjust |
| Auto-adjust trial start | ≥30% of MAU | Beats MF no-free-tier |
| Crash-free sessions | ≥99% | Store rating protection |
| Avg onboarding time | ≤45s | Beats MF 5-min setup |

---

## 🏁  Definition of MVP Done

1. User can: import weight history → log food → see macro ring → get **instant** calorie change notification.  
2. Pay-wall triggers only on auto-adjust; everything else free.  
3. Barcode scan &lt;1s, finds food ≥80% of time.  
4. Build passes lint, type-check, TestFlight, and 10 real users convert to trial.

---

Ready to code—pick task 1.7 (auth storage) or A1 (edge function) and branch!