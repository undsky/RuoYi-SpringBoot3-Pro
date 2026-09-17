#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""测试 anydoc.py 的纯函数：配置解析、鉴权头、输入展开与产物命名。"""

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import anydoc


class TestAuthKey(unittest.TestCase):
    """用户标识的规整与请求头构造。后端契约是 X-Uuid，不是 Bearer。"""

    def test_normalize_key_trims(self):
        self.assertEqual(anydoc.normalize_key("  1a2b3c  "), "1a2b3c")

    def test_normalize_key_strips_bearer(self):
        # n8n 凭据导出的值自带 Bearer 前缀，原样透传会当成 uuid 的一部分
        self.assertEqual(anydoc.normalize_key("Bearer 1a2b3c"), "1a2b3c")
        self.assertEqual(anydoc.normalize_key("bearer  1a2b3c "), "1a2b3c")

    def test_normalize_key_empty(self):
        self.assertEqual(anydoc.normalize_key(None), "")
        self.assertEqual(anydoc.normalize_key(""), "")
        self.assertEqual(anydoc.normalize_key("   "), "")

    def test_build_auth_headers(self):
        headers = anydoc.build_auth_headers("1a2b3c")
        self.assertEqual(headers["X-Uuid"], "1a2b3c")
        self.assertEqual(headers["X-Key"], "1a2b3c")
        # 不能再发 Authorization：那套契约已停用
        self.assertNotIn("Authorization", headers)

    def test_build_auth_headers_empty_key(self):
        self.assertEqual(anydoc.build_auth_headers(""), {})
        self.assertEqual(anydoc.build_auth_headers(None), {})

    def test_env_key_names(self):
        self.assertEqual(anydoc.ENV_KEY_KEY, "DOUDOU_API_KEY")
        self.assertEqual(anydoc.ENV_URL_KEY, "DOUDOU_API_URL")

    def test_endpoint(self):
        self.assertEqual(anydoc.ENDPOINT, "/webhook/document-markdown")


class TestIsUrl(unittest.TestCase):

    def test_url_detection(self):
        self.assertTrue(anydoc.is_url("http://a.com/x.pdf"))
        self.assertTrue(anydoc.is_url("HTTPS://A.com/x.pdf"))
        self.assertFalse(anydoc.is_url("/data/a.pdf"))
        self.assertFalse(anydoc.is_url("ftp://a.com/x.pdf"))
        self.assertFalse(anydoc.is_url("C:\\docs\\a.docx"))


class TestOutName(unittest.TestCase):

    def test_local_file(self):
        self.assertEqual(anydoc.out_name("report.docx"), "report.md")
        self.assertEqual(anydoc.out_name("/a/b/季度报表.xlsx"), "季度报表.md")

    def test_url(self):
        self.assertEqual(anydoc.out_name("https://x.com/a/paper.pdf"), "paper.md")
        # query 串不该进文件名
        self.assertEqual(anydoc.out_name("https://x.com/paper.pdf?v=2"), "paper.md")

    def test_unsafe_chars_dropped(self):
        self.assertEqual(anydoc.out_name("a b*c?.pdf"), "abc.md")

    def test_no_basename_falls_back(self):
        self.assertEqual(anydoc.out_name("https://x.com/"), "document.md")


class TestFormatWhitelist(unittest.TestCase):
    """format 与后端「校验参数」节点的白名单必须一致，否则本地放过去还是会被拒。"""

    def test_backend_formats(self):
        self.assertEqual(
            anydoc.FORMATS,
            ["doc", "docx", "odt", "pdf", "ppt", "pptx", "rtf", "epub",
             "xlsx", "ods", "odp", "csv"])

    def test_aliases_include_xls(self):
        for a in ("xls", "docm", "ppsx"):
            self.assertIn(a, anydoc.ALIASES)

    def test_precheck_rejects_unknown(self):
        with self.assertRaises(SystemExit):
            anydoc.precheck_format("a.docx", "xyz")

    def test_precheck_accepts_whitelisted(self):
        anydoc.precheck_format("a.docx", "docx")
        anydoc.precheck_format("a.xls", "xls")
        anydoc.precheck_format("a.docx", "")

    def test_csv_has_no_signature(self):
        # CSV 靠扩展名识别，这条决定了 URL 形态要不要提醒补 --format
        self.assertIn("csv", anydoc.NO_SIGNATURE)

    def test_ocr_stages(self):
        # 这两个 stage 该转去 OCR，不是重试能解决的
        self.assertEqual(anydoc.OCR_STAGES, {"unsupported", "garbled"})

    def test_upload_limit_matches_ingress(self):
        # 入口是 N8N_PAYLOAD_SIZE_MAX=50 + nginx client_max_body_size 50m。
        # 写大了预检就形同虚设：超限请求不回 413，只会挂着不响应。
        self.assertEqual(anydoc.MAX_UPLOAD_BYTES, 50 * 1024 * 1024)


