#!/usr/bin/python3

import sys
import os
import json
import struct
from threading import Thread
from subprocess import Popen, PIPE

def get_message():
    rawLength = sys.stdin.buffer.read(4)
    if len(rawLength) == 0:
        sys.exit(0)
    messageLength = struct.unpack('@I', rawLength)[0]
    message = sys.stdin.buffer.read(messageLength).decode('utf-8')
    return json.loads(message)

# Send an encoded message to stdout
def send_message(message):
    def encodeMessage(messageContent):
        encodedContent = json.dumps(messageContent).encode('utf-8')
        encodedLength = struct.pack('@I', len(encodedContent))
        return {'length': encodedLength, 'content': encodedContent}

    encodedMessage = encodeMessage(message)
    sys.stdout.buffer.write(encodedMessage['length'])
    sys.stdout.buffer.write(encodedMessage['content'])
    sys.stdout.buffer.flush()

class AobaZero:
    def __init__(self):
        self.process = None
        self.thread = None

    def start(self):
        def process_stdout():
            while True:
                if self.process.poll() is not None:
                    break
                line = self.process.stdout.readline().strip()
                send_message('"' + line + '"')

        working_dir = os.path.dirname(os.path.abspath(__file__))
        self.process = Popen(["bin/aobaz", "-q", "-i", "-p", "80000", "-w", "weight-save/w000000003459.txt"], cwd=working_dir, stdin=PIPE, stdout=PIPE, encoding="utf-8")
        self.thread = Thread(target=process_stdout)
        self.thread.start()       
        while True:
            data = get_message()
            self.process.stdin.write(data + "\n")
            self.process.stdin.flush()

if __name__ == "__main__":
    aobaz = AobaZero()
    aobaz.start()