import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface WorkflowRequest {
  user_input: string;
  session: Record<string, any>;
}

export interface WorkflowResponse {
  message?: string;
  context?: Record<string, any>;
  form_required?: boolean;
  form?: any;
  step_id?: string;
}

export const workflowService = {
  async listWorkflows(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/api/v1/workflows`);
    return response.data;
  },

  async executeWorkflow(workflowId: string, request: WorkflowRequest): Promise<WorkflowResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/workflow/${workflowId}`,
      request
    );
    return response.data;
  },

  async resumeWorkflowForm(workflowId: string, payload: {
    workflow_id: string;
    step_id: string;
    form_data: Record<string, any>;
    session: Record<string, any>;
  }): Promise<WorkflowResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/workflow/${workflowId}/resume`,
      payload
    );
    return response.data;
  }
}; 