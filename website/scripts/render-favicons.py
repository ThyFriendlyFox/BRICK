#!/usr/bin/env python3
"""Render PNG favicons from the BRICK mark geometry (matches static/favicon.svg). Do not use logo.png for these."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"


def draw_mark(size: int) -> Image.Image:
	scale = size / 32.0
	img = Image.new("RGBA", (size, size), (0, 0, 0, 255))
	d = ImageDraw.Draw(img)

	def r(x: float, y: float, w: float, h: float, fill: tuple[int, int, int, int]) -> None:
		x0, y0 = int(x * scale), int(y * scale)
		x1, y1 = int((x + w) * scale), int((y + h) * scale)
		d.rectangle([x0, y0, max(x0, x1 - 1), max(y0, y1 - 1)], fill=fill)

	r(9, 9, 17, 17, (61, 61, 61, 255))
	r(4, 4, 17, 17, (255, 90, 31, 255))
	r(9.5, 9.5, 6, 6, (0, 0, 0, 255))
	return img


def main() -> None:
	STATIC.mkdir(parents=True, exist_ok=True)
	draw_mark(128).save(STATIC / "icon.png", "PNG")
	draw_mark(180).save(STATIC / "apple-touch-icon.png", "PNG")
	print(f"Wrote {STATIC / 'icon.png'} and {STATIC / 'apple-touch-icon.png'}")


if __name__ == "__main__":
	main()
