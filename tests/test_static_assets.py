import os
import re
from urllib.parse import urlsplit


STATIC_REF_RE = re.compile(r'(?:href|src)="([^"]*(?:/static/)[^"]*)"')


CONTENT_TYPES = {
    ".css": "text/css",
    ".js": "application/javascript",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
}


def _static_refs(html):
    urls = []
    for match in STATIC_REF_RE.findall(html):
        path = urlsplit(match).path
        if path.startswith("/static/"):
            urls.append(path)
    return sorted(set(urls))


def _expected_content_type(path):
    ext = os.path.splitext(urlsplit(path).path)[1].lower()
    return CONTENT_TYPES.get(ext)


def _check_assets(client, html):
    refs = _static_refs(html)
    assert refs, "No /static/ assets found in rendered HTML"
    for path in refs:
        response = client.get(path)
        assert response.status_code == 200, f"{path} returned {response.status_code}"
        expected = _expected_content_type(path)
        if expected is not None:
            assert response.mimetype == expected, (
                f"{path}: expected {expected}, got {response.mimetype}"
            )


def test_static_assets_login(client):
    response = client.get("/login")
    assert response.status_code == 200
    _check_assets(client, response.get_data(as_text=True))


def test_static_assets_homepage(logged_in_client):
    response = logged_in_client.get("/")
    assert response.status_code == 200
    _check_assets(logged_in_client, response.get_data(as_text=True))
