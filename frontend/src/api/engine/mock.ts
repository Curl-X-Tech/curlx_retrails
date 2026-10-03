import { mockDelay } from "@/api/_mock-delay";
import {
  MOCK_OPTIMIZE_RESULT,
  MOCK_SCHEDULE_CRON_RESPONSE,
  MOCK_SOLVER_STATUS,
} from "./mock-data";
import type {
  OptimizeRequest,
  OptimizeResult,
  ScheduleCronRequest,
  ScheduleCronResponse,
  SolverStatus,
} from "./types";

let solverStatusState: SolverStatus = { ...MOCK_SOLVER_STATUS };

export async function runOptimizationMock(
  _payload: OptimizeRequest
): Promise<OptimizeResult> {
  await mockDelay();
  solverStatusState = {
    ...solverStatusState,
    status: "completed",
    last_run_at: new Date().toISOString(),
    execution_time_ms: 1150,
  };
  return {
    ...MOCK_OPTIMIZE_RESULT,
    execution_time_ms: 1150,
  };
}

export async function getSolverStatusMock(): Promise<SolverStatus> {
  await mockDelay();
  return { ...solverStatusState };
}

export async function scheduleCronMock(
  payload: ScheduleCronRequest
): Promise<ScheduleCronResponse> {
  await mockDelay();
  return {
    ...MOCK_SCHEDULE_CRON_RESPONSE,
    cron_expression: `0 ${payload.cutoff_time.split(":")[0] || "16"} * * 1-6`,
    scheduled_at: new Date().toISOString(),
    message: payload.is_enabled
      ? `Cron scheduled for ${payload.cutoff_time} ${payload.timezone}`
      : "Automated cron execution disabled",
  };
}
