---
title: ImagePy
summary: Python tool that extracts an N-color palette from an image through binning, brightness filtering, and iterative grouping.
status: complete
links:
  github: https://github.com/Potato-Rocket/ImagePy
tags:
  - python
  - image-processing
  - tui
periods:
  - date: 2020-07-20
    label: Initial build
  - date: 2020-08-26
    label: Finished and documented
---

## What & Why

I wanted to change my Linux system's color scheme automatically when I changed my desktop wallpaper — terminal emulator, title bar, and other config files all derived from the same palette — without doing anything manually. ImagePy takes a source image, extracts a palette that accurately reflects the colors in it, and writes the results to whatever config files you point it at.

## How It Works

The palette is extracted in five phases:

1. **Preparation** — scale the image down if it's above a threshold size, then load pixels into an RGB array.
2. **Binning** — step through the image in chunks, returning each chunk's average color. Chunks with high variance (fine detail, edges) are discarded as black. This reduces the pixel count dramatically before the expensive grouping step.
3. **Flattening** — remove pixels below a brightness or saturation threshold, flatten the 2D array to a 1D list, and deduplicate identical colors with a count attribute to speed up grouping.
4. **Grouping** — seed groups from starter pixels and absorb nearby colors within a distance threshold, repeating until all pixels are assigned.
5. **Refining** — repeat grouping while adjusting the threshold until exactly the desired number of colors remains, then sort the palette.

The hard part turned out not to be the grouping algorithm itself, but making it efficient enough to run repeatedly during the refining step. Sorting the palette in a consistent, visually useful order was also more involved than expected.

## Sample Output

Source image (*Howl's Moving Castle*):

![Howl's Moving Castle wallpaper](../../assets/imagepy/moving-castle.jpg)

Binned intermediate image (scaled up to make pixels visible):

![Binned image after chunk averaging](../../assets/imagepy/binned.png)

Generated palette:

![Extracted color palette](../../assets/imagepy/palette.png)

```
#D7E7BC  #AFCB8C  #1D2E30  #537D43
#4AC09C  #83D1A1  #7B9E56  #AE5535
```

---

[Download written reflection (PDF)](/files/ImagePy-Reflections.pdf)
