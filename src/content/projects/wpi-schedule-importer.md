---
title: WPI Class Schedule Importer
summary: Python TUI that parses WPI's course schedule format and exports it as an iCalendar file for import into any calendar app.
status: complete
tags:
  - python
  - tui
  - tools
links:
  github: https://github.com/Potato-Rocket/WPI-Class-Schedule-Importer
periods:
  - date: 2025-09-29
    label: Initial build
  - date: 2026-03-09
    label: Recurrence and timezone fixes
---

## Overview

Every semester at WPI I had to manually re-enter my class schedule into Outlook--ten or fifteen events with meeting patterns like "M-W-F, 10:00--10:50, Higgins 116, Aug 26--Dec 12." After doing this twice I automated it.

The tool reads the Excel file Workday exports from **Academics → View My Courses → Export to Excel**, parses the meeting pattern strings, and writes a standard `.ics` file ready to import into Outlook, Google Calendar, or anything else that speaks iCalendar.

## How it works

The messiest part is the "Meeting Patterns" column. Workday packs all the information for a section--days of week, time range, room--into a single cell, sometimes with multiple patterns per class for classes with multiple meeting types and thus multiple sections. The parser unpacks that with string logic, converts day abbreviations to iCalendar `BYDAY` recurrence rules, and handles edge cases like lab sections with irregular schedules.

Timezone handling uses `America/New_York` throughout so the output survives a DST boundary mid-semester. The recurrence and timezone fixes in early 2026 addressed cases where events in the second half of spring semester shifted by an hour in some calendar clients.

## Usage modes

**Interactive (TUI):** run with no arguments. A file picker opens for the Excel input, a save dialog picks the output path, and a menu lets you check off which sections to include--useful for excluding a section you dropped.

**Scripted:** pass files and flags directly and skip all dialogs. Handy for re-generating mid-semester if a room changes, or for general scripting automations.

```bash
uv run class_schedule.py Fall.xlsx Spring.xlsx -o schedule.ics -y
```

The tool runs under `uv` so there's nothing to install -- `uv run` handles the virtualenv and dependencies automatically.
