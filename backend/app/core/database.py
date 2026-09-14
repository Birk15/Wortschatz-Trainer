"""JSON storage for the local, single-process server."""
import json
import os
import random
import tempfile
from pathlib import Path
from threading import RLock
from fastapi import HTTPException
from app.schemas.schemas import WordCreate, SynonymCreate

DATA_DIR = Path(__file__).resolve().parents[3] / "database"
LOCK = RLock()
MODELS = {"words": WordCreate, "synonyms": SynonymCreate}

def read_entries(kind):
    try:
        with (DATA_DIR / f"{kind}.json").open(encoding="utf-8-sig") as file:
            data = json.load(file)
        if not isinstance(data, list):
            raise ValueError("Expected a list")
        return [MODELS[kind].model_validate(entry).model_dump() for entry in data]
    except (OSError, ValueError) as error:
        raise HTTPException(500, f"Die Datei {kind}.json fehlt oder enthält ungültige Daten.") from error

def random_entry(kind, exclude=None):
    entries = read_entries(kind)
    if not entries:
        raise HTTPException(404, "Noch keine Einträge vorhanden. Bitte zuerst einen Eintrag hinzufügen.")
    candidates = [entry for entry in entries if entry["word"] != exclude]
    return random.choice(candidates or entries)

def add_entry(kind, entry):
    with LOCK:
        entries = read_entries(kind)
        if any(item["word"].casefold() == entry.word.casefold() for item in entries):
            raise HTTPException(409, "Dieses Wort ist bereits vorhanden.")
        entries.append(entry.model_dump())
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=DATA_DIR, delete=False) as file:
                temporary = Path(file.name)
                json.dump(entries, file, ensure_ascii=False, indent=2)
                file.write("\n")
            os.replace(temporary, DATA_DIR / f"{kind}.json")
        except OSError as error:
            raise HTTPException(500, "Der Eintrag konnte nicht gespeichert werden.") from error
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)
    return entry

