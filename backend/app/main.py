from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SessionLocal, Base
from . import models  # noqa: F401 — imports models so Base picks up their tables
from .routers import groups, matches, teams, standings, scorers
from .routers import goals as goals_router
from .routers import admin as admin_router
from .services.seed_data import seed_database

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FIFA 2026 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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


@app.get("/")
def root():
    return {"message": "FIFA 2026 World Cup API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
