#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""文档转 Markdown 主入口。"""

import sys
from pathlib import Path

# 确保直接执行或作为模块导入时均能正确加载同目录模块
_scripts_dir = str(Path(__file__).resolve().parent)
if _scripts_dir not in sys.path:
    sys.path.insert(0, _scripts_dir)

from anydoc import main

if __name__ == "__main__":
    main()
