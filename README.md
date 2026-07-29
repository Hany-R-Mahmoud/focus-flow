# FocusSessionFlow

An offline-first focus session planner for students, freelancers, and knowledge workers. Plan focused work sessions, track your time, capture distractions, and review patterns—all locally, without requiring an account or internet connection. Coordinate focus sessions with others using shareable links.

## Features

- **Session Templates**: Create reusable focus session templates (e.g., "Deep Work 90min", "Quick Focus 25min")
- **Active Timer**: Start sessions with a countdown timer, pause/resume, and track elapsed time
- **Distraction Capture**: Log distractions during sessions (phone, email, social media, thoughts, other)
- **Task Intention & Outcome**: Record what you're focusing on and what you accomplished
- **Session History**: View all completed sessions with details, outcomes, and distraction counts
- **Daily Review**: Reflect on your focus day with session stats and personal notes
- **Weekly Review**: Analyze weekly patterns (total sessions, focus time, average distractions, top template)
- **Group Sessions**: Coordinate focus sessions with shareable links, optional cloud membership, and live presence
- **Browser Notifications**: Optional five-minute reminders for upcoming group sessions
- **Export/Import**: Backup your data as JSON and restore it anytime
- **Offline-First**: All data stored locally in IndexedDB; works without internet
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Accessible UI**: Keyboard-friendly controls, labels, focus states, and dialog descriptions; full WCAG conformance still needs a dedicated audit

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm 10+

### Local Setup

1. Clone or download the project:

   ```bash
   cd focussessionflow
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open your browser to `http://localhost:3000`

### Optional Supabase Collaboration

The app remains local-only when these variables are unset. To enable anonymous cloud identity, authoritative group sessions, join history, and live participant presence:

1. Create a Supabase project and enable Anonymous Sign-Ins.
2. Configure Cloudflare Turnstile and enable CAPTCHA protection in Supabase Auth.
3. Run all files in `supabase/migrations/` in filename order in the Supabase SQL Editor.
4. Copy `.env.example` to `.env.local` and set the Supabase and Turnstile values.
5. Restart the development server.

Only the publishable key belongs in the browser. Do not expose a Supabase service-role key.
The security setup guide is in `SUPABASE_SETUP.md`. The final migrations enable daily cleanup for unused anonymous accounts and database-side create/join rate limits.

### Build for Production

```bash
# Set the real canonical domain before starting production.
export SITE_URL=https://your-production-domain.example
pnpm build
pnpm start
```

The server generates `/robots.txt`, `/sitemap.xml`, and `/llms.txt`. Only the
homepage is included in the sitemap; application routes are marked `noindex`.
Replace the example `SITE_URL` with the deployed HTTPS origin.

## Usage

### Create a Session Template

1. Click **Templates** in the sidebar
2. Click **New Template**
3. Enter a name (e.g., "Deep Work"), duration (minutes), description, and color
4. Click **Create**

### Start a Focus Session

1. Click **Start Session** button (in sidebar or dashboard)
2. Choose a template, session name, duration, and task intention
3. Click **Start session** to begin the timer
4. Click **Log Distraction** to record any interruptions
5. Click **Complete Session** when done
6. Enter your outcome and click **Finish Session**

Only one individual session can be active or paused at a time. If a session is
already in progress, the setup screen offers a resume action instead of
creating another session.

### Create a Group Session

1. Click **Group Sessions** in the sidebar (or **Plan New Session** button)
2. Fill in the session details:
   - **Session Title**: Name of the group session (e.g., "Product Design Focus Room")
   - **Shared Objective**: Optional goal for the group (e.g., "Complete wireframes")
   - **Start Date & Time**: When the session begins
   - **Focus Duration**: Minutes for focused work (5-240 min)
   - **Break Duration**: Optional break after focus (0-120 min)
   - **Meeting URL**: Optional video meeting link (HTTPS only)
   - **Your Name**: Optional organizer name
   - **Opening Message**: Optional message for participants
3. Click **Create & Share**
4. Copy the generated link and share with others via email, chat, or messaging
5. Share the complete invitation text for convenience

Keep shared details general. Anyone with the invite link can see the session title, objective, organizer name, opening message, and meeting link. Do not include passwords, private notes, or sensitive information.

### Join a Group Session

1. Receive a group session link from someone (looks like: `https://app.example.com/#...`)
2. Click the link or paste it in your browser
3. Review the session details (title, time, duration, organizer, meeting URL)
4. Click **Join Session**
5. Add your personal intention in the active session view (optional and private)
6. You'll be added to your local group sessions list

