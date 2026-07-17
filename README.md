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
- **Group Sessions**: Coordinate focus sessions with others using shareable links (coordinated, no backend)
- **Browser Notifications**: Optional notifications for session start/end events
- **Export/Import**: Backup your data as JSON and restore it anytime
- **Offline-First**: All data stored locally in IndexedDB; works without internet
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Accessible**: WCAG 2.2 AA compliant with keyboard navigation and screen reader support

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

### Build for Production

```bash
pnpm build
pnpm start
```

## Usage

### Create a Session Template

1. Click **Templates** in the sidebar
2. Click **New Template**
3. Enter a name (e.g., "Deep Work"), duration (minutes), description, and color
4. Click **Create**

### Start a Focus Session

1. Click **Start Session** button (in sidebar or dashboard)
2. The timer will begin immediately
3. Enter your task intention in the text field
4. Click **Log Distraction** to record any interruptions
5. Click **Complete Session** when done
6. Enter your outcome and click **Finish Session**

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

### Join a Group Session

1. Receive a group session link from someone (looks like: `https://app.example.com/#...`)
2. Click the link or paste it in your browser
3. Review the session details (title, time, duration, organizer, meeting URL)
4. Enter your personal intention (optional, stays private on your device)
5. Click **Join Session**
6. You'll be added to your local group sessions list

### Participate in a Group Session

1. Open **Group Sessions** to see upcoming and active sessions
2. Click **Open** on a session to view the live timer
3. The timer counts down based on the scheduled start/end times (same for all participants)
4. When the session ends, record your outcome and reflection
5. Your personal data (intention, distractions, outcome) stays private on your device

### Review Your Sessions

- **Dashboard**: See today's focus time, sessions completed, and recent activity
- **History**: Browse all sessions, filter by status, and delete old entries
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
- `templateName`: Template name (cached for convenience)
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

Group sessions use **coordinated timing** without a backend:

1. **Organizer creates** a session with title, objective, start time, duration, and optional meeting link
2. **Payload encoding**: Session details are encoded into a URL-safe base64 string
3. **Link generation**: The payload is embedded in the URL hash (e.g., `#eyJ2ZXJzaW9uIjoxLCJzZXNzaW9uSWQiOiI...`)
4. **Participant joins**: Participant receives link, decodes payload, and saves to local IndexedDB
5. **Synchronized timer**: All participants see the same countdown based on absolute timestamps
6. **Private outcomes**: Each participant's intentions, distractions, and outcomes stay on their device
7. **No backend**: All coordination happens via URL sharing; no server required

### Data Persistence
- All data is stored in IndexedDB (browser local storage)
- No backend server required
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

All features can be tested immediately upon first load without manual setup.

## Accessibility

- **WCAG 2.2 AA Compliant**: Contrast ratios meet standards
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
- **Group sessions are coordinated only**: No backend; participants don't see each other's data

## Privacy

- **No tracking**: No analytics, cookies, or third-party services
- **Local storage only**: All data stays on your device
- **No account required**: Complete anonymity
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

- Cloud sync with optional Supabase backend
- Multi-device sync
- Recurring session templates
- Session analytics and charts
- Pomodoro timer presets
- Dark mode toggle
- Custom color themes
- Group session history and analytics
- Participant attendance tracking (local only)
- Session templates for recurring group sessions

## License

MIT

## Support

For questions or issues, please refer to the documentation or create an issue in the repository.
