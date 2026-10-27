from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ReviewReasonItem(BaseModel):
    category: str # e.g. "Shared Contact Cluster", "Intake Exceeded", "State Allotment Reconciliation"
    indicator: str
    severity: str # "HIGH", "MEDIUM", "LOW"
    description: str

class ReviewScoreResponse(BaseModel):
    institution_id: str
    institution_name: str
    state: str
    review_score: int # 0 to 100
    status: str
    advisory_disclaimer: str = "For official review. Not a finding of violation."
    reasons: List[ReviewReasonItem]
    metrics: Dict[str, Any]

class GraphNode(BaseModel):
    id: str
    label: str
    type: str # "STUDENT", "CONTACT_PHONE", "CONTACT_EMAIL", "INSTITUTION"
    cluster_id: Optional[str] = None
    properties: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str # "USES_PHONE", "USES_EMAIL", "ENROLLED_IN"
    weight: int = 1

class FraudGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_clusters: int
    primary_cluster_size: int
    evidence_summary: List[Dict[str, Any]]
