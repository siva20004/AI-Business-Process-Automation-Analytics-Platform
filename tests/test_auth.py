def test_login_success_admin(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@fujikyuko.co.jp", "password": "FujiFlow2026!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@fujikyuko.co.jp"
    assert data["user"]["role"] == "admin"

def test_login_success_analyst(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "analyst@fujikyuko.co.jp", "password": "FujiFlow2026!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "analyst"

def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@fujikyuko.co.jp", "password": "WrongPassword123!"}
    )
    assert response.status_code == 401
    assert "detail" in response.json()

def test_get_current_user_me(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@fujikyuko.co.jp"

def test_me_unauthorized_without_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
