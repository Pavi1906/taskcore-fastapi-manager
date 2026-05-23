from tests.conftest import client

def test_register_success():
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "securepassword"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_login_success():
    # Setup - Register a user
    client.post(
        "/api/v1/auth/register",
        json={"email": "testlogin@example.com", "password": "securepassword"}
    )
    # Login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testlogin@example.com", "password": "securepassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_failure():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "invalid@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
