import select
import socketserver

import paramiko

HOST = "34.239.247.38"
USER = "paradisebeach"
PASSWORD = "Alexandre2026@@"
REMOTE_HOST = "127.0.0.1"
REMOTE_PORT = 3306
LOCAL_HOST = "127.0.0.1"
LOCAL_PORT = 3306

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(
    HOST,
    username=USER,
    password=PASSWORD,
    look_for_keys=False,
    allow_agent=False,
    timeout=15,
    auth_timeout=15,
    banner_timeout=15,
)
transport = client.get_transport()
transport.set_keepalive(30)


class Handler(socketserver.BaseRequestHandler):
    def handle(self):
        chan = transport.open_channel(
            "direct-tcpip", (REMOTE_HOST, REMOTE_PORT), self.request.getpeername()
        )
        try:
            while True:
                readers, _, _ = select.select([self.request, chan], [], [])
                if self.request in readers:
                    data = self.request.recv(1024)
                    if not data:
                        break
                    chan.sendall(data)
                if chan in readers:
                    data = chan.recv(1024)
                    if not data:
                        break
                    self.request.sendall(data)
        finally:
            chan.close()
            self.request.close()


class ForwardServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


server = ForwardServer((LOCAL_HOST, LOCAL_PORT), Handler)
print(f"TUNNEL_READY {LOCAL_HOST}:{LOCAL_PORT} -> {REMOTE_HOST}:{REMOTE_PORT}", flush=True)
server.serve_forever()
