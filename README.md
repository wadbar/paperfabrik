# Omnisight AI Studio Engine

![Omnisight Platform Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.2.0--BETA-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

## Overview

Omnisight AI Studio Engine is a high-performance, deterministic, zero-tolerance optimized modular application environment designed for AI-driven CAD, BIM, photogrammetry, CNC routing, 3D printing simulation, PBR texturing, packaging design, and generative electronics architectures. 

It executes under absolute optimal performance limits, deploying reactive architecture, resilient edge compute, and integrated full-stack telemetry.

## Deep Integration & Architecture

- **Asynchronous Telemetry:** Graceful metrics capturing over 60 times a second to ensure 0% drift in system load and RAM usage reporting via the System Health Monitor and Terminal Overlay loggers.
- **Vite & ESNext Target:** Optimized Rollup chunking dynamically separates independent modules (React, Three.js, Lucide Icons, Recharts) to enable cold start times measured in milliseconds. Output bundles feature extreme minification. 
- **Graceful Error Recovery:** Custom Unhandled Rejection interceptors loop within the global `logger.ts` implementation to ensure runtime panics gracefully downgrade components without killing the entire loop. 

## Features

- **CAD & OpenSCAD Viewports** optimized for web execution via React and dynamic code processing.
- **AI Chat Panel** seamlessly linking contextually-grounded interactions to active geometry workflows. 
- **BIM & CNC Toolpaths** pre-configured for extreme material calculations (MDF, Aluminium, Plywood, Foam, Acrylic).
- **System Health Monitor:** Detects consecutive heap overflow events > 90% and fires proactive `WARN` events straight to the Terminal HUD.
- **Fully Containerized Ready:** Explicit ESBuild bundled `dist/server.cjs` allows instant execution on Node without external ESModule resolving delays.

## Bootstrapping Protocol & Installation

Built exclusively for Linux Debian/WSL 2 scale.

```bash
# 1. Dependency Resolution
npm install

# 2. Complete Environment Build
# Fully bundles client via Vite + ESNext Target, and unifies Express Server into a single executable .cjs.
npm run build 

# 3. Execution (Daemon Mode Recommendation)
# Fire and forget. Uninterrupted loop.
NODE_ENV=production npm run start
```

## Maintenance & Scalability

Every functional method, async sequence, and React side-effect relies on rigid dependency arrays (`useMemo`, `useCallback`) optimized to extreme capacities to avoid redundant Virtual DOM diffing during high-stress simulations (such as the Photogrammetry Viewport and Generative UI clusters).
