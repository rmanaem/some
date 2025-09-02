# Nutrition App Technical Architecture
## Adaptive TDEE & Body Composition Tracking App

### Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Architecture](#api-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Core Algorithm Implementation](#core-algorithm-implementation)
7. [Authentication & Security](#authentication--security)
8. [Deployment & Infrastructure](#deployment--infrastructure)
9. [Development Phases](#development-phases)
10. [Performance Considerations](#performance-considerations)

---

## System Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Backend API   │    │    Database     │
│  (React Native) │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Local Storage  │    │  External APIs  │    │   File Storage  │
│ (AsyncStorage)  │    │ (USDA Food API) │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Features
- **Adaptive TDEE Algorithm**: Learns from user progress and adjusts recommendations
- **Body Composition Tracking**: Integrates body fat calculations with progress
- **Smart Macro Adjustments**: Automatic macro recalculation based on real results
- **Goal-Specific Recommendations**: Tailored advice based on training experience and goals

---

## Technology Stack

### Frontend (Mobile App)
```javascript
{
  "framework": "React Native + Expo",
  "language": "TypeScript",
  "navigation": "@react-navigation/native",
  "stateManagement": "@tanstack/react-query",
  "forms": "react-hook-form",
  "charts": "victory-native",
  "storage": "@react-native-async-storage/async-storage",
  "authentication": "@supabase/supabase-js",
  "ui": "react-native-elements",
  "icons": "@expo/vector-icons",
  "camera": "expo-camera",
  "notifications": "expo-notifications"
}
```

### Backend (API Server)
```javascript
{
  "runtime": "Node.js",
  "framework": "Express.js",
  "language": "TypeScript",
  "orm": "Prisma",
  "validation": "Joi",
  "authentication": "JWT + Supabase Auth",
  "cors": "cors",
  "rateLimit": "express-rate-limit",
  "logging": "winston",
  "testing": "Jest + Supertest"
}
```

### Database & Services
```yaml
database: PostgreSQL (via Supabase)
authentication: Supabase Auth
fileStorage: Supabase Storage
externalAPIs:
  - USDA FoodData Central API
  - Custom nutrition database
hosting:
  backend: Vercel/Railway
  database: Supabase
  mobile: Expo EAS
```

---

## Database Schema

### Core Tables
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Profile data
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  height_cm INTEGER,
  training_experience VARCHAR(20) CHECK (training_experience IN ('beginner', 'intermediate', 'advanced')),
  
  -- Goals
  primary_goal VARCHAR(20) CHECK (primary_goal IN ('build_muscle', 'lose_fat', 'maintain')),
  goal_weight_change_per_week DECIMAL(3,2), -- kg per week
  
  -- Current stats
  current_weight_kg DECIMAL(5,2),
  estimated_body_fat_percent DECIMAL(4,2),
  
  -- Calculated values
  base_tdee INTEGER,
  current_tdee INTEGER,
  target_calories INTEGER,
  target_protein_g INTEGER,
  target_fat_g INTEGER,
  target_carbs_g INTEGER
);

-- Daily weight entries
CREATE TABLE weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Body measurements for BF% calculation
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  waist_cm DECIMAL(5,2),
  neck_cm DECIMAL(5,2),
  hip_cm DECIMAL(5,2), -- for females
  calculated_body_fat_percent DECIMAL(4,2),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Food database
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  
  -- Per 100g nutritional info
  calories_per_100g INTEGER NOT NULL,
  protein_per_100g DECIMAL(5,2) NOT NULL,
  fat_per_100g DECIMAL(5,2) NOT NULL,
  carbs_per_100g DECIMAL(5,2) NOT NULL,
  fiber_per_100g DECIMAL(5,2),
  
  -- External API references
  usda_fdc_id INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily food logs
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  date DATE NOT NULL,
  
  -- Serving info
  serving_size_g DECIMAL(7,2) NOT NULL,
  
  -- Calculated nutrition (stored for performance)
  calories INTEGER NOT NULL,
  protein_g DECIMAL(5,2) NOT NULL,
  fat_g DECIMAL(5,2) NOT NULL,
  carbs_g DECIMAL(5,2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- TDEE adjustments history
CREATE TABLE tdee_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  
  -- Previous week's data
  avg_daily_calories INTEGER,
  avg_daily_weight_kg DECIMAL(5,2),
  expected_weight_change_kg DECIMAL(4,3),
  actual_weight_change_kg DECIMAL(4,3),
  
  -- Adjustments
  old_tdee INTEGER,
  new_tdee INTEGER,
  adjustment_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, week_start_date)
);

-- Progress photos
CREATE TABLE progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type VARCHAR(20) CHECK (photo_type IN ('front', 'side', 'back')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance
```sql
-- Essential indexes
CREATE INDEX idx_weight_entries_user_date ON weight_entries(user_id, date DESC);
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, date DESC);
CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, date DESC);
CREATE INDEX idx_tdee_adjustments_user_week ON tdee_adjustments(user_id, week_start_date DESC);
CREATE INDEX idx_foods_name ON foods USING gin(to_tsvector('english', name));
```

---

## API Architecture

### RESTful API Endpoints

#### Authentication
```typescript
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/profile
```

#### User Profile & Goals
```typescript
GET  /api/users/profile
PUT  /api/users/profile
POST /api/users/calculate-initial-macros
GET  /api/users/current-targets
```

#### Daily Tracking
```typescript
// Weight tracking
GET  /api/weight?start_date=2024-01-01&end_date=2024-01-31
POST /api/weight
PUT  /api/weight/:date
DELETE /api/weight/:date

// Food logging
GET  /api/food-logs?date=2024-01-15
POST /api/food-logs
PUT  /api/food-logs/:id
DELETE /api/food-logs/:id

// Body measurements
GET  /api/measurements?start_date=2024-01-01
POST /api/measurements
PUT  /api/measurements/:date
```

#### Food Database
```typescript
GET  /api/foods/search?q=chicken%20breast&limit=20
GET  /api/foods/:id
POST /api/foods (admin only)
```

#### Analytics & Progress
```typescript
GET  /api/analytics/progress?weeks=12
GET  /api/analytics/tdee-history
GET  /api/analytics/macro-trends
POST /api/analytics/trigger-adjustment (manual TDEE recalculation)
```

### API Response Format
```typescript
// Success response
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Error response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Middleware Stack
```typescript
// Express middleware order
app.use(cors());
app.use(helmet());
app.use(rateLimit());
app.use(express.json());
app.use(requestLogger);
app.use(authMiddleware); // for protected routes
app.use(validationMiddleware);
```

---

## Frontend Architecture

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Input, etc.)
│   ├── charts/          # Chart components
│   └── forms/           # Form-specific components
├── screens/             # Screen components
│   ├── auth/           # Login, signup screens
│   ├── onboarding/     # Initial setup flow
│   ├── tracking/       # Daily logging screens
│   ├── progress/       # Analytics and charts
│   └── profile/        # Settings and profile
├── navigation/          # Navigation configuration
├── services/           # API calls and external services
├── hooks/              # Custom React hooks
├── utils/              # Helper functions
├── types/              # TypeScript type definitions
├── constants/          # App constants
└── store/              # Global state management
```

### Key Components

#### Navigation Structure
```typescript
// Main navigation stack
const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="Onboarding" component={OnboardingStack} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  </NavigationContainer>
);

// Main app tabs
const MainTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="Today" component={TodayScreen} />
    <Tab.Screen name="Progress" component={ProgressScreen} />
    <Tab.Screen name="Foods" component={FoodSearchScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);
```

#### State Management with React Query
```typescript
// Custom hooks for API calls
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => api.get('/users/profile'),
  });
};

export const useFoodLogs = (date: string) => {
  return useQuery({
    queryKey: ['food-logs', date],
    queryFn: () => api.get(`/food-logs?date=${date}`),
  });
};

export const useLogFood = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (foodLog: FoodLogInput) => api.post('/food-logs', foodLog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-logs'] });
    },
  });
};
```

#### Key Screens

##### Today Screen (Main Dashboard)
```typescript
const TodayScreen = () => {
  const { data: profile } = useUserProfile();
  const { data: foodLogs } = useFoodLogs(today);
  const { data: weightEntry } = useWeightEntry(today);
  
  const dailyTotals = calculateDailyTotals(foodLogs);
  
  return (
    <ScrollView>
      <MacroRingsChart 
        current={dailyTotals} 
        targets={profile.targets} 
      />
      <WeightEntryCard weight={weightEntry} />
      <FoodLogsList logs={foodLogs} />
      <QuickAddButton />
    </ScrollView>
  );
};
```

##### Progress Screen (Analytics)
```typescript
const ProgressScreen = () => {
  const { data: progressData } = useProgressData(12); // 12 weeks
  
  return (
    <ScrollView>
      <WeightTrendChart data={progressData.weight} />
      <BodyFatChart data={progressData.bodyFat} />
      <TDEEAdjustmentsChart data={progressData.tdeeHistory} />
      <MacroTrendsChart data={progressData.macroTrends} />
    </ScrollView>
  );
};
```

---

## UI/UX Design System

### Design Philosophy
The app's UI/UX is designed around the core principle of **"Intelligent Simplicity"** - making complex nutritional science accessible through intuitive interfaces while showcasing the app's adaptive intelligence.

#### Core Design Principles
1. **Data-Driven Clarity**: Present complex nutritional data in digestible, actionable formats
2. **Progressive Disclosure**: Show basic info first, detailed analytics on demand
3. **Adaptive Feedback**: UI responds to user progress and algorithm adjustments
4. **Effortless Logging**: Minimize friction in daily food and weight tracking
5. **Trust Through Transparency**: Show users how and why recommendations change

### Visual Design System

#### Color Palette
```css
/* Primary Colors - Health & Growth */
--primary-green: #10B981;      /* Success, progress, healthy choices */
--primary-blue: #3B82F6;       /* Trust, data, analytics */
--primary-purple: #8B5CF6;     /* Premium features, insights */

/* Secondary Colors - Energy & Warmth */
--accent-orange: #F59E0B;      /* Warnings, attention needed */
--accent-red: #EF4444;         /* Over limits, urgent actions */
--accent-yellow: #FCD34D;      /* Notifications, tips */

/* Neutral Colors - Clean & Professional */
--gray-50: #F9FAFB;           /* Background */
--gray-100: #F3F4F6;          /* Card backgrounds */
--gray-200: #E5E7EB;          /* Borders */
--gray-600: #4B5563;          /* Secondary text */
--gray-900: #111827;          /* Primary text */

/* Semantic Colors - Macros */
--protein-color: #DC2626;      /* Red for protein */
--carbs-color: #2563EB;        /* Blue for carbs */
--fat-color: #CA8A04;          /* Gold for fats */
```

#### Typography Scale
```css
/* Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;

/* Type Scale */
--text-xs: 12px;     /* Helper text, labels */
--text-sm: 14px;     /* Body text, descriptions */
--text-base: 16px;   /* Primary body text */
--text-lg: 18px;     /* Subheadings */
--text-xl: 20px;     /* Card titles */
--text-2xl: 24px;    /* Section headers */
--text-3xl: 30px;    /* Page titles */
--text-4xl: 36px;    /* Hero numbers */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### Spacing & Layout
```css
/* Spacing Scale (8px base) */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* Border Radius */
--radius-sm: 4px;    /* Small elements */
--radius-md: 8px;    /* Cards, buttons */
--radius-lg: 12px;   /* Modals, sheets */
--radius-xl: 16px;   /* Hero elements */
--radius-full: 9999px; /* Pills, avatars */

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

### Component Library

#### Core Components
```typescript
// Button Component with variants
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onPress: () => void;
}

// Macro Ring Chart - Key visual component
interface MacroRingProps {
  current: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

// Progress Chart - For weight/TDEE trends
interface ProgressChartProps {
  data: Array<{
    date: string;
    value: number;
    label?: string;
  }>;
  type: 'weight' | 'tdee' | 'bodyFat';
  timeframe: '1M' | '3M' | '6M' | '1Y';
  showTrendLine?: boolean;
}

// Food Log Item - Daily tracking
interface FoodLogItemProps {
  food: {
    name: string;
    brand?: string;
    servingSize: number;
    calories: number;
    macros: { protein: number; carbs: number; fat: number; };
  };
  onEdit: () => void;
  onDelete: () => void;
}
```

### Screen Designs & User Flows

#### 1. Onboarding Flow (4-5 screens)
```
Screen 1: Welcome & Value Proposition
┌─────────────────────────────────┐
│  🎯 WeightWise                  │
│                                 │
│  The Only App That Learns       │
│  YOUR Metabolism                │
│                                 │
│  ✓ Adaptive TDEE calculations   │
│  ✓ Body composition tracking    │
│  ✓ Smart macro adjustments      │
│                                 │
│  [Get Started] [Sign In]        │
└─────────────────────────────────┘

Screen 2: Basic Stats
┌─────────────────────────────────┐
│  ← Tell us about yourself       │
│                                 │
│  Gender: [Male] [Female]        │
│                                 │
│  Age: [____] years              │
│                                 │
│  Height: [____] cm              │
│                                 │
│  Current Weight: [____] kg      │
│                                 │
│  Training Experience:           │
│  ○ Beginner (< 1 year)         │
│  ○ Intermediate (1+ years)      │
│                                 │
│  [Continue]                     │
└─────────────────────────────────┘

Screen 3: Body Composition (Optional)
┌─────────────────────────────────┐
│  ← Body Composition             │
│                                 │
│  📏 For more accurate results   │
│                                 │
│  Waist: [____] cm               │
│  Neck: [____] cm                │
│  Hip: [____] cm (females)       │
│                                 │
│  Estimated Body Fat: 18.5%      │
│                                 │
│  [Skip] [Continue]              │
└─────────────────────────────────┘

Screen 4: Goal Selection
┌─────────────────────────────────┐
│  ← What's your main goal?       │
│                                 │
│  🏗️ Build Muscle                │
│  Gain 0.25-0.5 kg/week         │
│                                 │
│  🔥 Lose Fat                    │
│  Lose 0.5-1.0 kg/week          │
│                                 │
│  ⚖️ Maintain Weight             │
│  Stay within ±0.25 kg/week     │
│                                 │
│  [Continue]                     │
└─────────────────────────────────┘

Screen 5: Personalized Recommendations
┌─────────────────────────────────┐
│  ← Your Personalized Plan       │
│                                 │
│  Based on your 18% body fat     │
│  and goal, we recommend:        │
│                                 │
│  🎯 Cut Phase (Fat Loss)        │
│                                 │
│  Daily Targets:                 │
│  📊 2,150 calories              │
│  🥩 165g protein                │
│  🥑 72g fat                     │
│  🍞 215g carbs                  │
│                                 │
│  [Start Tracking]               │
└─────────────────────────────────┘
```

#### 2. Main Dashboard (Today Screen)
```
Today Screen - Primary Interface
┌─────────────────────────────────┐
│  Today • Dec 15                 │  ⚙️
│                                 │
│  🎯 Macro Rings (Large)         │
│     ┌─────────────┐             │
│     │   1,847     │             │
│     │  / 2,150    │             │
│     │  calories   │             │
│     └─────────────┘             │
│  P: 142/165g  C: 180/215g       │
│  F: 58/72g                      │
│                                 │
│  📊 Quick Stats                 │
│  Weight: 78.2 kg (↓0.3)        │
│  Week Progress: -0.6 kg         │
│                                 │
│  🍽️ Today's Food                │
│  Breakfast     487 cal  [+]     │
│  • Oatmeal + Banana             │
│  • Greek Yogurt                 │
│                                 │
│  Lunch         623 cal  [+]     │
│  • Chicken Salad                │
│                                 │
│  Dinner        737 cal  [+]     │
│  • Salmon + Rice                │
│                                 │
│  [+ Add Food] [📸 Quick Add]    │
└─────────────────────────────────┘
```

#### 3. Progress Analytics Screen
```
Progress Screen - Data Visualization
┌─────────────────────────────────┐
│  Progress                       │
│  [1M] [3M] [6M] [1Y]           │
│                                 │
│  📈 Weight Trend                │
│  ┌─────────────────────────────┐ │
│  │     •••••                   │ │
│  │   ••     ••                 │ │
│  │ ••         •••              │ │
│  │              ••••           │ │
│  └─────────────────────────────┘ │
│  80.5 kg → 78.2 kg (-2.3 kg)   │
│                                 │
│  🧬 Body Composition            │
│  Body Fat: 18.5% → 16.8%       │
│  Muscle Mass: Maintained        │
│                                 │
│  🔄 TDEE Adjustments            │
│  Week 1-3: 2,150 cal           │
│  Week 4-6: 2,080 cal (-70)     │
│  Week 7-9: 2,020 cal (-60)     │
│                                 │
│  💡 Insights                    │
│  "Your metabolism adapted well  │
│  to the deficit. Consider a     │
│  diet break in 2-3 weeks."     │
└─────────────────────────────────┘
```

#### 4. Food Logging Interface
```
Food Search & Logging
┌─────────────────────────────────┐
│  ← Add Food                     │
│                                 │
│  🔍 [Search foods...]           │
│                                 │
│  📸 Scan Barcode                │
│  📝 Quick Add by Calories       │
│                                 │
│  Recent Foods:                  │
│  🥗 Chicken Breast (100g)       │
│      165 cal • 31g protein      │
│                                 │
│  🍌 Banana (medium)             │
│      105 cal • 27g carbs        │
│                                 │
│  🥛 Greek Yogurt (150g)         │
│      130 cal • 15g protein      │
│                                 │
│  Favorites:                     │
│  🍳 My Breakfast Bowl           │
│      487 cal • Custom recipe    │
│                                 │
│  🥪 Turkey Sandwich             │
│      425 cal • Saved meal       │
└─────────────────────────────────┘

Food Details & Portion
┌─────────────────────────────────┐
│  ← Chicken Breast               │
│                                 │
│  📊 Nutrition (per 100g)        │
│  Calories: 165                  │
│  Protein: 31g                   │
│  Carbs: 0g                      │
│  Fat: 3.6g                      │
│                                 │
│  Serving Size:                  │
│  [150] grams                    │
│  ┌─────────────────────────────┐ │
│  │ ••••••••••••••••••••••••••• │ │ (slider)
│  └─────────────────────────────┘ │
│                                 │
│  Your Portion:                  │
│  📊 248 calories                │
│  🥩 47g protein                 │
│  🍞 0g carbs                    │
│  🥑 5g fat                      │
│                                 │
│  [Add to Breakfast]             │
└─────────────────────────────────┘
```

### Adaptive UI Elements

#### Smart Notifications & Insights
```typescript
// Context-aware notifications based on user progress
interface SmartNotification {
  type: 'insight' | 'adjustment' | 'milestone' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Examples of adaptive notifications:
const adaptiveNotifications = [
  {
    type: 'adjustment',
    priority: 'high',
    title: 'TDEE Adjusted',
    message: 'Based on your progress, we\'ve increased your daily calories to 2,080 (+70)',
    action: { label: 'View Details', onPress: () => navigateToTDEEHistory() }
  },
  {
    type: 'insight',
    priority: 'medium',
    title: 'Great Protein Consistency!',
    message: 'You\'ve hit your protein target 6 days in a row. This supports muscle retention during your cut.',
    action: { label: 'See Progress', onPress: () => navigateToMacroTrends() }
  },
  {
    type: 'milestone',
    priority: 'high',
    title: 'Body Fat Milestone! 🎉',
    message: 'You\'ve dropped below 17% body fat! Consider transitioning to maintenance soon.',
    action: { label: 'Update Goals', onPress: () => navigateToGoalSetting() }
  }
];
```

#### Dynamic Progress Indicators
```typescript
// Progress rings that adapt based on user's adherence patterns
interface AdaptiveProgressRing {
  current: number;
  target: number;
  tolerance: number; // Acceptable range
  trend: 'improving' | 'stable' | 'declining';
  color: string;
  message?: string;
}

// Visual feedback adapts to user behavior:
const proteinProgress = {
  current: 142,
  target: 165,
  tolerance: 10, // ±10g is acceptable
  trend: 'improving',
  color: current >= target - tolerance ? 'green' : 'orange',
  message: current < target - tolerance ? 
    'Try adding a protein shake' : 
    'Great protein intake!'
};
```

### Accessibility & Inclusive Design

#### Accessibility Features
```typescript
// Comprehensive accessibility support
const accessibilityFeatures = {
  // Visual
  highContrastMode: true,
  fontSize: 'adjustable', // 14px - 24px range
  colorBlindFriendly: true, // Alternative to color-only indicators
  
  // Motor
  largerTouchTargets: '44px minimum',
  swipeGestures: 'optional', // Always provide button alternatives
  voiceInput: 'for food search and quantities',
  
  // Cognitive
  simplifiedMode: 'hide advanced analytics',
  progressSaving: 'auto-save all inputs',
  undoActions: 'allow reverting recent changes',
  
  // Screen Reader Support
  semanticLabels: 'descriptive aria-labels',
  structuredHeadings: 'proper heading hierarchy',
  liveRegions: 'announce dynamic content changes'
};
```

#### Inclusive Design Considerations
```typescript
// Design for diverse users and contexts
const inclusiveDesign = {
  // Cultural Sensitivity
  units: 'metric/imperial toggle',
  foodDatabase: 'international cuisine support',
  bodyStandards: 'diverse body type representations',
  
  // Economic Accessibility
  offlineMode: 'core features work without internet',
  lowDataMode: 'compressed images and minimal API calls',
  freeFeatures: 'essential tracking always free',
  
  // Time Constraints
  quickLogging: 'one-tap frequent foods',
  batchEntry: 'add multiple items at once',
  smartDefaults: 'remember user preferences',
  
  // Varying Tech Literacy
  onboardingTips: 'contextual help throughout app',
  progressiveComplexity: 'advanced features opt-in',
  visualCues: 'icons + text for all actions'
};
```

### Responsive Design System

#### Mobile-First Breakpoints
```css
/* Mobile First Approach */
/* Base styles: 320px - 767px (mobile) */
.container {
  padding: var(--space-4);
  max-width: 100%;
}

/* Tablet: 768px - 1023px */
@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
    max-width: 768px;
    margin: 0 auto;
  }
  
  .macro-rings {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding: var(--space-8);
  }
  
  .dashboard {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-6);
  }
}
```

#### Component Responsiveness
```typescript
// Adaptive component sizing based on screen size
const useResponsiveSize = () => {
  const { width } = useWindowDimensions();
  
  return {
    macroRingSize: width < 768 ? 'lg' : 'xl',
    chartHeight: width < 768 ? 200 : 300,
    cardPadding: width < 768 ? 'md' : 'lg',
    fontSize: width < 768 ? 'base' : 'lg'
  };
};
```

### Animation & Micro-Interactions

#### Meaningful Animations
```typescript
// Animations that provide feedback and guide user attention
const animations = {
  // Progress Updates
  macroRingFill: {
    type: 'spring',
    duration: 800,
    easing: 'easeOutCubic'
  },
  
  // Data Loading
  skeletonPulse: {
    type: 'pulse',
    duration: 1200,
    repeat: Infinity
  },
  
  // Success States
  checkmarkBounce: {
    type: 'spring',
    scale: [1, 1.2, 1],
    duration: 600
  },
  
  // Navigation
  screenTransition: {
    type: 'slide',
    direction: 'horizontal',
    duration: 300
  }
};
```

#### Micro-Interactions for Engagement
```typescript
// Small interactions that make the app feel alive
const microInteractions = [
  {
    trigger: 'food_logged',
    animation: 'macro_ring_update',
    haptic: 'light',
    sound: 'success_chime'
  },
  {
    trigger: 'goal_reached',
    animation: 'confetti_burst',
    haptic: 'medium',
    sound: 'achievement_bell'
  },
  {
    trigger: 'weight_logged',
    animation: 'chart_point_highlight',
    haptic: 'light',
    sound: 'data_point'
  }
];
```

### Performance Optimization for UI

#### Efficient Rendering
```typescript
// Optimized component rendering for smooth performance
const OptimizedFoodList = React.memo(({ foods }: { foods: Food[] }) => {
  const renderItem = useCallback(({ item }: { item: Food }) => (
    <FoodLogItem key={item.id} food={item} />
  ), []);
  
  return (
    <FlatList
      data={foods}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      getItemLayout={(data, index) => ({
        length: 80,
        offset: 80 * index,
        index,
      })}
    />
  );
});
```

#### Image Optimization
```typescript
// Optimized image handling for progress photos
const ProgressPhoto = ({ uri, size = 'md' }: ProgressPhotoProps) => {
  const dimensions = {
    sm: { width: 80, height: 80 },
    md: { width: 120, height: 120 },
    lg: { width: 200, height: 200 }
  };
  
  return (
    <Image
      source={{ uri }}
      style={[styles.photo, dimensions[size]]}
      resizeMode="cover"
      loadingIndicatorSource={require('../assets/photo-placeholder.png')}
      fadeDuration={200}
    />
  );
};
```

This UI/UX design system creates a cohesive, accessible, and engaging experience that showcases your app's unique adaptive intelligence while making complex nutritional tracking feel effortless for users.

---

## Core Algorithm Implementation

### TDEE Adjustment Algorithm
```typescript
interface TDEEAdjustmentInput {
  userId: string;
  weekStartDate: string;
}

class TDEECalculator {
  async calculateWeeklyAdjustment(input: TDEEAdjustmentInput) {
    const { userId, weekStartDate } = input;
    
    // Get previous week's data
    const weekData = await this.getWeekData(userId, weekStartDate);
    
    if (weekData.daysLogged < 5) {
      throw new Error('Insufficient data for adjustment');
    }
    
    // Calculate expected vs actual weight change
    const expectedWeightChange = weekData.targetWeightChangePerWeek;
    const actualWeightChange = weekData.endWeight - weekData.startWeight;
    const differential = actualWeightChange - expectedWeightChange;
    
    // Apply the spreadsheet formula
    // avg daily calories + ((-prev week differential*3500)/# of days logged)
    const calorieAdjustment = (-differential * 3500) / weekData.daysLogged;
    const newTDEE = Math.round(weekData.avgDailyCalories + calorieAdjustment);
    
    // Apply bounds checking
    const minTDEE = weekData.baseTDEE * 0.8; // Don't go below 80% of base
    const maxTDEE = weekData.baseTDEE * 1.4; // Don't go above 140% of base
    
    const adjustedTDEE = Math.max(minTDEE, Math.min(maxTDEE, newTDEE));
    
    // Recalculate macros based on new TDEE
    const newMacros = this.calculateMacros(adjustedTDEE, weekData.userProfile);
    
    // Save adjustment record
    await this.saveTDEEAdjustment({
      userId,
      weekStartDate,
      oldTDEE: weekData.currentTDEE,
      newTDEE: adjustedTDEE,
      avgDailyCalories: weekData.avgDailyCalories,
      expectedWeightChange,
      actualWeightChange,
      adjustmentReason: this.generateAdjustmentReason(differential, calorieAdjustment)
    });
    
    return {
      newTDEE: adjustedTDEE,
      newMacros,
      adjustment: adjustedTDEE - weekData.currentTDEE,
      reason: this.generateAdjustmentReason(differential, calorieAdjustment)
    };
  }
  
  private async getWeekData(userId: string, weekStartDate: string) {
    // Implementation to gather week's data from database
    // Returns: avgDailyCalories, startWeight, endWeight, daysLogged, etc.
  }
  
  private calculateMacros(tdee: number, profile: UserProfile) {
    const { goal, trainingExperience, bodyFatPercent, gender } = profile;
    
    // Protein calculation (similar to spreadsheet multipliers)
    let proteinMultiplier = 2.2; // base g/kg bodyweight
    
    if (goal === 'build_muscle') proteinMultiplier = 2.4;
    if (goal === 'lose_fat') proteinMultiplier = 2.6;
    if (trainingExperience === 'beginner') proteinMultiplier *= 0.9;
    
    const proteinGrams = Math.round(profile.weightKg * proteinMultiplier);
    const proteinCalories = proteinGrams * 4;
    
    // Fat calculation (25-35% of calories)
    const fatPercentage = goal === 'build_muscle' ? 0.25 : 0.30;
    const fatCalories = Math.round(tdee * fatPercentage);
    const fatGrams = Math.round(fatCalories / 9);
    
    // Carbs get the remainder
    const remainingCalories = tdee - proteinCalories - fatCalories;
    const carbGrams = Math.round(remainingCalories / 4);
    
    return {
      calories: tdee,
      protein: proteinGrams,
      fat: fatGrams,
      carbs: carbGrams
    };
  }
}
```

### Body Fat Calculation
```typescript
class BodyFatCalculator {
  // Navy method for males
  calculateMaleBodyFat(waistCm: number, neckCm: number, heightCm: number): number {
    const bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
    return Math.max(3, Math.min(50, bodyFat)); // Bound between 3-50%
  }
  
  // Navy method for females
  calculateFemaleBodyFat(waistCm: number, neckCm: number, hipCm: number, heightCm: number): number {
    const bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
    return Math.max(8, Math.min(50, bodyFat)); // Bound between 8-50%
  }
  
  async updateBodyFat(userId: string, measurements: BodyMeasurements) {
    const user = await this.getUserProfile(userId);
    
    let calculatedBF: number;
    if (user.gender === 'male') {
      calculatedBF = this.calculateMaleBodyFat(
        measurements.waistCm,
        measurements.neckCm,
        user.heightCm
      );
    } else {
      calculatedBF = this.calculateFemaleBodyFat(
        measurements.waistCm,
        measurements.neckCm,
        measurements.hipCm,
        user.heightCm
      );
    }
    
    // Save measurement with calculated BF%
    await this.saveBodyMeasurement({
      userId,
      date: measurements.date,
      ...measurements,
      calculatedBodyFatPercent: calculatedBF
    });
    
    return calculatedBF;
  }
}
```

### Initial TDEE Calculation
```typescript
class InitialTDEECalculator {
  calculateBaseTDEE(profile: UserProfile): number {
    const { gender, ageYears, heightCm, weightKg } = profile;
    
    // Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    }
    
    // Activity multiplier based on training experience
    let activityMultiplier = 1.4; // Lightly active baseline
    
    if (profile.trainingExperience === 'beginner') {
      activityMultiplier = 1.375;
    } else if (profile.trainingExperience === 'intermediate') {
      activityMultiplier = 1.55;
    } else if (profile.trainingExperience === 'advanced') {
      activityMultiplier = 1.725;
    }
    
    return Math.round(bmr * activityMultiplier);
  }
  
  calculateInitialTargets(profile: UserProfile) {
    const baseTDEE = this.calculateBaseTDEE(profile);
    
    // Adjust TDEE based on goal
    let targetCalories = baseTDEE;
    
    if (profile.primaryGoal === 'lose_fat') {
      const weeklyDeficit = profile.goalWeightChangePerWeek * 3500; // calories per week
      const dailyDeficit = weeklyDeficit / 7;
      targetCalories = baseTDEE - dailyDeficit;
    } else if (profile.primaryGoal === 'build_muscle') {
      const weeklySurplus = Math.abs(profile.goalWeightChangePerWeek) * 3500;
      const dailySurplus = weeklySurplus / 7;
      targetCalories = baseTDEE + dailySurplus;
    }
    
    // Calculate macros
    const macroCalculator = new TDEECalculator();
    const macros = macroCalculator.calculateMacros(targetCalories, profile);
    
    return {
      baseTDEE,
      targetCalories: Math.round(targetCalories),
      ...macros
    };
  }
}
```

---

## Authentication & Security

### Authentication Flow
```typescript
// Supabase Auth integration
class AuthService {
  async signUp(email: string, password: string, profile: UserProfile) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: profile.fullName,
        }
      }
    });
    
    if (error) throw error;
    
    // Create user profile in our database
    await this.createUserProfile(data.user.id, profile);
    
    return data;
  }
  
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }
  
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
}
```

### API Security Middleware
```typescript
// JWT verification middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

### Data Validation
```typescript
// Joi validation schemas
const userProfileSchema = Joi.object({
  gender: Joi.string().valid('male', 'female').required(),
  birthDate: Joi.date().max('now').required(),
  heightCm: Joi.number().min(100).max(250).required(),
  currentWeightKg: Joi.number().min(30).max(300).required(),
  estimatedBodyFatPercent: Joi.number().min(3).max(50),
  trainingExperience: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  primaryGoal: Joi.string().valid('build_muscle', 'lose_fat', 'maintain').required(),
  goalWeightChangePerWeek: Joi.number().min(-2).max(2).required()
});

const foodLogSchema = Joi.object({
  foodId: Joi.string().uuid().required(),
  date: Joi.date().required(),
  servingSizeG: Joi.number().min(0.1).max(5000).required()
});
```

---

## Deployment & Infrastructure

### Development Environment
```yaml
# docker-compose.yml for local development
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: nutrition_app
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Production Deployment

#### Backend (Vercel)
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_ANON_KEY": "@supabase_anon_key",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

#### Mobile App (Expo EAS)
```json
// eas.json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/nutrition_app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
USDA_API_KEY=your-usda-api-key
NODE_ENV=production

# Mobile App (.env)
EXPO_PUBLIC_API_URL=https://your-api.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  build-mobile:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: expo/expo-github-action@v7
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: expo build:android --release-channel production
```

---

## Development Phases

### Phase 1: MVP Core (Weeks 1-4)
**Goal**: Basic functional app with core tracking features

#### Week 1: Project Setup & Authentication
- [ ] Initialize React Native + Expo project
- [ ] Set up backend with Express + Prisma
- [ ] Configure Supabase for auth and database
- [ ] Implement basic authentication flow
- [ ] Create initial database schema

#### Week 2: User Onboarding
- [ ] Build onboarding screens (profile setup)
- [ ] Implement initial TDEE calculation
- [ ] Create goal selection and macro calculation
- [ ] Add body fat estimation feature
- [ ] Set up basic navigation structure

#### Week 3: Daily Tracking
- [ ] Build food logging interface
- [ ] Implement basic food search (USDA API)
- [ ] Create weight entry functionality
- [ ] Add daily macro tracking display
- [ ] Implement local storage for offline capability

#### Week 4: Basic Analytics
- [ ] Create simple progress charts
- [ ] Add weekly weight trend visualization
- [ ] Implement basic macro trend tracking
- [ ] Build settings and profile management
- [ ] Add data export functionality

### Phase 2: Smart Features (Weeks 5-8)
**Goal**: Implement adaptive algorithms and advanced tracking

#### Week 5: Adaptive TDEE Algorithm
- [ ] Implement weekly TDEE adjustment logic
- [ ] Create background job for automatic adjustments
- [ ] Add TDEE history tracking
- [ ] Build adjustment notification system
- [ ] Add manual adjustment override

#### Week 6: Body Composition Tracking
- [ ] Implement body measurement logging
- [ ] Add body fat calculation algorithms
- [ ] Create body composition progress charts
- [ ] Add progress photo functionality
- [ ] Implement measurement reminders

#### Week 7: Advanced Analytics
- [ ] Build comprehensive progress dashboard
- [ ] Add macro adherence scoring
- [ ] Implement goal progress tracking
- [ ] Create weekly summary reports
- [ ] Add data insights and recommendations

#### Week 8: Polish & Testing
- [ ] Comprehensive testing and bug fixes
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Beta user testing
- [ ] App store preparation

### Phase 3: Launch & Iteration (Weeks 9-12)
**Goal**: Launch MVP and iterate based on user feedback

#### Week 9-10: Launch Preparation
- [ ] Final testing and QA
- [ ] App store submission
- [ ] Marketing website creation
- [ ] User documentation
- [ ] Support system setup

#### Week 11-12: Post-Launch
- [ ] Monitor user feedback and analytics
- [ ] Fix critical bugs
- [ ] Implement high-priority feature requests
- [ ] Plan Phase 4 features
- [ ] Gather user testimonials

### Phase 4: Advanced Features (Future)
- [ ] Workout tracking integration
- [ ] Meal planning and recipes
- [ ] Social features and community
- [ ] Advanced coaching insights
- [ ] Wearable device integration
- [ ] Barcode scanning
- [ ] Restaurant database
- [ ] Macro-friendly recipe suggestions

---

## Performance Considerations

### Database Optimization
```sql
-- Partitioning for large tables
CREATE TABLE food_logs_2024 PARTITION OF food_logs
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Materialized views for analytics
CREATE MATERIALIZED VIEW user_weekly_stats AS
SELECT 
  user_id,
  DATE_TRUNC('week', date) as week_start,
  AVG(weight_kg) as avg_weight,
  COUNT(*) as days_logged
FROM weight_entries
GROUP BY user_id, DATE_TRUNC('week', date);

-- Refresh weekly
REFRESH MATERIALIZED VIEW user_weekly_stats;
```

### API Performance
```typescript
// Response caching
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

app.get('/api/foods/search', (req, res) => {
  const cacheKey = `food_search_${req.query.q}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return res.json(cached);
  }
  
  // Fetch from database/API
  const results = await searchFoods(req.query.q);
  cache.set(cacheKey, results);
  res.json(results);
});

