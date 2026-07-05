# GEO Pulse MVP Design Brief

## Product Style

GEO Pulse MVP is a dense operational admin prototype. It should feel quiet, utilitarian, and work-focused rather than promotional.

## Visual Rules

- Use existing dark admin surfaces, compact panels, status pills, tables, info rows, and split layouts.
- Prefer concise labels and scan-friendly tables for operational data.
- Keep controls in existing toolbar, panel, drawer, and action-row patterns.
- Do not introduce decorative hero sections, gradients, illustrations, or marketing-style cards.
- Preserve routing, tabs, data flow, and business behavior unless explicitly requested.

## Component Rules

- Reuse `surface panel`, `tableMarkup`, `statusMarkup`, `info-row`, `cell-title`, and `cell-sub`.
- Audit/security data should appear as operational tables with compact metadata, not as large cards.
- Sensitive values must remain masked or omitted in UI.
- Empty states should be terse and fit inside the existing panel structure.
