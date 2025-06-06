import yaml
from pathlib import Path
from typing import Any, Dict, Optional

class WorkflowEngine:
    def __init__(self, workflow_path: str):
        self.workflow = self._load_workflow(workflow_path)
        self.steps = {step['id']: step for step in self.workflow['steps']}
        self.context = {}
        self.current_step = None
        self.paused_step = None

    def _load_workflow(self, path: str) -> Dict[str, Any]:
        with open(path, 'r') as f:
            return yaml.safe_load(f)

    def start(self, user_input: str, session: Dict[str, Any]):
        self.context = {'user_input': user_input, 'session': session}
        first_step = self.workflow['steps'][0]['id']
        return self._run_step(first_step)

    def _run_step(self, step_id: str):
        step = self.steps[step_id]
        step_type = step['type']
        if step_type == 'llm_extract':
            # Simulate LLM extraction (replace with real LLM call)
            # For demo, just echo user_input as all params
            self.context['ctx'] = {'start_date': '2025-06-03', 'end_date': '2025-06-05', 'reason': 'personal', 'time_off_type': 'personal', 'clock_action': 'in', 'timestamp': '2025-06-03T09:00:00', 'location': 'HQ'}
            next_step = step['next']
            return self._run_step(next_step)
        elif step_type == 'connector_call':
            from connectors import registry
            connector = registry[step['connector']]
            action = getattr(connector, step['action'])
            params = {k: self._render(v) for k, v in step['params'].items()}
            result = action(**params)
            if 'save_as' in step:
                self.context[step['save_as']] = result
            # Handle conditional next
            if isinstance(step.get('next'), dict) and 'condition' in step['next']:
                cond = step['next']['condition']
                # For demo, always take 'then' branch
                next_step = cond['then']
            else:
                next_step = step.get('next')
            return self._run_step(next_step)
        elif step_type == 'form':
            # Pause and return form schema
            self.paused_step = step_id
            return {
                'form_required': True,
                'form': step['form'],
                'step_id': step_id,
                'context': self.context
            }
        elif step_type == 'respond':
            message = self._render(step['message'])
            return {'message': message, 'context': self.context}
        else:
            raise ValueError(f"Unknown step type: {step_type}")

    def resume_from_form(self, step_id: str, form_data: Dict[str, Any]):
        # Save form data to context and continue
        self.context['form_data'] = form_data
        step = self.steps[step_id]
        next_step = step.get('next')
        return self._run_step(next_step)

    def _render(self, template: str) -> str:
        # Very basic template rendering for demo
        out = template
        for k, v in self.context.items():
            if isinstance(v, dict):
                for kk, vv in v.items():
                    out = out.replace(f"{{{{ctx.{kk}}}}}", str(vv))
            out = out.replace(f"{{{{{k}}}}}", str(v))
        return out 