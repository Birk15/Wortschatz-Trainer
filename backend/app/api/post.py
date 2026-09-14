from fastapi import APIRouter
from app.core.database import add_entry
from app.schemas.schemas import WordCreate, SynonymCreate

router = APIRouter()

@router.post("/post_data_w", response_model=WordCreate, status_code=201)
def post_data_w(entry: WordCreate):
    return add_entry("words", entry)

@router.post("/post_data_s", response_model=SynonymCreate, status_code=201)
def post_data_s(entry: SynonymCreate):
    return add_entry("synonyms", entry)

