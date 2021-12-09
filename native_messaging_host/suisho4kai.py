#!/usr/bin/python3
# 水匠4改 on native messaging protocol
# (C) 2021 ICHIKAWA, Yuji
# License: MIT

import os
from usi import USIEngine

if __name__ == "__main__":
    working_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "suisho4kai")
    usi = USIEngine(working_dir, "./YaneuraOu-by-gcc")
    usi.start()