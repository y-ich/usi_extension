#!/usr/bin/python3
# AobaZero on native messaging protocol
# (C) 2021 ICHIKAWA, Yuji
# License: MIT

import os
from usi import USIEngine

if __name__ == "__main__":
    working_dir = os.path.dirname(os.path.abspath(__file__))
    usi = USIEngine(working_dir, "/Users/yuji/Projects/DeepLearningShogi/usi/bin/usi")
    usi.start()