# Project Structure

## 1. 30 000 ft view
```markdown
root
├─ apps                    → platform entry points
│   ├─ expo                → Expo app directory
│   └─ next                → Next.js app directory
├─ packages                → shared code (95% of your commits go here)
│   └─ app                 → contains business logic and shared components
├─ .codesandbox            → Codesandbox configuration
├─ .devcontainer           → VSCode devcontainer configuration
├─ .github                 → GitHub specific configurations
├─ .husky                  → Husky hooks configurations
├─ .yarn                   → Yarn workspaces configurations
├─ biome.json              → Biome configuration file
├─ lint-staged.config.mjs  → Lint-staged configuration file
├─ package.json            → Root package configuration
├─ README.md               → Project README file
├─ STRUCTURE.md            → Project structure documentation
├─ TASKS.md                → Task list documentation
├─ tsconfig.base.json      → Base TypeScript configuration
└─ yarn.lock               → Yarn lock file
```

## 2. `apps/` – platform shells (almost **no business logic**)
| Folder | Purpose | When you touch it |
|--------|---------|-------------------|
| `apps/expo` | Expo **router** (file-system routes) | add **native-only** screens, `app.json`, EAS config |
| `apps/next` | Next.js **pages + app router** (both work) | add **web-only** pages, SEO, `next.config.js` |

**Rule of thumb**  
If it imports `expo-*` → keep in `apps/expo`  
If it imports `next/*` → keep in `apps/next`  
Everything else lives in `packages/app`.

## 3. `packages/` – **shared** across every platform
| Package | Content | Typical daily work |
|---------|---------|--------------------|
| `packages/app` | **ALL screens, hooks, providers, utils** | you live here |
| `packages/config` | **Base configuration** for ESLint, TypeScript, Tamagui | touch once per project life |
| `packages/ui` | **Tamagui design-system** components | build `<Button>`, `<Card>`, etc. |

## 4. Inside `packages/app` (the heart)
```markdown
components/        ← Reusable UI components
features/          ← Domain-specific features (auth, profile, etc.)
lib/              ← Utility functions and helpers
node_modules/      ← Local node modules (should be empty)
provider/         ← Context providers for state management
types.d.ts        ← Global TypeScript type declarations
```

**No `screens/` folder** – organise by **feature**, not by platform.  
Each feature exports a `*.native.tsx` **and/or** `*.tsx` file; Solito picks the right one at build time.

## 5. Tamagui-specific goodies already wired
| File | What it does |
|------|--------------|
| `tamagui.config.ts` | tokens, themes, fonts, media queries |
| `packages/ui/tamagui.ts` | re-exports everything → `import { Button, XStack } from '@my/ui'` |
| `babel.config.js` | `@tamagui/babel-plugin` **+ compiler** enabled (dev/prod flags) |
| `metro.config.js` | Metro plugin for **web-compatible** asset resolution |

## 6. Navigation: Solito + Expo Router
- **Expo Router** handles **file-system routing** on native.  
- **Solito** provides `<Link>` that compiles to:
  - `expo-router/link` on native
  - `next/link` on web  
- **Type-safe** routes auto-generated from `apps/expo/app/**` + `apps/next/pages/**`.

## 7. Typical daily flow
1. `cd apps/expo && yarn start`  
2. Work in `packages/app/features/auth/SignInScreen.tsx`  
3. Add UI atom in `packages/ui/components/Button.tsx`  
4. Commit → Turborepo caches native + web builds automatically.

## 8. What you can safely delete (mobile-only phase)
- `apps/next` entire folder  
- Any `*.web.tsx` files inside `packages/app`  
- `packages/config/next-config` (keep eslint/tsconfig)

> Deleting these **will not break** the Expo build—Solito will fall back to `.tsx` or `.native.tsx` files.

## 9. TL;DR mental model
> **“Expo Router drives the routes, Tamagui drives the UI, Solito keeps them in sync, and 99 % of your code lives in `packages/app`.”**

## 10. Quick reference cheatsheet
| I want to… | Put it here |
|------------|-------------|
| Add a new screen | `apps/expo/app/<route>.tsx` |
| Share screen code | `packages/app/features/<name>/Screen.tsx` |
| Build a UI atom | `packages/ui/components/<Atom>.tsx` |
| Add auth logic | `packages/app/features/auth/*.ts` |
| Add a hook | `packages/app/hooks/<name>.ts` |
| Add a type | `packages/app/types/<name>.ts` |
| Add an icon | `yarn workspace ui icon:add <svg-file>` |
| Add a font | `yarn workspace ui font:add <font-name>` |

---
Template version: Tamagui free starter ≥ 1.132  