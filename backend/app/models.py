from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field


class CitizenProfile(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None  # male | female | other
    state: Optional[str] = None
    district: Optional[str] = None
    residence: Optional[str] = None  # rural | urban
    occupation: Optional[str] = None  # farmer | student | worker | self_employed | unemployed | other
    annual_family_income: Optional[float] = None
    caste_category: Optional[str] = None  # general | obc | sc | st | other
    land_holding_hectares: Optional[float] = None
    education_level: Optional[str] = None  # class_10 | class_12 | graduate | postgraduate | other
    is_disabled: Optional[bool] = None
    is_bpl: Optional[bool] = None
    language: Optional[str] = "en"  # en | hi | mr


class Criterion(BaseModel):
    id: str
    label: Dict[str, str]  # {"en": "...", "hi": "...", "mr": "..."}
    field: str
    op: str  # eq, ne, lt, lte, gt, gte, in, not_in, between, is_true, is_false
    value: Any
    source_ref: Optional[str] = None


class Scheme(BaseModel):
    id: str
    name: Dict[str, str]
    level: str = "central"  # central | state
    state: Optional[str] = None
    category: List[str] = []
    summary: Dict[str, str] = {}
    benefits: Dict[str, str] = {}
    criteria: List[Criterion] = []
    exclusions: List[Criterion] = []
    required_documents: List[Dict[str, str]] = []
    how_to_apply: Dict[str, str] = {}
    official_url: str
    source_documents: List[Dict[str, Any]] = []
    verified: bool = False


class CriterionResult(BaseModel):
    criterion_id: str
    label: str
    status: str  # met | not_met | missing
    user_value: Optional[Any] = None
    required: str


class EligibilityResult(BaseModel):
    scheme_id: str
    overall: str  # eligible | likely_eligible | not_eligible | need_more_info
    criteria_results: List[CriterionResult] = []
    missing_fields: List[str] = []
    required_documents: List[str] = []
    citations: List[Dict[str, Any]] = []


class EligibilityRequest(BaseModel):
    scheme_id: str
    profile: CitizenProfile


class ChatRequest(BaseModel):
    session_id: str = "default"
    message: str
    language: str = "en"


class ChatSchemeItem(BaseModel):
    id: str
    name: str
    why_relevant: str


class Citation(BaseModel):
    title: str
    page: Optional[int] = 0
    section: Optional[str] = ""
    url: str


class ChatResponse(BaseModel):
    answer: str
    language: str = "en"
    profile: Dict[str, Any] = Field(default_factory=dict)
    clarifying_question: Optional[str] = None
    schemes: List[ChatSchemeItem] = Field(default_factory=list)
    eligibility: List[EligibilityResult] = Field(default_factory=list)
    citations: List[Citation] = Field(default_factory=list)
    disclaimer: str = ""
