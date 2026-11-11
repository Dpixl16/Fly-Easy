#!/usr/bin/env python3
"""Cut a sharp "detail patch" for the Airports globe from NASA source tiles.

The globe's base Earth image is 4096 px wide (~10 km per pixel), which goes
soft when you zoom to a region. A patch is a small, much sharper day + night
image (~0.9 km per pixel) for one region. airports-globe.js blends it over
the base globe and only downloads it when someone zooms near it.

Source tiles (public domain, NASA; download once, keep them OUT of the repo):
  Day   - Blue Marble NG, July, topography + bathymetry, 21600x21600 tiles:
          https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/july/world.topo.bathy.200407.3x21600x21600.<TILE>.jpg
  Night - Black Marble 2016, 21600x21600 tiles:
          https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_<TILE>.jpg
  Tiles: columns A-D = 90 degree longitude bands starting at 180W;
         rows 1 = 90N..0, 2 = 0..90S.  (California = A1, Europe = C1, ...)

Usage:
  python3 tools/make_globe_patch.py NAME LON_MIN LAT_MIN LON_MAX LAT_MAX DAY_TILE.jpg NIGHT_TILE.jpg
Example (the Bay Area patch, covers SFO + SJC):
  python3 tools/make_globe_patch.py bayarea -130 30 -114 44 day_A1.jpg night_A1.jpg

It writes images/globe/patches/NAME-day.jpg and NAME-night.jpg and prints
the line to paste into window.FLY_EASY_GLOBE_PATCHES in airports-data.js.
Needs only macOS's built-in `sips`. The patch must fit inside one tile.
"""
import os
import subprocess
import sys
import tempfile

TILE_PX = 21600
PX_PER_DEG = TILE_PX / 90.0
MAX_W = 2048          # output width cap (keeps each patch ~0.3-0.6 MB)
QUALITY = "80"


def tile_of(lon, lat):
    col = "ABCD"[min(3, int((lon + 180) // 90))]
    row = "1" if lat >= 0 else "2"
    return col + row


def crop(src, lon_min, lat_min, lon_max, lat_max, out):
    tile = tile_of(lon_min, lat_max)
    if tile != tile_of(lon_max - 1e-9, lat_min + 1e-9):
        sys.exit("Patch crosses a tile edge; pick bounds inside one tile.")
    t_lon0 = -180 + "ABCD".index(tile[0]) * 90
    t_lat0 = 90 if tile[1] == "1" else 0
    x = round((lon_min - t_lon0) * PX_PER_DEG)
    y = round((t_lat0 - lat_max) * PX_PER_DEG)
    w = round((lon_max - lon_min) * PX_PER_DEG)
    h = round((lat_max - lat_min) * PX_PER_DEG)
    ow = min(MAX_W, w)
    oh = round(h * ow / w)
    with tempfile.TemporaryDirectory() as tmp:
        mid = os.path.join(tmp, "crop.jpg")
        subprocess.run(["sips", "-c", str(h), str(w), "--cropOffset", str(y), str(x),
                        src, "--out", mid], check=True, capture_output=True)
        subprocess.run(["sips", "-z", str(oh), str(ow), "-s", "formatOptions", QUALITY,
                        mid, "--out", out], check=True, capture_output=True)
    return tile, ow, oh


def main():
    if len(sys.argv) != 8:
        sys.exit(__doc__)
    name = sys.argv[1]
    lon_min, lat_min, lon_max, lat_max = map(float, sys.argv[2:6])
    day_src, night_src = sys.argv[6], sys.argv[7]
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, "images", "globe", "patches")
    os.makedirs(out_dir, exist_ok=True)
    for kind, src in (("day", day_src), ("night", night_src)):
        out = os.path.join(out_dir, f"{name}-{kind}.jpg")
        tile, w, h = crop(src, lon_min, lat_min, lon_max, lat_max, out)
        print(f"{kind:5s} tile {tile} -> {os.path.relpath(out, root)} ({w}x{h}, {os.path.getsize(out) // 1024} KB)")
    print("\nAdd to window.FLY_EASY_GLOBE_PATCHES in airports-data.js:")
    print(f'  {{ id: "{name}", bounds: [{lon_min:g}, {lat_min:g}, {lon_max:g}, {lat_max:g}], '
          f'day: "images/globe/patches/{name}-day.jpg", night: "images/globe/patches/{name}-night.jpg" }},')


if __name__ == "__main__":
    main()
