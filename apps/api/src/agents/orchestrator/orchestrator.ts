import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

export interface WorkflowStep<T = unknown> {
  name: string;
  run: (workflowId: string) => Promise<T>;
}

export class Orchestrator {
  private steps: WorkflowStep[] = [];

  addStep<T>(step: WorkflowStep<T>): this {
    this.steps.push(step as WorkflowStep);
    return this;
  }

  async execute(): Promise<unknown[]> {
    const workflowId = uuidv4();
    logger.info({ workflowId, steps: this.steps.length, status: 'started' }, 'Workflow started');

    const results: unknown[] = [];

    for (const step of this.steps) {
      logger.info({ workflowId, step: step.name, status: 'started' }, 'Workflow step started');
      const result = await step.run(workflowId);
      results.push(result);
      logger.info({ workflowId, step: step.name, status: 'completed' }, 'Workflow step completed');
    }

    logger.info({ workflowId, status: 'completed' }, 'Workflow completed');
    return results;
  }
}
