from fastapi import APIRouter
from app.core.database import random_entry
from app.schemas.schemas import WordCreate, SynonymCreate

router = APIRouter()

@router.get("/get_words", response_model=WordCreate)
def get_words(exclude: str | None = None):
    return random_entry("words", exclude)

@router.get("/get_synonyms", response_model=SynonymCreate)
def get_synonyms(exclude: str | None = None):
    return random_entry("synonyms", exclude)