### Participate in a Group Session

1. Open **Group Sessions** to see upcoming and active sessions
2. Click **Open** on a session to view the live timer
3. The timer counts down based on the scheduled start/end times (same for all participants)
4. When the session ends, record your outcome and reflection
5. Your personal data (intention, distractions, outcome) stays private on your device

### Review Your Sessions

- **Dashboard**: See today's focus time, sessions completed, and recent activity
- **History**: Search sessions, filter by status, and delete old entries
- **Daily Review**: Reflect on today with session stats and personal notes
- **Weekly Review**: Analyze patterns and trends from the past week

### Backup Your Data

1. Click **Settings** in the sidebar
2. Click **Export Data** to download a JSON backup
3. Save the file securely

### Restore Your Data

1. Click **Settings**
2. Click **Import Data**
3. Select a previously exported JSON file
4. Your data will be imported (existing data will be replaced)

## Data Model

### SessionTemplate

- `id`: Unique identifier
- `name`: Template name (e.g., "Deep Work")
- `duration`: Duration in minutes
- `description`: Purpose of the template
- `color`: Hex color for visual identification
- `createdAt`: Timestamp

### FocusSession

- `id`: Unique identifier
- `templateId`: Reference to SessionTemplate
- `templateName`: Session name, defaulting to the selected template name
- `duration`: Configured duration for this run in minutes (optional for older data)
- `startTime`: Session start timestamp
- `endTime`: Session end timestamp (null if ongoing)
- `pausedTime`: Total paused duration in milliseconds
- `taskIntention`: What you're focusing on
- `outcome`: What you accomplished
- `distractions`: Array of Distraction objects
- `status`: "active", "paused", "completed", or "abandoned"
- `createdAt`: Timestamp

### Distraction

- `id`: Unique identifier
- `sessionId`: Reference to FocusSession
- `time`: Timestamp when distraction was logged
- `category`: "phone", "email", "social", "thoughts", "other"
- `note`: Description of the distraction

### DailyReview

- `id`: Unique identifier
- `date`: Date in YYYY-MM-DD format
- `sessionsCompleted`: Number of completed sessions
- `totalFocusTime`: Total focus time in minutes
- `notes`: Reflection notes
- `createdAt`: Timestamp

### GroupSession

- `id`: Unique identifier
- `payloadVersion`: Payload schema version
- `title`: Session title
- `sharedObjective`: Optional shared goal
- `startsAt`: ISO timestamp when session begins
- `focusMinutes`: Duration of focus phase
- `breakMinutes`: Optional duration of break phase
- `meetingUrl`: Optional video meeting link
- `organizerName`: Optional organizer name
- `openingMessage`: Optional message for participants
- `source`: "created" (organizer) or "joined" (participant)
- `joinedAt`: When participant joined (if applicable)
- `createdAt`: Timestamp
- `updatedAt`: Last modified timestamp

## Architecture

### Frontend Stack

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling
- **shadcn/ui**: Component library
- **Wouter**: Lightweight client-side routing
- **IndexedDB**: Local data persistence
- **Sonner**: Toast notifications
- **Browser Notifications API**: Optional session notifications

### Key Directories

```
client/
  src/
    pages/        ← Page components (Dashboard, Templates, etc.)
    components/   ← Reusable UI components (Sidebar, etc.)
    lib/          ← Utilities (db.ts, time.ts, seed.ts, groupSession.ts, notifications.ts)
    contexts/     ← React contexts (ThemeContext)
    index.css     ← Global styles and design tokens
```

### Group Sessions Architecture

Group sessions use coordinated timing with a local-first fallback and an optional Supabase collaboration boundary:

1. **Organizer creates** a session with title, objective, start time, duration, and optional meeting link
2. **Payload encoding**: Session details are encoded into a URL-safe base64 string
3. **Link generation**: The payload is embedded in the URL hash (e.g., `#eyJ2ZXJzaW9uIjoxLCJzZXNzaW9uSWQiOiI...`)
4. **Participant joins**: Participant receives the link, chooses a display name, and joins anonymously
5. **Synchronized timer**: All participants see the same countdown based on absolute timestamps
6. **Private outcomes**: Each participant's intentions, distractions, and outcomes stay on their device
7. **Cloud mode**: Supabase stores the authoritative session, membership/join history, and anonymous display names; Realtime Presence shows who is currently connected
8. **Local mode**: With no Supabase variables, URL sharing and browser-local participants continue to work without a server

