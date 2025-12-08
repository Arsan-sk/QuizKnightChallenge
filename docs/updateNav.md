# QuizKTC — Navigation Redesign Plan (Navbar + Sidebar)

Purpose
- Replace the single shared nav with role-aware navigation (Teacher vs Student).
- Provide a modern, responsive, accessible navigation system combining a top sticky bar (primary controls + branding) and a collapsible side rail (secondary navigation).
- Keep existing theme/colors but upgrade spacing, typography and motion.
- Remove obsolete tabs (Settings / History) and show only relevant items per role.
- Produce a practical implementation plan for developers to follow.

Goals & Principles
- Role-specific: teachers and students see different menus and badges.
- Progressive enhancement: mobile-first thinking; desktop shows side rail, mobile shows top + drawer.
- Accessible: keyboard navigation, proper aria attributes, focus outlines.
- Reusable components: small primitives (NavItem, NavGroup, SideBar, TopBar) so pages can reuse.
- Smooth animations: subtle transitions (Framer Motion or CSS transitions).
- Non-breaking: route protection and permission checks required before rendering items.

High-level Layout Options
1. Desktop (≥1024px)
   - Left: vertical collapsible sidebar (icons + labels). Collapsed state shows icons-only.
   - Top: sticky top bar with logo (left), search/global actions center (optional), user avatar & quick actions right.
   - Content area shifts right when sidebar expanded.

2. Tablet (≥768px <1024px)
   - Collapsible sidebar overlays content when open (default collapsed).
   - Sticky top bar always present.

3. Mobile (<768px)
   - Top sticky bar only with hamburger toggling a full-screen drawer.
   - Drawer has icon + label, grouped and scrollable.

Role-specific Navigation (recommended)

- Teacher Nav
  - TopBar: Logo (left), breadcrumb / current page title (center), user avatar (right).
  - SideBar:
    - Dashboard (home analytics)
    - Create Quiz (quick entry)
    - My Quizzes (list + drafts)
    - Analytics (global + per-quiz)
    - Students (roster / student analytics)
    - Profile (teacher profile & settings)
    - Help / Docs (optional)
    - Sign Out
  - Notes:
    - Show notification badge counts on Analytics (new attempts) and Students (new messages).
    - "Create Quiz" significant CTA (colored button style).

- Student Nav
  - TopBar: Logo (left), search/browse (center optionally), avatar (right).
  - SideBar:
    - Dashboard (progress summary)
    - Browse Quizzes (catalog)
    - Achievements (badges / levels) — visible only to students
    - Leaderboard
    - Profile (edit)
    - Sign Out
  - Notes:
    - Achievements badge shows unread/unclaimed count.
    - Browse Quizzes primary CTA should be prominent.

Removed / Changed Items
- Remove Settings and History from primary navigation (can remain in Profile if needed).
- Consolidate any rarely used items into Profile or a small overflow menu.

Visual / Interaction Details
- Icons: use a consistent set (Heroicons / React-Icons). Each NavItem: icon + label + optional badge.
- Active state: left border or background accent and subtle shadow.
- Collapsed sidebar: on hover show tooltip with label; keyboard focus must reveal label.
- Animations: use Framer Motion for expand/collapse (200–300ms, ease-out).
- Colors: reuse current theme tokens (primary, surface, muted); increase whitespace and font scale slightly.
- Avatar: show role, short menu (My Profile, Sign Out).

Accessibility
- Role-based aria attributes:
  - Sidebar: role="navigation", aria-label based on role ("Teacher navigation")
  - NavItem: role="link"/"button", aria-current for active item.
- Keyboard:
  - Tab order left-to-right, arrow keys navigate sidebar when focused.
  - Escape closes mobile drawer.
- Tooltips: aria-describedby for icons-only mode.

Data & API Needs
- API endpoints:
  - GET /api/user (already available) returns { id, role, name, avatar }
  - GET /api/user/menu-metrics (optional) returns badge counts used in nav (new attempts, unread achievements)
- Permission gating:
  - Only render items if user.role === 'teacher' or 'student'.
  - Protect routes server-side as well.

Implementation Plan (step-by-step)
1. Component design (create React components):
   - TopBar.tsx — sticky top header
   - SideBar.tsx — role-aware, collapsible component
   - NavItem.tsx — icon + label + badge + active indicator
   - NavGroup.tsx — optional grouping headers for complex menus
   - Layout.tsx — wraps pages and injects TopBar + SideBar + content area
   - RoleAwareMenu.tsx — returns menu config for a user role
   - MobileDrawer.tsx — responsive drawer for small screens
2. Menu config
   - Create `menuConfig.ts` exporting TeacherMenu and StudentMenu arrays:
     - { key, title, icon, route, visible: (user) => boolean, badgeKey? }
