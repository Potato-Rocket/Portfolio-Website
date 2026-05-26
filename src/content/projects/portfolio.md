---
title: This Portfolio
summary: Personal engineering portfolio built with Astro, Svelte, Tailwind, and deployed to Cloudflare Workers.
status: ongoing
tags:
  - web
  - astro
  - typescript
links:
  github: https://github.com/Potato-Rocket/Portfolio-Website
  live: https://oscar.stomberg.us
periods:
  - date: 2026-05-19
---

## Why

I have been making personal projects for years, and have often wished I had a good way to share or display what I had done. While GitHub repos have their place, not everything is code--and it's not very personal either. Following my [software engineering](/projects/hanover-cms) course at WPI, I felt confident in my newfound web development skills. This had been a blocker before, since I really wanted to write the portfolio website myself instead of resorting to a website builder, I just didn't know where to start.

## Astro + Svelte

Prior to this project, all of my web development experience was in Next.js + React. I knew this was way overkill for a mostly static collection of text and images, so I figured it would be an opportunity to learn a new framework. Astro was a natural fit--content rendered on the server side, but with the option to integrate other frameworks as needed for the occasional interactive component.

When the time came to implement features such as dynamic project tag filtering, I was forced to make a decision about frameworks. While it was tempting to stick with the TSX components I knew and go with something like Preact, I decided to stray somewhat from my comfort zone and choose what I thought would actually be the best fit for this site. Svelte best fit the "do what you can at build time" philosophy guiding Astro, and thus far has worked out quite well.

## Deployment

Thanks to Cloudflare's direct integration with Astro and GitHub, and the fact that I already posessed a private domain, deployment was dead simple. Because this is such a lightweight app, the limits of Cloudflare Workers' free tier has proved more than enough by orders of magnitude.

## What I've learned

Throughout the process of building this app I've learned a good deal. For starters, my understanding of and skill with Tailwind CSS has improved dramatically--and I've realized the extent to which I previously took this area of web development for granted. Furthermore, the variety in the frameworks I've used for this site has deepened my understanding of web frameworks and web development in general.

## What's next

This site is still under active development! If the content pages look empty or there's some weirdness, don't fret; come back in a week or so. And if you have any specific feedback on the site and you don't know me personally, my email is linked at the footer--feel free to let me know what you think.

