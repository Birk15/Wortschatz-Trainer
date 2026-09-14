"""Run: python -m unittest discover -s backend -p 'test_*.py'."""
import asyncio
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from main import app
from app.core import database


def request(method, path, body=None, query=""):
    messages = []
    payload = json.dumps(body).encode() if body is not None else b""

    async def receive():
        return {"type": "http.request", "body": payload, "more_body": False}

    async def send(message):
        messages.append(message)

    scope = {"type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1",
             "method": method, "scheme": "http", "path": path, "raw_path": path.encode(),
             "query_string": query.encode(), "root_path": "", "headers": [(b"content-type", b"application/json")],
             "client": ("127.0.0.1", 1234), "server": ("test", 80)}
    asyncio.run(app(scope, receive, send))
    return messages[0]["status"], json.loads(b"".join(m.get("body", b"") for m in messages))


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.data_dir = Path(self.directory.name)
        for kind in ("words", "synonyms"):
            (self.data_dir / f"{kind}.json").write_text("[]", encoding="utf-8")
        self.storage = patch.object(database, "DATA_DIR", self.data_dir)
        self.storage.start()
        self.addCleanup(self.storage.stop)

    def test_save_and_read_both_types(self):
        for kind, endpoint, entry in [
            ("words", "/post_data_w", {"word": "präzise", "definition": "Genau und eindeutig"}),
            ("synonyms", "/post_data_s", {"word": "schnell", "synonyms": ["rasch", "flink"]}),
        ]:
            self.assertEqual(request("POST", endpoint, entry), (201, entry))
            self.assertEqual(request("GET", f"/get_{kind}"), (200, entry))
            self.assertEqual(json.loads((self.data_dir / f"{kind}.json").read_text(encoding="utf-8")), [entry])
            self.assertEqual(request("POST", endpoint, {**entry, "word": entry["word"].upper()})[0], 409)

    def test_validation(self):
        for body in [{"word": " ", "definition": "Test"}, {"word": "Test", "definition": " "}]:
            self.assertEqual(request("POST", "/post_data_w", body)[0], 422)
        for values in [[], [" "], ["rasch", " RASCH "], ["schnell"]]:
            self.assertEqual(request("POST", "/post_data_s", {"word": "schnell", "synonyms": values})[0], 422)
        self.assertEqual((self.data_dir / "synonyms.json").read_text(), "[]")

    def test_empty_corrupt_and_missing_data(self):
        self.assertEqual(request("GET", "/get_words")[0], 404)
        (self.data_dir / "words.json").write_text("invalid", encoding="utf-8")
        self.assertEqual(request("GET", "/get_words")[0], 500)
        self.assertEqual(request("POST", "/post_data_w", {"word": "Test", "definition": "Test"})[0], 500)
        self.assertEqual((self.data_dir / "words.json").read_text(), "invalid")
        (self.data_dir / "words.json").unlink()
        self.assertEqual(request("GET", "/get_words")[0], 500)

    def test_no_immediate_repeat_and_single_entry(self):
        request("POST", "/post_data_w", {"word": "eins", "definition": "Erstes Wort"})
        self.assertEqual(request("GET", "/get_words", query="exclude=eins")[1]["word"], "eins")
        request("POST", "/post_data_w", {"word": "zwei", "definition": "Zweites Wort"})
        self.assertEqual(request("GET", "/get_words", query="exclude=eins")[1]["word"], "zwei")


if __name__ == "__main__":
    unittest.main()
