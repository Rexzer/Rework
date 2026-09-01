#!/usr/bin/env python3
"""Generate Rework PWA icons with no third-party deps (pure-Python PNG writer).

The icon matches the app's own logo: a diagonal gradient rounded square
(primary #FF5A36 -> secondary #5B5FEF), the same mark shown on the loading
screen. Outputs PNGs into ../public.
"""
import os
import struct
import zlib

C0 = (0xFF, 0x5A, 0x36)  # --primary
C1 = (0x5B, 0x5F, 0xEF)  # --secondary
OUT = os.path.join(os.path.dirname(__file__), "..", "public")


def lerp(a, b, t):
    return int(round(a + (b - a) * t))


def build_rgba(size, radius):
    """Return raw RGBA bytes for a size x size diagonal-gradient rounded square.
    radius <= 0 means full-bleed (no rounded corners), best for maskable/apple."""
    denom = max(1, (size - 1) * 2)
    rows = bytearray()
    r2 = radius * radius
    for y in range(size):
        rows.append(0)  # PNG filter type 0 (None) per scanline
        for x in range(size):
            t = (x + y) / denom
            r = lerp(C0[0], C1[0], t)
            g = lerp(C0[1], C1[1], t)
            b = lerp(C0[2], C1[2], t)
            a = 255
            if radius > 0:
                # transparent outside the rounded-rect corners
                dx = dy = 0
                if x < radius:
                    dx = radius - 1 - x
                elif x > size - radius:
                    dx = x - (size - radius)
                if y < radius:
                    dy = radius - 1 - y
                elif y > size - radius:
                    dy = y - (size - radius)
                if dx and dy and (dx * dx + dy * dy) > r2:
                    a = 0
            rows += bytes((r, g, b, a))
    return bytes(rows)


def write_png(path, size, radius):
    raw = build_rgba(size, radius)

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", ihdr)
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print("wrote", os.path.relpath(path), size, "radius", radius)


def main():
    os.makedirs(OUT, exist_ok=True)
    write_png(os.path.join(OUT, "icon-192.png"), 192, int(192 * 0.22))
    write_png(os.path.join(OUT, "icon-512.png"), 512, int(512 * 0.22))
    # maskable: full-bleed so the OS can apply its own mask shape
    write_png(os.path.join(OUT, "icon-maskable-512.png"), 512, 0)
    # apple touch icon: iOS rounds corners itself, so full-bleed
    write_png(os.path.join(OUT, "apple-touch-icon.png"), 180, 0)


if __name__ == "__main__":
    main()
