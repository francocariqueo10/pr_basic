import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .database import engine, SessionLocal, Base
from . import models  # noqa: F401
from .routers import groups, matches, teams, standings, scorers
from .routers import goals as goals_router
from .routers import admin as admin_router
from .services.seed_data import seed_database

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FIFA Torneo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(groups.router)
app.include_router(matches.router)
app.include_router(teams.router)
app.include_router(standings.router)
app.include_router(scorers.router)
app.include_router(goals_router.router)
app.include_router(admin_router.router)


@app.on_event("startup")
def startup():
    # Add new columns to existing tables if missing (simple migration)
    with engine.connect() as conn:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        team_cols = [c["name"] for c in inspector.get_columns("teams")]
        for col in ["fifa_team", "nickname", "email", "avatar_url"]:
            if col not in team_cols:
                conn.execute(text(f"ALTER TABLE teams ADD COLUMN {col} VARCHAR"))
        match_cols = [c["name"] for c in inspector.get_columns("matches")]
        if "leg" not in match_cols:
            conn.execute(text("ALTER TABLE matches ADD COLUMN leg INTEGER DEFAULT 1"))
        # Ensure groups table has mode column before updating it
        group_cols = [c["name"] for c in inspector.get_columns("groups")]
        if "mode" not in group_cols:
            conn.execute(text("ALTER TABLE groups ADD COLUMN mode VARCHAR DEFAULT 'knockout'"))
        # Ensure all groups are in knockout mode
        conn.execute(text("UPDATE groups SET mode = 'knockout' WHERE mode != 'knockout' OR mode IS NULL"))
        conn.commit()

    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve React frontend — must be last (catch-all)
_static_dir = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(_static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(_static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        return FileResponse(os.path.join(_static_dir, "index.html"))
