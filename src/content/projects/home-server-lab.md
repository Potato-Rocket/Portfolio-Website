---
title: Home Server Lab
summary: Multi-node home server cluster managed with Ansible and Docker Compose, running 28+ containerized services.
status: ongoing
featured: true
tags:
  - infrastructure
  - devops
  - linux
  - docker
related:
  - daily-greeting-generator
  - content-management-system
periods:
  - date: 2025-08-03
    label: Single media server
  - date: 2025-10-01
    label: Integrated Daily Greeting Generator
  - date: 2026-01-31
    label: Ansible provisioning
  - date: 2026-03-08
    label: Reverse proxy, fully centralized configuration
  - date: 2026-05-05
    label: Update automation, backup hardening, security improvements
  - date: 2026-08-19
    label: Observability stack rework
---

## Overview

The backbone of many personal projects, as well as a hub for many critical services I use daily. The home server lab consists of six assorted computers (for the most part used and repurposed), three of which serve as primary Docker hosts, the others serving more specialized or low-level services. The entire cluster is provisioned via Ansible, including the deployment and management of Docker Compose stacks. At the time of this writing there are 29 services actively being managed, totaling about 56 running containers. This includes supplementary services, 
