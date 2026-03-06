from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, gardens, plants, photos, species, location, diagnoses, dashboard, agent, notifications, evals

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(gardens.router)
app.include_router(plants.router)
app.include_router(photos.router)
app.include_router(species.router)
app.include_router(location.router)
app.include_router(diagnoses.router)
app.include_router(dashboard.router)
app.include_router(agent.router)
app.include_router(notifications.router)
app.include_router(evals.router)


@app.on_event("startup")
async def startup():
    from app.tasks import start_scheduler
    start_scheduler()


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.app_name}
