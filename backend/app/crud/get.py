from app.core import database

def get_words_1():
    return database.random_entry("words")

def get_synonyms_1():
    return database.random_entry("synonyms")

