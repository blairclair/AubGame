#!/usr/bin/env python3
"""Local test server: run `python3 tools/serve.py` from the game folder, then open http://localhost:8000/?jump=stages
Like `python3 -m http.server`, but tells the browser never to cache, so edits show up on a normal refresh."""
import http.server
import os

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


http.server.ThreadingHTTPServer(('', 8000), NoCache).serve_forever()
