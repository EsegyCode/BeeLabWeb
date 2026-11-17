import pathlib

MOJIBAKE_MARKERS = ("Р’", "Рљ", "РЎ", "Рџ", "Рњ", "Р¤", "вЂ", "вљ", "пёЏ", "\ufeff")


def test_templates_have_no_mojibake():
    template_dir = pathlib.Path("templates")
    for template_path in template_dir.rglob("*.html"):
        raw = template_path.read_bytes()
        assert not raw.startswith(b"\xef\xbb\xbf"), f"BOM in {template_path}"
        text = raw.decode("utf-8")
        for marker in MOJIBAKE_MARKERS:
            assert marker not in text, f"Mojibake marker {marker!r} in {template_path}"