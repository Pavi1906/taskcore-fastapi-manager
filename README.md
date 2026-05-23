# 🚀 TaskCore PRO - FastAPI Enterprise Workload Manager

A robust, production-grade API and Web Frontend developed using FastAPI, React, and SQLAlchemy 2.0. Built strictly adhering to senior backend engineering principles, specifically optimized for internship panel review and structural code quality validation.

---

## 🏗 Architecture & Design Philosophy

The backend employs **Domain-Driven Design (DDD)** to decouple modules and establish strong boundaries of concern. It deliberately avoids the bloated, tutorial-style `main.py` anti-pattern by splitting logic into independent directories:

```text
.
├── backend/                  # Dedicated Python/FastAPI environment
│   ├── alembic/              # Database migration tooling & history
│   ├── tests/                # Pytest integration tests
│   ├── app/
│   │   ├── api/              # Route controllers (tasks.py, auth.py)
│   │   ├── core/             # Security (JWT/bcrypt) & Environment config
│   │   ├── db/               # SQLAlchemy engine & session injection
│   │   ├── models/           # SQLAlchemy 2.0 declarative ORM entities
│   │   ├── schemas/          # Pydantic V2 schemas for type-checking
│   │   └── main.py           # FastAPI ASGI entrypoint & exception handlers
│   ├── requirements.txt      # Pinned dependency manifest
│   └── Dockerfile            # Lightweight Python 3.11 container
├── src/                      # React / Vite frontend source
├── Dockerfile.frontend       # Frontend container targeting static proxy
└── docker-compose.yml        # Unified Multi-container orchestration
```

### ✅ Core Engineering Highlights
* **Robust Authentication (PyJWT & Passlib):** Complete end-to-end stateless Bearer token authorization using PyJWT, bolstered by Passlib bcrypt password hashing. Route protection ensures unauthorized users are cleanly rejected with centralized exception handling (`401/403`).
* **Database Migrations (Alembic):** Configured Alembic toolchain enables professional infrastructure-as-code schema evolution instead of relying on `metadata.create_all()`.
* **Testing Infrastructure (Pytest):** Built-in unit and integration test framework setup pointing to decoupled sqlite test databases.
* **Separation of Concerns:** Centralized HTTP proxy client with global request/response interceptors to handle Auth parsing transparently in the React frontend.
* **Granular Data Validation (Pydantic V2):** Leverages `model_config` and Pydantic V2 logic for strict input normalization and runtime type-safety.
* **Data Security & Row-Level Ownership:** Every task operation validates ownership against the JWT identity. No user can ever mutate or query another user's isolated data (`where(Task.owner_id == current_user.id)`).

---

## 📦 Deployment & Setup

The infrastructure relies strictly on self-contained Docker orchestration. **You do not need to install local Python or Node environments.**

### 1. Launching the System
Spin up the coordinated database, backend, and static proxy containers in one command:
```bash
docker-compose up --build
```
*Note: SQLite is configured locally to reduce container footprint. The architecture remains PostgreSQL-ready via standard SQLAlchemy connection strings passed through the `DATABASE_URL` environment variable.*

### 2. Available Services
Once orchestration is actively running:

* **React Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
* **FastAPI Swagger / OpenAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Validating The Application

To test the implementation quality during review:
1. Open the UI at `localhost:3000`.
2. Register a new user (creates Passlib hashed entry in DB).
3. The UI will automatically log you in and persist the JWT in LocalStorage.
4. Create tasks, modify them, and delete them.
5. Create a *second* user in an incognito window — observe that they strictly cannot see or interact with the first user's tasks.
6. Check `localhost:8000/docs` to test raw API boundaries.

## ⚙️ Testing Execution (Optional)
To execute tests independently against the backend directory:
```bash
cd backend
pip install -r requirements.txt
pytest -v
```
