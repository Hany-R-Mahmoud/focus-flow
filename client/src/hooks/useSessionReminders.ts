import { useEffect, useRef } from "react";
import { getGroupSessions, initDB } from "@/lib/db";
import { calculateSessionStatus } from "@/lib/groupSession";
import { showGroupSessionStartingNotification } from "@/lib/notifications";

const REMINDER_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds

export function useSessionReminders() {
  const notifiedSessionsRef = useRef<Set<string>>(new Set());
  const dbInitializedRef = useRef(false);

  useEffect(() => {
    const checkForReminders = async () => {
      try {
        // Initialize DB if not already done
        if (!dbInitializedRef.current) {
          await initDB();
          dbInitializedRef.current = true;
        }

        const sessions = await getGroupSessions();
        const now = Date.now();

        for (const session of sessions) {
          const status = calculateSessionStatus(
            session.startsAt,
            session.focusMinutes,
            session.breakMinutes
          );

          // Only notify for upcoming sessions
          if (status !== "upcoming" && status !== "starting-soon") {
            continue;
          }

          // Skip if already notified
          if (notifiedSessionsRef.current.has(session.id)) {
            continue;
          }

          const sessionStartTime = new Date(session.startsAt).getTime();
          const timeUntilStart = sessionStartTime - now;

          // Notify if within 5-minute window
          if (timeUntilStart > 0 && timeUntilStart <= REMINDER_THRESHOLD_MS) {
            showGroupSessionStartingNotification(
              session.title,
              session.organizerName || "Focus Session"
            );
            notifiedSessionsRef.current.add(session.id);
          }
        }
      } catch (error) {
        console.error("Error checking session reminders:", error);
      }
    };

    // Check immediately
    checkForReminders();

    // Set up interval
    const interval = setInterval(checkForReminders, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}
