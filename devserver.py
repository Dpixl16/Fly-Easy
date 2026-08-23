#!/usr/bin/env python3
"""Local dev server for this static site.

Same as `python3 -m http.server`, except every response tells the
browser never to cache it. Plain http.server sends no Cache-Control
header at all, so browsers fall back to heuristic caching and will
often reuse an old copy of a page instead of fetching the version
that's actually on disk right now -- normal link clicks can silently
show stale content until a hard refresh forces revalidation. That's
fine for a deployed site (GitHub Pages, which is unaffected by this
file), but it's confusing during local development.
"""
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    # An explicit CLI arg wins; otherwise defer to $PORT (set by the
    # harness when it assigns a free port) and fall back to 4173 for
    # plain manual runs.
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = int(os.environ.get("PORT", 4173))
    http.server.test(HandlerClass=NoCacheHandler, port=port)