3. Routing & Protection
   - Update App.tsx or router wrapper to use Layout and to guard role routes.
   - Redirect unauthorized access.
4. Replace old NavBar
   - Remove or deprecate the legacy NavBar component. Update imports.
5. Update pages
   - Ensure pages using the old header adapt to the new Layout (title, breadcrumbs).
6. Styling
   - Add styles in new CSS module or tailwind utility classes (follow existing theme).
   - Add theme tokens for spacing and colors if missing.
7. Animations
   - Add Framer Motion transitions for sidebar, drawer, nav item hover.
8. Badges & Live Counts
   - Implement a small hook `useNavMetrics()` that fetches badge counts every 30–60s or uses websocket for real-time.
9. Testing
   - Unit tests for RoleAwareMenu and Layout rendering.
   - E2E test verifying role-based items and mobile drawer behavior.
10. Migration / Rollout
   - Feature flag toggle (optional) to switch between nav versions.
   - Gradual rollout for small group first.

Edge Cases & Details
- If a user has multiple roles (rare), show combined menu or allow role switcher.
- If new items introduced (e.g., "Students reach"), expose small count, link to analytics.
- Performance: avoid heavy queries in nav; fetch lightweight metrics only.

Example menu config (concept)
```ts
// Teacher
[
  { key: 'dashboard', title: 'Dashboard', icon: IconDashboard, route: '/teacher/dashboard' },
  { key: 'create', title: 'Create Quiz', icon: IconPlus, route: '/quiz/create', cta: true },
  { key: 'quizzes', title: 'My Quizzes', icon: IconList, route: '/teacher/quizzes' },
  { key: 'analytics', title: 'Analytics', icon: IconChart, route: '/analytics' },
  { key: 'students', title: 'Students', icon: IconUsers, route: '/teacher/students' },
  { key: 'profile', title: 'Profile', icon: IconUser, route: '/profile' },
  { key: 'signout', title: 'Sign Out', icon: IconLogout, action: signOut }
]
// Student
[
  { key: 'dashboard', title: 'Dashboard', icon: IconDashboard, route: '/dashboard' },
  { key: 'browse', title: 'Browse Quizzes', icon: IconSearch, route: '/browse' },
  { key: 'achievements', title: 'Achievements', icon: IconBadge, route: '/achievements', badgeKey: 'unclaimed' },
  { key: 'leaderboard', title: 'Leaderboard', icon: IconTrophy, route: '/leaderboard' },
  { key: 'profile', title: 'Profile', icon: IconUser, route: '/profile' },
  { key: 'signout', title: 'Sign Out', icon: IconLogout, action: signOut }
]
```

Developer tasks (ordered)
1. Create `src/components/layout/{TopBar,SideBar,NavItem,MobileDrawer,Layout}.tsx`
2. Add `src/config/menuConfig.ts`
3. Integrate `Layout` into `src/App.tsx` (wrap routes)
4. Implement role-based rendering in `useProfile` or `useAuth` so Layout sees current user role
5. Replace old NavBar imports across pages
6. Implement `useNavMetrics` to fetch counts and wire badges
7. Styling & animations
8. Write unit & e2e tests
9. QA: check mobile, keyboard nav, dark mode (if any)

Testing Checklist
- [ ] Teacher sees teacher menu only
- [ ] Student sees student menu only
- [ ] Collapsed sidebar tooltip appears and keyboard focus reveals labels
- [ ] Mobile drawer opens/closes and ESC key closes
- [ ] Create Quiz CTA visible to teachers
- [ ] Achievements visible only to students with badge counts
- [ ] Sign Out works from both TopBar and SideBar
- [ ] Routes are protected server-side and client-side

Rollout & Backout Plan
- Implement behind feature flag `NEW_NAV` initially.
- Validate with limited internal users.
- If issues, revert to old NavBar by toggling flag.

Notes
- Keep the same brand colors and typography but increase whitespace and consistent iconography.
- Use existing theme tokens to avoid style collisions.
- Use Framer Motion for smooth animations; fallback to CSS for simpler setups.

Appendix — Quick Wireframe (Desktop)
```
+------------------------------------------------------------+
| Logo  |        Page Title / Search         | Avatar / Menu  |
+----+-----------------------------------------------+-------+
| SB |  Dashboard (active)                            |       |
| i  |  My Quizzes                                    |       |
| c  |  Create Quiz (CTA)                              |       |
| o  |  Analytics                                      |       |
| n  |  Students                                       |       |
| s  |  Profile                                        |       |
|    |  Sign Out                                       |       |
+----+-----------------------------------------------+-------+
|                     Content Area                            |
+------------------------------------------------------------+
```

End of plan.