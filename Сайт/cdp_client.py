import socket
import ssl
import hashlib
import base64
import os
import json
import struct
import urllib.request
import subprocess
import time

class SimpleWebSocket:
    def __init__(self, ws_url):
        # ws://127.0.0.1:port/path
        parts = ws_url.replace("ws://", "").split("/", 1)
        host_port = parts[0].split(":")
        self.host = host_port[0]
        self.port = int(host_port[1])
        self.path = "/" + parts[1]
        
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((self.host, self.port))
        
        # Handshake
        key = base64.b64encode(os.urandom(16)).decode()
        req = (
            f"GET {self.path} HTTP/1.1\r\n"
            f"Host: {self.host}:{self.port}\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode())
        resp = self.sock.recv(4096).decode()
        if " 101 " not in resp:
            raise RuntimeError("WebSocket handshake failed: " + resp)
        self.msg_id = 1
        self.buffer = bytearray()

    def send(self, method, params=None):
        mid = self.msg_id
        self.msg_id += 1
        msg = json.dumps({"id": mid, "method": method, "params": params or {}})
        payload = msg.encode("utf-8")
        
        # Frame format: FIN=1, opcode=1 (text), masked=1
        header = bytearray([0x81])
        length = len(payload)
        mask_key = os.urandom(4)
        
        if length <= 125:
            header.append(0x80 | length)
        elif length <= 65535:
            header.append(0x80 | 126)
            header.extend(struct.pack("!H", length))
        else:
            header.append(0x80 | 127)
            header.extend(struct.pack("!Q", length))
            
        header.extend(mask_key)
        masked_payload = bytearray([b ^ mask_key[i % 4] for i, b in enumerate(payload)])
        self.sock.sendall(header + masked_payload)
        return mid

    def _read_bytes(self, n):
        while len(self.buffer) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                return None
            self.buffer.extend(chunk)
        data = self.buffer[:n]
        self.buffer = self.buffer[n:]
        return data

    def recv(self, target_id=None):
        while True:
            head = self._read_bytes(2)
            if not head:
                return None
            b1, b2 = head[0], head[1]
            length = b2 & 0x7F
            if length == 126:
                length_bytes = self._read_bytes(2)
                length = struct.unpack("!H", length_bytes)[0]
            elif length == 127:
                length_bytes = self._read_bytes(8)
                length = struct.unpack("!Q", length_bytes)[0]
                
            payload = self._read_bytes(length)
            if payload is None:
                return None

            try:
                obj = json.loads(payload.decode("utf-8", errors="ignore"))
                if target_id is None or obj.get("id") == target_id:
                    return obj
            except:
                pass

    def call(self, method, params=None):
        mid = self.send(method, params)
        return self.recv(mid)

    def close(self):
        self.sock.close()