### Data Persistence

- All data is stored in IndexedDB (browser local storage)
- No backend server required for local mode
- Supabase is optional and used only for group collaboration
- Data persists across browser sessions
- Export/import enables manual backups and data portability

## Design System

### Colors

- **Primary Accent**: `oklch(0.55 0.15 200)` — Calm teal for focus and clarity
- **Success**: `oklch(0.65 0.15 140)` — Green for completion
- **Warning**: `oklch(0.75 0.18 60)` — Amber for caution
- **Error**: `oklch(0.6 0.2 30)` — Red for destructive actions
- **Neutral Scale**: Warm grays for text and backgrounds

### Typography

- **Display**: Geist Bold, 32px for page titles
- **Heading**: Geist Semibold, 20px for section headers
- **Body**: Geist Mono, 14px for readable text
- **UI Labels**: Geist Medium, 12px uppercase for buttons and form labels

### Spacing

- 4px, 8px, 16px, 24px, 32px (multiples of 4px)
- Consistent padding and margins throughout

## Testing

The app includes realistic seed data for immediate testing:

- 4 session templates (Deep Work, Quick Focus, Study Session, Creative Work)
- 4 completed sessions with various outcomes and distractions
- 2 daily reviews with reflection notes

The app seeds templates, completed sessions, reviews, and example group sessions on first load. Focused unit tests cover payload validation/encoding, phase timing, local dates, pause accounting, and local-data boundaries.

## Accessibility

- **Accessibility**: Keyboard and screen-reader support is implemented in the main flows; run a dedicated accessibility audit before claiming WCAG conformance
- **Keyboard Navigation**: All controls accessible via keyboard
- **Focus Indicators**: Clear focus rings on interactive elements
- **Semantic HTML**: Proper heading hierarchy and form labels
- **Screen Reader Support**: Descriptive labels and ARIA attributes
- **Reduced Motion**: Respects `prefers-reduced-motion` preference

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Limitations

- **Single-device**: Data is stored locally; not synchronized across devices
- **No cloud sync**: Manual export/import required for data portability
- **Storage limits**: IndexedDB quota depends on browser (typically 50MB+)
- **Group sessions**: Local mode is coordinated only; configured cloud mode adds anonymous membership and live presence while personal activity remains local

## Privacy

- **No tracking**: No analytics or advertising services; configured cloud mode uses Supabase for group collaboration
- **Local storage only**: Personal IndexedDB and localStorage data stays on your device
- **No account required**: Anonymous Supabase identity is used only when cloud collaboration is enabled
- **Data ownership**: You control all exports and backups
- **Group sessions**: Shared details (title, time, organizer name) are in the URL; personal intentions/outcomes stay private

## Development

### Project Structure