class TestScanAndExpand(unittest.TestCase):

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.d = Path(self.tmp.name)
        for n in ("a.docx", "b.pdf", "c.csv", "note.txt", "img.png"):
            (self.d / n).write_text("x", encoding="utf-8")
        sub = self.d / "sub"
        sub.mkdir()
        (sub / "d.xlsx").write_text("x", encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def test_scan_skips_non_documents(self):
        names = [p.name for p in anydoc.scan_dir(self.d)]
        self.assertEqual(names, ["a.docx", "b.pdf", "c.csv"])

    def test_scan_recursive(self):
        names = sorted(p.name for p in anydoc.scan_dir(self.d, recursive=True))
        self.assertEqual(names, ["a.docx", "b.pdf", "c.csv", "d.xlsx"])

    def test_expand_keeps_urls(self):
        got = anydoc.expand_sources(["https://x.com/a.pdf"])
        self.assertEqual(got, ["https://x.com/a.pdf"])

    def test_expand_directory(self):
        got = anydoc.expand_sources([str(self.d)])
        self.assertEqual([Path(g).name for g in got], ["a.docx", "b.pdf", "c.csv"])

    def test_expand_mixed(self):
        got = anydoc.expand_sources(["https://x.com/a.pdf", str(self.d / "a.docx")])
        self.assertEqual(len(got), 2)


class TestEnvParsing(unittest.TestCase):

    def test_parse_env_file(self):
        with tempfile.TemporaryDirectory() as td:
            f = Path(td) / ".env"
            f.write_text(
                "# 注释\n"
                "DOUDOU_API_URL=http://localhost:5678\n"
                'export DOUDOU_API_KEY="abc-123"  # 行内注释\n'
                "EMPTY=\n",
                encoding="utf-8")
            got = anydoc._parse_env_file(f)
            self.assertEqual(got["DOUDOU_API_URL"], "http://localhost:5678")
            self.assertEqual(got["DOUDOU_API_KEY"], "abc-123")
            self.assertNotIn("EMPTY", got)

    def test_find_env_file_priority(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            workspace = root / "workspace"
            agents = workspace / ".agents"
            skills = agents / "skills"
            skill = skills / "doudou-doc-skill"
            skill.mkdir(parents=True)

            orig_skill_dir = anydoc.SKILL_DIR
            try:
                anydoc.SKILL_DIR = skill

                # 1. 均不存在时，返回技能目录下的 .env
                self.assertEqual(anydoc.find_env_file(), skill / ".env")

                # 2. 只有向上第 3 级（workspace）存在时，返回 workspace 的 .env
                workspace_env = workspace / ".env"
                workspace_env.write_text("DOUDOU_API_KEY=from_workspace\n", encoding="utf-8")
                self.assertEqual(anydoc.find_env_file(), workspace_env)

                # 3. 向上第 2 级（.agents）存在时，优先于第 3 级
                agents_env = agents / ".env"
                agents_env.write_text("DOUDOU_API_KEY=from_agents\n", encoding="utf-8")
                self.assertEqual(anydoc.find_env_file(), agents_env)

                # 4. 向上第 1 级（skills）存在时，优先于第 2 级
                skills_env = skills / ".env"
                skills_env.write_text("DOUDOU_API_KEY=from_skills\n", encoding="utf-8")
                self.assertEqual(anydoc.find_env_file(), skills_env)

                # 5. 技能目录本身存在时，最高优先级
                skill_env = skill / ".env"
                skill_env.write_text("DOUDOU_API_KEY=from_skill\n", encoding="utf-8")
                self.assertEqual(anydoc.find_env_file(), skill_env)
            finally:
                anydoc.SKILL_DIR = orig_skill_dir


class TestConvertOneValidation(unittest.TestCase):
    """测试 convert_one 的本地输入校验，确保不合法的文件不会直接 die 退出进程导致批处理中断。"""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.d = Path(self.tmp.name)
        self.args = anydoc.build_parser().parse_args(["dummy.docx"])

    def tearDown(self):
        self.tmp.cleanup()

    def test_file_not_found(self):
        missing = str(self.d / "non_existent.docx")
        res = anydoc.convert_one(missing, self.args, "http://localhost:5678", "key", "", "")
        self.assertFalse(res["ok"])
        self.assertEqual(res["stage"], "validate")
        self.assertIn("找不到本地文件", res["error"])

    def test_empty_file(self):
        empty = self.d / "empty.docx"
        empty.write_bytes(b"")
        res = anydoc.convert_one(str(empty), self.args, "http://localhost:5678", "key", "", "")
        self.assertFalse(res["ok"])
        self.assertEqual(res["stage"], "validate")
        self.assertIn("空的", res["error"])

    def test_oversize_file(self):
        orig_max = anydoc.MAX_UPLOAD_BYTES
        try:
            anydoc.MAX_UPLOAD_BYTES = 10
            big = self.d / "big.docx"
            big.write_bytes(b"0123456789extra")
            res = anydoc.convert_one(str(big), self.args, "http://localhost:5678", "key", "", "")
            self.assertFalse(res["ok"])
            self.assertEqual(res["stage"], "validate")
            self.assertIn("超过", res["error"])
        finally:
            anydoc.MAX_UPLOAD_BYTES = orig_max


if __name__ == "__main__":
    unittest.main()


