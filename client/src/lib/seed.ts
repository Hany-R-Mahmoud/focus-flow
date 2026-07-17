/**
 * Seed data generator for FocusSessionFlow
 * Provides realistic sample data for demonstration and testing
 */

import {
  SessionTemplate,
  FocusSession,
  DailyReview,
} from "./db";
import { GroupSession } from "./db";

export function generateSeedData() {
  // Session templates
  const templates: SessionTemplate[] = [
    {
      id: "template_1",
      name: "Deep Work",
      duration: 90,
      description: "Focused deep work session with minimal interruptions",
      color: "#0891b2",
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    },
    {
      id: "template_2",
      name: "Quick Focus",
      duration: 25,
      description: "Pomodoro-style short focus burst",
      color: "#06b6d4",
      createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
    },
    {
      id: "template_3",
      name: "Study Session",
      duration: 60,
      description: "Dedicated study time for learning",
      color: "#0ea5e9",
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    },
    {
      id: "template_4",
      name: "Creative Work",
      duration: 120,
      description: "Extended creative session for design or writing",
      color: "#00d9ff",
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    },
  ];

  // Focus sessions (past week)
  const now = Date.now();
  const sessions: FocusSession[] = [
    {
      id: "session_1",
      templateId: "template_1",
      templateName: "Deep Work",
      startTime: now - 2 * 24 * 60 * 60 * 1000,
      endTime: now - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000,
      pausedTime: 0,
      taskIntention: "Complete project architecture document",
      outcome: "Finished 80% of the document, need to review tomorrow",
      distractions: [
        {
          id: "dist_1",
          sessionId: "session_1",
          time: now - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
          category: "phone",
          note: "Slack notification",
        },
        {
          id: "dist_2",
          sessionId: "session_1",
          time: now - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
          category: "thoughts",
          note: "Started thinking about lunch",
        },
      ],
      status: "completed",
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: "session_2",
      templateId: "template_2",
      templateName: "Quick Focus",
      startTime: now - 1 * 24 * 60 * 60 * 1000,
      endTime: now - 1 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000,
      pausedTime: 0,
      taskIntention: "Review pull requests",
      outcome: "Reviewed 3 PRs, left comments for 2",
      distractions: [],
      status: "completed",
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
    },
    {
      id: "session_3",
      templateId: "template_3",
      templateName: "Study Session",
      startTime: now - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
      endTime: now - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
      pausedTime: 5 * 60 * 1000,
      taskIntention: "Learn React hooks patterns",
      outcome: "Completed 3 exercises, understood useContext better",
      distractions: [
        {
          id: "dist_3",
          sessionId: "session_3",
          time: now - 1 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000,
          category: "email",
          note: "Checked email",
        },
      ],
      status: "completed",
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
    },
    {
      id: "session_4",
      templateId: "template_4",
      templateName: "Creative Work",
      startTime: now - 6 * 60 * 60 * 1000,
      endTime: now - 2 * 60 * 60 * 1000,
      pausedTime: 10 * 60 * 1000,
      taskIntention: "Design new dashboard layout",
      outcome: "Created 2 mockups, need feedback from team",
      distractions: [
        {
          id: "dist_4",
          sessionId: "session_4",
          time: now - 5 * 60 * 60 * 1000,
          category: "other",
          note: "Coffee break",
        },
      ],
      status: "completed",
      createdAt: now - 6 * 60 * 60 * 1000,
    },
  ];

  // Daily reviews
  const reviews: DailyReview[] = [
    {
      id: "review_1",
      date: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      sessionsCompleted: 1,
      totalFocusTime: 90,
      notes: "Good focus today, minimal distractions. Need to work on consistency.",
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: "review_2",
      date: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      sessionsCompleted: 2,
      totalFocusTime: 85,
      notes: "Productive day. Completed PR review and made progress on learning.",
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
    },
  ];

  // Group sessions (upcoming and past)
  const groupSessions: GroupSession[] = [
    {
      id: "group_1",
      payloadVersion: 1,
      title: "Team Focus Friday",
      sharedObjective: "Weekly team focus session to collaborate on sprint goals",
      startsAt: new Date(now + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      focusMinutes: 60,
      breakMinutes: 15,
      meetingUrl: "https://meet.google.com/team-focus",
      organizerName: "Alex",
      openingMessage: "Let's focus together on our sprint goals!",
      source: "created",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "group_2",
      payloadVersion: 1,
      title: "Study Group - React Patterns",
      sharedObjective: "Learn advanced React patterns together",
      startsAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      focusMinutes: 90,
      breakMinutes: 10,
      meetingUrl: "https://meet.google.com/react-study",
      organizerName: "Jordan",
      openingMessage: "Welcome! Let's dive into useReducer and custom hooks.",
      source: "created",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "group_3",
      payloadVersion: 1,
      title: "Morning Standup Focus",
      sharedObjective: "Start the day with focused work on priority tasks",
      startsAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (ended)
      focusMinutes: 45,
      breakMinutes: 5,
      meetingUrl: "https://meet.google.com/standup",
      organizerName: "Sam",
      openingMessage: "Let's crush our daily goals!",
      source: "created",
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return { templates, sessions, reviews, groupSessions };
}