```
focussessionflow/
├── client/              ← React frontend
│   ├── src/
│   │   ├── pages/       ← Page components
│   │   ├── components/  ← Reusable components
│   │   ├── lib/         ← Utilities and helpers
│   │   ├── contexts/    ← React contexts
│   │   └── index.css    ← Global styles
│   ├── index.html       ← HTML entry point
│   └── public/          ← Static assets
├── server/              ← Express server (for production)
├── package.json         ← Dependencies
├── vite.config.ts       ← Vite configuration
├── tsconfig.json        ← TypeScript configuration
└── README.md            ← This file
```

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server (http://localhost:3000)

# Production
pnpm build        # Build for production
pnpm start        # Run production build

# Code quality
pnpm check        # TypeScript type checking
pnpm format       # Format code with Prettier
```

### Adding Features

1. **New page**: Create a component in `client/src/pages/`
2. **New component**: Create in `client/src/components/`
3. **New utility**: Add to `client/src/lib/`
4. **Styling**: Use Tailwind utilities and CSS variables in `client/src/index.css`

## Known Issues

- None currently. Please report bugs via GitHub issues.

## Future Enhancements

- Broader cloud sync for personal data, if privacy requirements support it
- Multi-device sync
- Recurring session templates
- Session analytics and charts
- Pomodoro timer presets
- Dark mode toggle
- Custom color themes
- Group session history and analytics
- Participant attendance and join history (cloud mode already records group joins)
- Session templates for recurring group sessions

## License

MIT

## Support

For questions or issues, please refer to the documentation or create an issue in the repository.
# FocusSessionFlow

An offline-first focus session planner for students, freelancers, and knowledge workers. Plan focused work sessions, track your time, capture distractions, and review patterns—all locally, without requiring an account or internet connection. Coordinate focus sessions with others using shareable links.

## Features

- **Session Templates**: Create reusable focus session templates (e.g., "Deep Work 90min", "Quick Focus 25min")
- **Active Timer**: Start sessions with a countdown timer, pause/resume, and track elapsed time
- **Distraction Capture**: Log distractions during sessions (phone, email, social media, thoughts, other)
- **Task Intention & Outcome**: Record what you're focusing on and what you accomplished
- **Session History**: View all completed sessions with details, outcomes, and distraction counts
- **Daily Review**: Reflect on your focus day with session stats and personal notes
- **Weekly Review**: Analyze weekly patterns (total sessions, focus time, average distractions, top template)
- **Group Sessions**: Coordinate focus sessions with shareable links, optional cloud membership, and live presence
- **Browser Notifications**: Optional five-minute reminders for upcoming group sessions
- **Export/Import**: Backup your data as JSON and restore it anytime
- **Offline-First**: All data stored locally in IndexedDB; works without internet
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Accessible UI**: Keyboard-friendly controls, labels, focus states, and dialog descriptions; full WCAG conformance still needs a dedicated audit

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm 10+

### Local Setup

1. Clone or download the project:

   ```bash
   cd focussessionflow
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open your browser to `http://localhost:3000`

### Optional Supabase Collaboration

The app remains local-only when these variables are unset. To enable anonymous cloud identity, authoritative group sessions, join history, and live participant presence:

1. Create a Supabase project and enable Anonymous Sign-Ins.
2. Configure Cloudflare Turnstile and enable CAPTCHA protection in Supabase Auth.
3. Run all files in `supabase/migrations/` in filename order in the Supabase SQL Editor.
4. Copy `.env.example` to `.env.local` and set the Supabase and Turnstile values.
5. Restart the development server.

Only the publishable key belongs in the browser. Do not expose a Supabase service-role key.
The security setup guide is in `SUPABASE_SETUP.md`. The final migrations enable daily cleanup for unused anonymous accounts and database-side create/join rate limits.

### Build for Production

```bash
# Set the real canonical domain before starting production.
export SITE_URL=https://your-production-domain.example
pnpm build
pnpm start
```

The server generates `/robots.txt`, `/sitemap.xml`, and `/llms.txt`. Only the
homepage is included in the sitemap; application routes are marked `noindex`.
Replace the example `SITE_URL` with the deployed HTTPS origin.

## Usage

### Create a Session Template

1. Click **Templates** in the sidebar
2. Click **New Template**
3. Enter a name (e.g., "Deep Work"), duration (minutes), description, and color
4. Click **Create**

### Start a Focus Session

1. Click **Start Session** button (in sidebar or dashboard)
2. Choose a template, session name, duration, and task intention
3. Click **Start session** to begin the timer
4. Click **Log Distraction** to record any interruptions
5. Click **Complete Session** when done
6. Enter your outcome and click **Finish Session**

Only one individual session can be active or paused at a time. If a session is
already in progress, the setup screen offers a resume action instead of
creating another session.

### Create a Group Session

1. Click **Group Sessions** in the sidebar (or **Plan New Session** button)
2. Fill in the session details:
   - **Session Title**: Name of the group session (e.g., "Product Design Focus Room")
   - **Shared Objective**: Optional goal for the group (e.g., "Complete wireframes")
   - **Start Date & Time**: When the session begins
   - **Focus Duration**: Minutes for focused work (5-240 min)
   - **Break Duration**: Optional break after focus (0-120 min)
   - **Meeting URL**: Optional video meeting link (HTTPS only)
   - **Your Name**: Optional organizer name
   - **Opening Message**: Optional message for participants
3. Click **Create & Share**
4. Copy the generated link and share with others via email, chat, or messaging
5. Share the complete invitation text for convenience

Keep shared details general. Anyone with the invite link can see the session title, objective, organizer name, opening message, and meeting link. Do not include passwords, private notes, or sensitive information.

### Join a Group Session

1. Receive a group session link from someone (looks like: `https://app.example.com/#...`)
2. Click the link or paste it in your browser
3. Review the session details (title, time, duration, organizer, meeting URL)
4. Click **Join Session**
5. Add your personal intention in the active session view (optional and private)
6. You'll be added to your local group sessions list

### Participate in a Group Session

1. Open **Group Sessions** to see upcoming and active sessions
2. Click **Open** on a session to view the live timer
3. The timer counts down based on the scheduled start/end times (same for all participants)
4. When the session ends, record your outcome and reflection
5. Your personal data (intention, distractions, outcome) stays private on your device

### Review Your Sessions

- **Dashboard**: See today's focus time, sessions completed, and recent activity
- **History**: Search sessions, filter by status, and delete old entries
- **Daily Review**: Reflect on today with session stats and personal notes
- **Weekly Review**: Analyze patterns and trends from the past week

### Backup Your Data

1. Click **Settings** in the sidebar
2. Click **Export Data** to download a JSON backup
3. Save the file securely

### Restore Your Data

1. Click **Settings**
2. Click **Import Data**
3. Select a previously exported JSON file
4. Your data will be imported (existing data will be replaced)

## Data Model

### SessionTemplate

- `id`: Unique identifier
- `name`: Template name (e.g., "Deep Work")
- `duration`: Duration in minutes
- `description`: Purpose of the template
- `color`: Hex color for visual identification
- `createdAt`: Timestamp

### FocusSession

- `id`: Unique identifier
- `templateId`: Reference to SessionTemplate
- `templateName`: Session name, defaulting to the selected template name
- `duration`: Configured duration for this run in minutes (optional for older data)
- `startTime`: Session start timestamp
- `endTime`: Session end timestamp (null if ongoing)
- `pausedTime`: Total paused duration in milliseconds
- `taskIntention`: What you're focusing on
- `outcome`: What you accomplished
- `distractions`: Array of Distraction objects
- `status`: "active", "paused", "completed", or "abandoned"
- `createdAt`: Timestamp

### Distraction

- `id`: Unique identifier
- `sessionId`: Reference to FocusSession
- `time`: Timestamp when distraction was logged
- `category`: "phone", "email", "social", "thoughts", "other"
- `note`: Description of the distraction

### DailyReview

- `id`: Unique identifier
- `date`: Date in YYYY-MM-DD format
- `sessionsCompleted`: Number of completed sessions
- `totalFocusTime`: Total focus time in minutes
- `notes`: Reflection notes
- `createdAt`: Timestamp

### GroupSession

- `id`: Unique identifier
- `payloadVersion`: Payload schema version
- `title`: Session title
- `sharedObjective`: Optional shared goal
- `startsAt`: ISO timestamp when session begins
- `focusMinutes`: Duration of focus phase
- `breakMinutes`: Optional duration of break phase
- `meetingUrl`: Optional video meeting link
- `organizerName`: Optional organizer name
- `openingMessage`: Optional message for participants
- `source`: "created" (organizer) or "joined" (participant)
- `joinedAt`: When participant joined (if applicable)
- `createdAt`: Timestamp
- `updatedAt`: Last modified timestamp

## Architecture

### Frontend Stack

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling
- **shadcn/ui**: Component library
- **Wouter**: Lightweight client-side routing
- **IndexedDB**: Local data persistence
- **Sonner**: Toast notifications
- **Browser Notifications API**: Optional session notifications

### Key Directories

```
client/
  src/
    pages/        ← Page components (Dashboard, Templates, etc.)
    components/   ← Reusable UI components (Sidebar, etc.)
    lib/          ← Utilities (db.ts, time.ts, seed.ts, groupSession.ts, notifications.ts)
    contexts/     ← React contexts (ThemeContext)
    index.css     ← Global styles and design tokens
```

### Group Sessions Architecture

Group sessions use coordinated timing with a local-first fallback and an optional Supabase collaboration boundary:

1. **Organizer creates** a session with title, objective, start time, duration, and optional meeting link
2. **Payload encoding**: Session details are encoded into a URL-safe base64 string
3. **Link generation**: The payload is embedded in the URL hash (e.g., `#eyJ2ZXJzaW9uIjoxLCJzZXNzaW9uSWQiOiI...`)
4. **Participant joins**: Participant receives the link, chooses a display name, and joins anonymously
5. **Synchronized timer**: All participants see the same countdown based on absolute timestamps
6. **Private outcomes**: Each participant's intentions, distractions, and outcomes stay on their device
7. **Cloud mode**: Supabase stores the authoritative session, membership/join history, and anonymous display names; Realtime Presence shows who is currently connected
8. **Local mode**: With no Supabase variables, URL sharing and browser-local participants continue to work without a server

### Data Persistence

- All data is stored in IndexedDB (browser local storage)
- No backend server required for local mode
- Supabase is optional and used only for group collaboration
- Data persists across browser sessions
- Export/import enables manual backups and data portability

## Design System

### Colors

- **Primary Accent**: `oklch(0.55 0.15 200)` — Calm teal for focus and clarity
- **Success**: `oklch(0.65 0.15 140)` — Green for completion
- **Warning**: `oklch(0.75 0.18 60)` — Amber for caution
- **Error**: `oklch(0.6 0.2 30)` — Red for destructive actions
- **Neutral Scale**: Warm grays for text and backgrounds

### Typography

- **Display**: Geist Bold, 32px for page titles
- **Heading**: Geist Semibold, 20px for section headers
- **Body**: Geist Mono, 14px for readable text
- **UI Labels**: Geist Medium, 12px uppercase for buttons and form labels

### Spacing

- 4px, 8px, 16px, 24px, 32px (multiples of 4px)
- Consistent padding and margins throughout

## Testing

The app includes realistic seed data for immediate testing:

- 4 session templates (Deep Work, Quick Focus, Study Session, Creative Work)
- 4 completed sessions with various outcomes and distractions
- 2 daily reviews with reflection notes

The app seeds templates, completed sessions, reviews, and example group sessions on first load. Focused unit tests cover payload validation/encoding, phase timing, local dates, pause accounting, and local-data boundaries.

## Accessibility

- **Accessibility**: Keyboard and screen-reader support is implemented in the main flows; run a dedicated accessibility audit before claiming WCAG conformance
- **Keyboard Navigation**: All controls accessible via keyboard
- **Focus Indicators**: Clear focus rings on interactive elements
- **Semantic HTML**: Proper heading hierarchy and form labels
- **Screen Reader Support**: Descriptive labels and ARIA attributes
- **Reduced Motion**: Respects `prefers-reduced-motion` preference

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Limitations

- **Single-device**: Data is stored locally; not synchronized across devices
- **No cloud sync**: Manual export/import required for data portability
- **Storage limits**: IndexedDB quota depends on browser (typically 50MB+)
- **Group sessions**: Local mode is coordinated only; configured cloud mode adds anonymous membership and live presence while personal activity remains local

## Privacy

- **No tracking**: No analytics or advertising services; configured cloud mode uses Supabase for group collaboration
- **Local storage only**: Personal IndexedDB and localStorage data stays on your device
- **No account required**: Anonymous Supabase identity is used only when cloud collaboration is enabled
- **Data ownership**: You control all exports and backups
- **Group sessions**: Shared details (title, time, organizer name) are in the URL; personal intentions/outcomes stay private

## Development

### Project Structure

```
focussessionflow/
├── client/              ← React frontend
│   ├── src/
│   │   ├── pages/       ← Page components
│   │   ├── components/  ← Reusable components
│   │   ├── lib/         ← Utilities and helpers
│   │   ├── contexts/    ← React contexts
│   │   └── index.css    ← Global styles
│   ├── index.html       ← HTML entry point
│   └── public/          ← Static assets
├── server/              ← Express server (for production)
├── package.json         ← Dependencies
├── vite.config.ts       ← Vite configuration
├── tsconfig.json        ← TypeScript configuration
└── README.md            ← This file
```

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server (http://localhost:3000)

# Production
pnpm build        # Build for production
pnpm start        # Run production build

# Code quality
pnpm check        # TypeScript type checking
pnpm format       # Format code with Prettier
```

### Adding Features

1. **New page**: Create a component in `client/src/pages/`
2. **New component**: Create in `client/src/components/`
3. **New utility**: Add to `client/src/lib/`
4. **Styling**: Use Tailwind utilities and CSS variables in `client/src/index.css`

## Known Issues

- None currently. Please report bugs via GitHub issues.

## Future Enhancements

- Broader cloud sync for personal data, if privacy requirements support it
- Multi-device sync
- Recurring session templates
- Session analytics and charts
- Pomodoro timer presets
- Dark mode toggle
- Custom color themes
- Group session history and analytics
- Participant attendance and join history (cloud mode already records group joins)
- Session templates for recurring group sessions

## License

MIT

## Support

For questions or issues, please refer to the documentation or create an issue in the repository.

## Apex Yard portfolio snapshot

- Status: showcase
- Category: Web
- Source of truth: [docs/portfolio.json](docs/portfolio.json)

This section is maintained from repository evidence and should be updated with docs/portfolio.json when the project changes.
