# AI Study Planner Spec

## 1. User Flow

```text
Landing Page
  -> Login / Register
  -> First-Time Setup
      -> Add Subjects
      -> Set Availability
      -> Add Deadlines
      -> Set Study Goal
  -> Dashboard
      -> Generate Study Plan
      -> View Calendar
      -> Start Pomodoro
      -> Complete Session
      -> Track Progress
```

## 2. Business Rules

### Priority Rules

```text
Deadline within 1 day   -> Critical
Deadline within 3 days  -> High
Deadline within 7 days  -> Medium
Deadline beyond 7 days  -> Low
```

### Difficulty Rules

```text
Easy   -> 30 minutes
Medium -> 60 minutes
Hard   -> 90 minutes
```

### Available Time Rules

```text
Planner can only create study sessions inside the user's availability windows.
Sessions must never exceed the daily study limit.
```

### Conflict Rules

```text
1. Higher priority deadline wins.
2. If priority is tied, earlier due date wins.
3. If due date is tied, harder subjects win.
4. If still tied, the planner can split sessions across days.
```

## 3. AI Logic

```text
Read subjects
-> Read deadlines
-> Read availability
-> Score each deadline
-> Sort by score
-> Assign sessions into valid windows
-> Save schedule
-> Notify user if capacity is not enough
```

## 4. Study Planner Algorithm

### Scoring

```text
Subject Difficulty
Hard = 3
Medium = 2
Easy = 1

Deadline Urgency
Tomorrow = 5
3 days = 4
7 days = 3
14 days = 2

Priority Boost
Critical = 3
High = 2
Medium = 1
Low = 0

Total Priority Score = Difficulty + Urgency + Priority Boost
```

### Scheduling

```text
1. Sort by total priority score.
2. Build available time windows per day.
3. Place sessions inside the first valid window with remaining capacity.
4. Use 30-90 minute blocks.
5. Stop when deadline work is fully assigned or capacity runs out.
```

## 5. Non-Functional Requirements

```text
Performance: generate schedule in under 3 seconds
Security: hashed passwords, JWT auth, protected routes
Responsive: desktop, tablet, mobile
Accessibility: dark mode, keyboard navigation, readable fonts
```

## 6. Data Flow

```text
Student -> Add Subject -> Backend -> Database -> Planner -> Study Plan -> Dashboard
```

## 7. Database Relationships

```text
User -> Subjects
User -> Deadlines
User -> Availability
User -> Study Sessions
User -> Progress
```

## 8. UI Rules

```text
Dashboard must always show:
1. Today's Tasks
2. Upcoming Deadlines
3. Progress
4. Calendar
5. Quick Actions
```

## 9. Error Handling

```text
No subjects           -> Show: "Please add a subject."
No availability       -> Show: "Please set your availability."
No deadlines          -> Generate balanced schedule only.
Insufficient capacity -> Notify the user and leave overflow unscheduled.
```

## 10. Future AI

```text
Chatbot
Reviewer Generator
Flashcards
Quiz Generator
Lecture Summary
Voice Assistant
Google Calendar Sync
```
