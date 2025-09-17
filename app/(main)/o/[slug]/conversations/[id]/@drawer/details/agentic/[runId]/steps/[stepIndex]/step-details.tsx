"use client";

import {
  AnswerStep,
  SearchStep,
  PlanStep,
  CodingStep,
  SurrenderStep,
  getStepTypeInfo,
  EvaluatedAnswerStep,
  StepTimer,
} from "@/components/agentic-retriever/agentic-response";
import { useAgenticRetrieverContext } from "@/components/agentic-retriever/agentic-retriever-context";

export default function StepDetails({ runId, stepIndex }: { runId: string; stepIndex: string }) {
  const agenticRetrival = useAgenticRetrieverContext();
  const run = agenticRetrival.getRun(runId);
  if (!run) {
    return <div>Run not found</div>;
  }
  const step = run.steps[Number(stepIndex)];
  if (!step) {
    return <div>Step not found</div>;
  }

  let content = null;
  const stepInfo = getStepTypeInfo(step.type);
  switch (step.type) {
    case "evaluated_answer":
      content = <EvaluatedAnswerStep step={step} />;
      break;
    case "search":
      content = <SearchStep step={step} />;
      break;
    case "plan":
      content = <PlanStep step={step} />;
      break;
    case "code":
      content = <CodingStep step={step} />;
      break;
    case "surrender":
      content = <SurrenderStep step={step} />;
      break;
  }
  const Icon = stepInfo.icon;
  const stepStartTime = run.stepTiming[Number(stepIndex)];
  const stepEndTime = run.stepTiming[Number(stepIndex) + 1];
  return (
    <div>
      <div className="flex items-center gap-3 pt-6">
        <div className={`rounded ${stepInfo.iconColor} p-1`}>
          <Icon className={`h-5 w-5 text-white`} />
        </div>
        <h2 className="text-lg font-bold">{stepInfo.label}</h2>
      </div>
      <div className="h-3" />
      <div className="text-[#74747A]">
        Step {Number(stepIndex) + 1} &middot;{" "}
        <div className="inline-block">
          <StepTimer startTime={stepStartTime} endTime={stepEndTime} />
        </div>
      </div>
      <div className="h-4" />
      <hr />
      <div className="h-5" />
      {content}
    </div>
  );
}
