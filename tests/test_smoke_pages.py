def test_smoke_pages(client, logged_in_client):
    public_paths = ["/login", "/register", "/about", "/faq", "/privacy", "/terms"]
    for path in public_paths:
        assert client.get(path).status_code == 200
    app_paths = ["/", "/calendar", "/finance", "/analytics", "/profile", "/add_hive", "/instructions"]
    for path in app_paths:
        assert logged_in_client.get(path).status_code == 200
    assert client.get("/logout").status_code in (200, 302)