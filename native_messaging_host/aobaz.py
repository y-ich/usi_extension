#!/usr/bin/python3
# AobaZero on native messaging protocol
# (C) 2021 ICHIKAWA, Yuji
# License: MIT

import os
from usi import USIEngine

if __name__ == "__main__":
    working_dir = os.path.dirname(os.path.abspath(__file__))
    aobaz = USIEngine(working_dir, "bin/aobaz -q -i -p 80000 -w weight-save/w000000003459.txt")
    aobaz.start()