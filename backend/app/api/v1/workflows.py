from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import Dict, Any, List
import os
from pathlib import Path

from ...core.workflow_engine import WorkflowEngine
from .deps import get_current_user

router = APIRouter()

WORKFLOW_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../'))

class WorkflowRequest(BaseModel):
    user_input: str
    session: Dict[str, Any]

class WorkflowResponse(BaseModel):
    message: str = None
    context: Dict[str, Any] = None
    form_required: bool = False
    form: Dict[str, Any] = None
    step_id: str = None

class ResumeFormRequest(BaseModel):
    workflow_id: str
    step_id: str
    form_data: Dict[str, Any]
    session: Dict[str, Any]

@router.get("/workflows", response_model=Dict[str, str])
def list_workflows():
    workflows = {}
    for fname in os.listdir(WORKFLOW_DIR):
        if fname.startswith("ukg_") and fname.endswith(".yaml"):
            workflows[fname[:-5]] = fname
    return workflows

@router.post("/workflow/{workflow_id}", response_model=WorkflowResponse)
def execute_workflow(workflow_id: str, req: WorkflowRequest):
    workflow_path = os.path.join(WORKFLOW_DIR, f"{workflow_id}.yaml")
    if not os.path.exists(workflow_path):
        raise HTTPException(status_code=404, detail="Workflow not found")
    engine = WorkflowEngine(workflow_path)
    result = engine.start(req.user_input, req.session)
    if isinstance(result, dict) and result.get('form_required'):
        return WorkflowResponse(form_required=True, form=result['form'], step_id=result['step_id'], context=result['context'])
    elif isinstance(result, dict) and result.get('message'):
        return WorkflowResponse(message=result['message'], context=result.get('context'))
    else:
        raise HTTPException(status_code=500, detail="Workflow execution failed")

@router.post("/workflow/{workflow_id}/resume", response_model=WorkflowResponse)
def resume_workflow_form(workflow_id: str, req: ResumeFormRequest):
    workflow_path = os.path.join(WORKFLOW_DIR, f"{workflow_id}.yaml")
    if not os.path.exists(workflow_path):
        raise HTTPException(status_code=404, detail="Workflow not found")
    engine = WorkflowEngine(workflow_path)
    # For demo, re-initialize context with session (in production, persist context!)
    engine.context = {'session': req.session, 'form_data': req.form_data}
    result = engine.resume_from_form(req.step_id, req.form_data)
    if isinstance(result, dict) and result.get('form_required'):
        return WorkflowResponse(form_required=True, form=result['form'], step_id=result['step_id'], context=result['context'])
    elif isinstance(result, dict) and result.get('message'):
        return WorkflowResponse(message=result['message'], context=result.get('context'))
    else:
        raise HTTPException(status_code=500, detail="Workflow resume failed") 