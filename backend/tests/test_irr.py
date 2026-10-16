import socketserver
import threading
import unittest
from unittest import mock

from collector import apis

RPSL = """route:          196.1.0.0/24
descr:          Example
origin:         AS64500
source:         RIPE

route6:         2001:db8::/32
origin:         AS64500
source:         RIPE
"""


class _Handler(socketserver.StreamRequestHandler):
    def handle(self):
        self.query = self.rfile.readline().decode().strip()
        self.server.queries.append(self.query)
        self.wfile.write(self.server.reply.encode())


def _serve(reply):
    srv = socketserver.TCPServer(("127.0.0.1", 0), _Handler)
    srv.reply, srv.queries = reply, []
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


class IrrTest(unittest.TestCase):
    def test_parse_routes(self):
        self.assertEqual(apis.parse_irr_routes(RPSL), {"196.1.0.0/24", "2001:db8::/32"})
        self.assertEqual(apis.parse_irr_routes("%  No entries found\n"), set())

    def test_fetch_irr_routes_over_whois(self):
        found, empty = _serve(RPSL), _serve("% No entries found\n")
        real_connect = apis.socket.create_connection
        ports = {"whois.ripe.net": found, "whois.radb.net": empty}

        def fake_connect(addr, timeout=None):
            host, _ = addr
            if host not in ports:  # registre injoignable
                raise OSError("unreachable")
            return real_connect(("127.0.0.1", ports[host].server_address[1]), timeout=timeout)

        with mock.patch.object(apis.socket, "create_connection", fake_connect), \
             mock.patch.object(apis, "IRR_DELAY_SECONDS", 0):
            r = apis.fetch_irr_routes(64500)

        self.assertEqual(found.queries, ["-i origin AS64500"])
        self.assertEqual(r["route_objects"], 2)
        self.assertEqual(r["sources"], ["RIPE"])
        self.assertEqual(r["unreachable"], ["AFRINIC"])
        self.assertEqual(r["queried"], 2)
        for s in (found, empty):
            s.shutdown()


if __name__ == "__main__":
    unittest.main()
