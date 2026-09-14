from fastapi import FastAPI
from app.api.get import router
from app.api.post import router as post_router

app = FastAPI(title="Wortschatz-Trainer API")
app.include_router(router)
app.include_router(post_router)

@app.get("/")
def root():
    return {"message": "Backend läuft!"}

