from tests.conftest import client

def get_auth_token():
    client.post(
        "/api/v1/auth/register",
        json={"email": "taskuser@example.com", "password": "securepassword"}
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "taskuser@example.com", "password": "securepassword"}
    )
    return response.json()["access_token"]

def test_create_task():
    token = get_auth_token()
    response = client.post(
        "/api/v1/tasks/",
        json={"title": "Test Task", "description": "Doing work"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Task"
    assert data["is_completed"] is False

def test_delete_task():
    token = get_auth_token()
    # Create
    create_resp = client.post(
        "/api/v1/tasks/",
        json={"title": "Test Task To Delete"},
        headers={"Authorization": f"Bearer {token}"}
    )
    task_id = create_resp.json()["id"]

    # Delete
    delete_resp = client.delete(
        f"/api/v1/tasks/{task_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert delete_resp.status_code == 204

def test_unauthorized_access():
    response = client.get("/api/v1/tasks/")
    assert response.status_code == 401
