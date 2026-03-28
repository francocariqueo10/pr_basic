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
