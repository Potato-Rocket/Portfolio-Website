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

```bash
uv run class_schedule.py 
```
```text
Welcome to Class Schedule Importer!

Please select an excel file to read.
Loading excel spreadsheet...
Finding headers...
Finding sections...
Read 14 rows from spreadsheet
Total sections loaded: 14

Load another file? (y/n): n
Grouping sections into courses...
Grouping courses into time frames...

14 sections, 8 courses, and 3 time frames found!

Verifying schedule data...
Discarded section WPE 1221-F01 because not scheduled.
Discarded course WPE 1221 due to no scheduled sections.
Discarded time frame from 2025-08-21 to 2025-12-12 due to no remaining courses.

13 sections, 7 courses, and 2 time frames found!

============================================================
Tree view of time frames, courses, and sections
============================================================

2025-08-21 to 2025-10-10:
│
├── ME 3310 - Kinematics Of Mechanisms
│   ├── ME 3310-AL01      M, T, R, F       08:00 - 08:50
│   └── ME 3310-AX01      W                08:00 - 08:50
│
├── ME 1800 - Manufacturing Science, Prototyping, And Computer-Controlled Machining
│   ├── ME 1800-AL01      T, R             15:00 - 15:50
│   ├── ME 1800-AX03      T, R             13:00 - 14:50
│   └── ME 1800-AD01      W                11:00 - 11:50
│
├── RBE 3001 - Unified Robotics III
│   ├── RBE 3001-AX01     W                13:00 - 14:50
│   └── RBE 3001-AL01     M, T, R, F       11:00 - 11:50
│
└── GOV 1320 - Topics In International Politics
    └── GOV 1320-A01      M, R             18:30 - 20:20

2025-10-20 to 2025-12-12:
│
├── RBE 3002 - Unified Robotics IV
│   ├── RBE 3002-BL01     M, T, R, F       11:00 - 11:50
│   └── RBE 3002-BX01     W                13:00 - 14:50
│
├── MA 3631 - Mathematical Statistics
│   ├── MA 3631-BL01      M, T, R, F       15:00 - 15:50
│   └── MA 3631-BD01      W                12:00 - 12:50
│
└── ID 2050 - SOC SCI RES-IQP-
    └── ID 2050-B05       M, R             18:30 - 20:20

============================================================
Select sections to export to calendar
============================================================

Time frame: 2025-08-21 to 2025-10-10
  (y)es / (n)o / (s)pecific courses? y
  ✓ Added all courses in this time frame

Time frame: 2025-10-20 to 2025-12-12
  (y)es / (n)o / (s)pecific courses? y
  ✓ Added all courses in this time frame

13 sections out of 13 approved for export.

Generating iCalendar data...
Please select a location to save the iCalendar file.
iCalendar data saved to /home/oscar/Downloads/test_output.ics

Thank you for using Class Schedule Importer!
```

**Scripted:** pass files and flags directly and skip all dialogs. Handy for re-generating mid-semester if a room changes, or for general scripting automations.

```bash
uv run class_schedule.py Fall.xlsx Spring.xlsx -o schedule.ics -y
```

The tool runs under `uv` so there's nothing to install -- `uv run` handles the virtualenv and dependencies automatically.