// Database connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Mobile App Performance
```typescript
// Lazy loading screens
const ProgressScreen = lazy(() => import('../screens/ProgressScreen'));
const ProfileScreen = lazy(() => import('../screens/ProfileScreen'));

// Image optimization
const ProgressPhoto = ({ uri }: { uri: string }) => (
  <Image
    source={{ uri }}
    style={styles.photo}
    resizeMode="cover"
    loadingIndicatorSource={require('../assets/loading.png')}
  />
);

// Efficient list rendering
const FoodLogsList = ({ logs }: { logs: FoodLog[] }) => (
  <FlatList
    data={logs}
    renderItem={({ item }) => <FoodLogItem log={item} />}
    keyExtractor={(item) => item.id}
    removeClippedSubviews={true}
    maxToRenderPerBatch={10}
    windowSize={10}
  />
);
```

### Monitoring & Analytics
```typescript
// Error tracking (Sentry)
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
});

// Performance monitoring
const performanceMonitor = {
  trackAPICall: (endpoint: string, duration: number) => {
    // Track API response times
    analytics.track('api_call', {
      endpoint,
      duration,
      timestamp: Date.now()
    });
  },
  
  trackUserAction: (action: string, metadata?: any) => {
    // Track user interactions
    analytics.track('user_action', {
      action,
      metadata,
      timestamp: Date.now()
    });
  }
};
```

---

## Security Considerations

### Data Protection
```typescript
// Encrypt sensitive data
import CryptoJS from 'crypto-js';

const encryptSensitiveData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, process.env.ENCRYPTION_KEY).toString();
};

const decryptSensitiveData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

### Input Validation & Sanitization
```typescript
// Sanitize user inputs
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input.trim());
};

// Validate numeric inputs
const validateWeight = (weight: number): boolean => {
  return weight >= 30 && weight <= 300 && !isNaN(weight);
};
```

### API Security Headers
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

This technical architecture provides a comprehensive foundation for building your adaptive nutrition tracking app. The system is designed to be scalable, maintainable, and user-focused while implementing the sophisticated algorithms from your original spreadsheet.

Key strengths of this architecture:
- **Scalable**: Can handle growth from MVP to thousands of users
- **Maintainable**: Clean separation of concerns and well-documented code
- **Secure**: Implements industry-standard security practices
- **Performance-focused**: Optimized for mobile and web performance
- **User-centric**: Designed around the user experience and journey

The phased development approach allows you to validate the concept with an MVP while building toward a comprehensive fitness platform.