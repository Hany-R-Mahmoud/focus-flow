/**
 * Browser Notifications Utility
 * Handles requesting permission and sending notifications for session events
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  return false;
}

export function canShowNotifications(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

export function showSessionStartingNotification(sessionTitle: string): void {
  if (!canShowNotifications()) return;

  new Notification("Focus Session Starting", {
    body: `${sessionTitle} is starting now. Stay focused!`,
    tag: "session-starting",
    requireInteraction: false,
  });
}

export function showSessionEndingNotification(sessionTitle: string): void {
  if (!canShowNotifications()) return;

  new Notification("Focus Session Complete", {
    body: `Great work! ${sessionTitle} has ended.`,
    tag: "session-ending",
    requireInteraction: false,
  });
}

export function showGroupSessionStartingNotification(
  sessionTitle: string,
  organizerName?: string
): void {
  if (!canShowNotifications()) return;

  const body = organizerName
    ? `Group session "${sessionTitle}" organized by ${organizerName} is starting!`
    : `Group session "${sessionTitle}" is starting!`;

  new Notification("Group Session Starting", {
    body,
    tag: "group-session-starting",
    requireInteraction: false,
  });
}

export function showGroupSessionEndingNotification(sessionTitle: string): void {
  if (!canShowNotifications()) return;

  new Notification("Group Session Complete", {
    body: `Group session "${sessionTitle}" has ended. Great collaboration!`,
    tag: "group-session-ending",
    requireInteraction: false,
  });
}

export function showDistractionLoggedNotification(): void {
  if (!canShowNotifications()) return;

  new Notification("Distraction Logged", {
    body: "Distraction recorded. Get back to focus!",
    tag: "distraction-logged",
    requireInteraction: false,
  });
}
