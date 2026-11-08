# Changelog

Written for people, not commits: what you can do now that you could not before, and what changed
underneath enough to matter.

## [Unreleased]

No changes yet.

## [0.1.2] - 2026-11-07

### Fixed

- The app's mark is where the package looks for it. 0.1.0 and 0.1.1 shipped Electron's default icon
  because the artwork was in `build/` and this app's build resources are `resources/`.

## [0.1.1] - 2026-11-07

### Added

- The app has its own icon, on the window and in the menu entry the system draws.

### Changed

- An update now arrives from Suite Start. An app the hub launched leaves its own update check
  alone, because two programs writing one binary is not a race worth having. A copy run from a
  folder keeps its own updater.
- The update report is written even on a first launch, so the hub can say "not checked" instead of
  showing an answer from whenever the app last ran.

### Fixed

- The artifact name carries no spaces, so the signed feed names a file that exists.

## [0.1.0] - 2026-11-06

### Added

- First packaged release: tasks, projects and a calendar in a file you own.
