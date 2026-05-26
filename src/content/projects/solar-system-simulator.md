---
title: Solar System Simulator
summary: Physics-based solar system simulation with real-time 3D rendering, written in Java with Graphics2D.
status: complete
featured: true
tags:
  - java
  - graphics
  - physics
  - simulation
links:
  github: https://github.com/Potato-Rocket/Solar-System-Simulator
related:
  - star-map
periods:
  - date: 2021-02-01
    label: Built initial version
  - date: 2025-04-01
    label: Revived, major refactor
---

## Overview

Solar System Simulator is an n-body gravitational physics simulation with a custom 3D renderer, written entirely in Java. I first built it in high school as an experiment in numerical integration ad 3D graphics; after a long hiatus I came back to it in college for a significant refactor--better architecture, cleaner physics abstractions, and a more capable renderer.

The core loop computes pairwise gravitational forces across all bodies, integrates the equations of motion, detects collisions, and renders a frame. Everything is configurable via `.properties` files so you can define any planetary system without touching code.

## Physics

Three numerical integrators are implemented and selectable at runtime via the `Integrator` interface:

- **Explicit Euler:** simplest, energy-drift over long runs
- **Symplectic Euler:** better energy conservation for Hamiltonian systems; the default for orbital mechanics
- **Velocity Verlet:** second-order accuracy, good for tightly-bound systems

The `GravityCalculator` computes acceleration on each body from every other body's mass and position. `CollisionDetector` checks sphere-on-sphere overlaps each step and fires `CollisionEvent`s. `BodyHistory` stores a rolling window of past positions so orbital trails can be drawn.

## Renderer

The 3D view is built entirely on Java's `Graphics2D`--no OpenGL, no scene graph. `Graphics3D` (a class I wrote) handles the orthographic projection: the camera attitude is stored as two angles (azimuth, elevation), and every 3D point is projected to screen coordinates via a rotation matrix applied on the CPU each frame.

Bodies can be rendered either to true scale (which makes moons invisible next to the Sun) or on a log scale that keeps everything visible at the cost of realism--toggled with F2.

## Configuration

Two `.properties` files drive a run:

- `setup.properties` -- graphical settings, which system file to load, integrator choice
- `system.properties` -- initial positions, velocities, masses, and radii for each body

A Python autogeneration script (`resources/autogen.py`) can produce a system file with randomly generated bodies and intial conditions, within specified bounds.
