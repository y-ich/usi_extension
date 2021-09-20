#!/usr/bin/python3
# Native messaging protocol wrapper for USI
# reference: https://github.com/mdn/webextensions-examples/tree/master/native-messaging
# (C) 2021 ICHIKAWA, Yuji
# License: MIT

import sys
import json
import struct
from threading import Thread
from subprocess import Popen, PIPE

def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        raise Exception("no length field")
    message_length = struct.unpack("@I", raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode("utf-8")
    return json.loads(message)

# Send an encoded message to stdout
def send_message(message):
    def encode_message(message_content):
        encoded_content = json.dumps(message_content).encode("utf-8")
        encoded_length = struct.pack("@I", len(encoded_content))
        return { "length": encoded_length, "content": encoded_content}

    encoded_message = encode_message(message)
    sys.stdout.buffer.write(encoded_message['length'])
    sys.stdout.buffer.write(encoded_message['content'])
    sys.stdout.buffer.flush()

class USIEngine:
    def __init__(self, working_dir, command):
        self.working_dir = working_dir
        self.command = command
        self.process = None
        self.thread = None

    def start(self):
        def process_stdout():
            while True:
                if self.process.poll() is not None:
                    break
                line = self.process.stdout.readline().strip()
                send_message(f'"{line}"')

        self.process = Popen(self.command.split(" "), cwd=self.working_dir, stdin=PIPE, stdout=PIPE, encoding="utf-8")
        self.thread = Thread(target=process_stdout)
        self.thread.start()       
        while True:
            data = get_message()
            self.process.stdin.write(data + "\n")
            self.process.stdin.flush()
