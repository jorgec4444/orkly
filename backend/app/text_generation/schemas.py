from pydantic import BaseModel, Field, field_validator
from typing import Optional, List

class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="Text to improve")
    style: Optional[str] = Field("professional", description="Improvement style")
    client_id: int | None = Field(None, description="Optional client ID for brand voice context")
    temperature: float = Field(0.8, ge=0.0, le=1.0, description="Creativity level (0.0-1.0)")

    @field_validator("text")
    @classmethod
    def text_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Text cannot be blank")
        return v.strip()
    
class TextVariation(BaseModel):
    version: str
    text: str
    description: str
    
class TextResponse(BaseModel):
    original: str
    variations: List[TextVariation]

class SaveGenerationRequest(BaseModel):
    original_text: str = Field(..., description="The original text that was improved")
    selected_text: str = Field(..., description="The improved text that the user selected")
    style: str = Field(..., description="The style of improvement applied to the selected text")
    client_id: Optional[int] = Field(None, description="Optional client ID associated with the generation")