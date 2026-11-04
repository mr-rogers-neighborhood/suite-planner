# ADR-0009: Radix primitives with Tailwind

- Status: accepted
- Date: 2026-01-05

## Context

The app needs dialogs, menus, checkboxes, popovers and tooltips that work with a keyboard and a
screen reader. Hand-rolling focus traps and roving tabindex is a reliable source of accessibility
bugs.

## Decision

Use Radix primitives for interactive widgets and Tailwind CSS v4 for styling. Keep one theme file
with semantic CSS variables; components use utilities that read those variables.

## Consequences

- Focus management, keyboard behaviour and ARIA wiring come from the primitive.
- Styling stays local to the component; no global component CSS.
- Radix is unstyled, so the visual system is ours to keep consistent.
- Storybook runs the a11y addon against the same components.
