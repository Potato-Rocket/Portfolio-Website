#!/bin/bash

git switch main
git pull
git switch dev
git push
gh pr create
