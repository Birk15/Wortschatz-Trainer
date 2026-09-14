from pydantic import BaseModel, ConfigDict, Field, field_validator

class WordBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    word: str = Field(min_length=1, max_length=100)

class WordCreate(WordBase):
    definition: str = Field(min_length=1, max_length=2000)

class SynonymCreate(WordBase):
    synonyms: list[str] = Field(min_length=1, max_length=20)

    @field_validator("synonyms")
    @classmethod
    def validate_synonyms(cls, values, info):
        result = []
        seen = {info.data.get("word", "").casefold()}
        for value in values:
            value = value.strip()
            if not value or len(value) > 100:
                raise ValueError("Synonyme müssen zwischen 1 und 100 Zeichen lang sein.")
            if value.casefold() in seen:
                raise ValueError("Synonyme müssen unterschiedlich sein und dürfen nicht dem Wort entsprechen.")
            seen.add(value.casefold())
            result.append(value)
        return result

