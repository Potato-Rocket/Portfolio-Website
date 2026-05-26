---
title: Daily Greeting Generator
summary: Local LLM-generated morning greeting delivered via TTS, personalized with live weather, music selection, and a random literature excerpt.
status: complete
tags:
  - python
  - llm
  - docker
  - homeassistant
links:
  github: https://github.com/Potato-Rocket/Daily-Greeting-Generator
related:
  - selfhosting
periods:
  - date: 2025-10-01
    label: Initial build
  - date: 2025-12-12
    label: Refactored and simplified
  - date: 2026-03-19
    label: Docker + Piper TTS rewrite, web UI
  - date: 2026-05-14
    label: Final polish
---

## What is it?

Have you ever felt that the typical alarm clock is a bit boring? Fair enough. Perhaps you've tried a musical alarm, or even an automated greeting system. But anything can get repetitive and boring after enough mornings. This project was an experiment with injecting a bit of randomness and whimsy into my mornings, as well as a foray into running local LLMs usefully, integrating web APIs, and prompt structuring.

The Daily Greeting Generator is a Python script that uses live weather data, literary excerpts from Project Gutenberg, and and an album from my digital music collection to inspire a daily greeting message, composed by a local LLM model (most recently `qwen3.5:8b`) and converted to audio by PiperTTS. This system is integrated with my instances of Home Assistant and Music Assistant, such that it can play on my room's stereo system automatically.

## How it works

The multi-stage prompt pipeline is run asynchronously in the early hours of the morning and takes roughly two minutes running on an RTX 3050. The process executes as follows:

1. Fetch the weather prediction for the day and morning from the weather.gov API.
2. Use the Gutendex API to fetch a random book from Project Gutenberg, weighted toward more popular books.
3. Select a random excerpt from the book and have the LLM evaluate whether it is a good source for literary analysis (yes or no).
4. Repeate 2 + 3 until a literary excerpt is accepted.
5. Fetch the metadata for five random albums. Have the LLM evaluate which might pair best with the chosen excerpt.
6. Have a multimodal LLM provide a description of the album art for the chosen album.
7. Synthesize the weather, excerpt, and album info into a final daily greeting, with a reasoning phase and randomly determined target length.

Every stage of this pipeline is designed to degrade gracefully in the event of failure such as API unavailability. The script is deployed in a docker container with a simple Flask API wrapper, allowing it to be easily interfaced with other services such as Home Assistant, my music server, and my Ollama instance. A basic web interface was eventually added to provide an easy way to view the most recent and historical greeting generations.

## An example
