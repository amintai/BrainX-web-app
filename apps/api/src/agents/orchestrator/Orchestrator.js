import crypto from 'node:crypto';
import { logger as defaultLogger } from '../../utils/logger.js';

/**
 * Runs a sequence of BaseAgent instances, passing each validated output to
 * the next step. Stops before running any step whose agent declares
 * requiresApproval, returning an 'awaiting_approval' result instead
 * (human approval required for irreversible/high-stakes AI actions).
 */
export class Orchestrator {
  constructor({ logger = defaultLogger } = {}) {
    this.logger = logger;
  }

  async run(steps, input) {
    const workflowId = crypto.randomUUID();
    this.logger.info({ workflowId, steps: steps.length }, 'workflow started');

    const results = [];
    let current = input;

    for (const agent of steps) {
      if (agent.requiresApproval) {
        this.logger.info({ workflowId, agent: agent.name }, 'human approval requested');
        return {
          workflowId,
          status: 'awaiting_approval',
          results,
          pending: { agent: agent.name, input: current },
        };
      }

      const result = await agent.run(current, workflowId);
      results.push(result);
      current = result.output;
    }

    this.logger.info({ workflowId }, 'workflow completed');
    return { workflowId, status: 'completed', results };
  }
}
