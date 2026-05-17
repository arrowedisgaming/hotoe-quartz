# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed
- Graph view component from the right column of content pages (`quartz.layout.ts`).

### Fixed
- Strikethrough now renders on completed task list items (`- [x] …`) by extending the
  decoration rule to the nested `<p>` that GFM emits inside "loose" task lists
  (`quartz/styles/custom.scss`).
