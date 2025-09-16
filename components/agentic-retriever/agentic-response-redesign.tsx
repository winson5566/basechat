import { intervalToDuration, Duration } from "date-fns";
import {
  Terminal,
  Search,
  Code,
  Brain,
  MessageSquare,
  CheckCircle,
  XCircle,
  List,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import pluralize from "pluralize";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { z } from "zod";

import Logo from "../tenant/logo/logo";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

import { stepResultSchema } from "./types";
import { AgenticRetriever } from "./use-agentic-retriever";

type Step = z.infer<typeof stepResultSchema>;

function getStepTypeInfo(stepType: Step["type"] | "think") {
  switch (stepType) {
    case "think":
      return {
        icon: Brain,
        iconColor: "bg-yellow-600",
        label: "Think",
        activeLabel: "Thinking",
      };
    case "answer":
      return {
        icon: MessageSquare,
        iconColor: "bg-green-600",
        label: "Answer",
        activeLabel: "Answering",
      };
    case "evaluated_answer":
      return {
        icon: CheckCircle,
        iconColor: "bg-green-600",
        label: "Answer",
        activeLabel: "Evaluating Answer",
      };
    case "search":
      return {
        icon: Search,
        iconColor: "bg-blue-600",
        label: "Search",
        activeLabel: "Searching",
      };
    case "plan":
      return {
        icon: List,
        iconColor: "bg-purple-600",
        label: "Plan",
        activeLabel: "Planning",
      };
    case "code":
      return {
        icon: Code,
        iconColor: "bg-green-600",
        label: "Code",
        activeLabel: "Coding",
      };
    case "surrender":
      return {
        icon: XCircle,
        iconColor: "bg-orange-600",
        label: "Answer",
        activeLabel: "Answering",
      };
    case "citation":
      return {
        icon: BookOpenCheck,
        iconColor: "bg-purple-600",
        label: "Citation",
        activeLabel: "Citing",
      };
    default:
      return {
        icon: Terminal,
        iconColor: "bg-gray-600",
        label: `Unknown (${stepType})`,
        activeLabel: `Unknown (${stepType})`,
      };
  }
}

function StepListItem({
  step,
  index,
  startTime,
  endTime,
}: {
  step: Step;
  index: number;
  startTime: number;
  endTime: number | null;
}) {
  const stepInfo = getStepTypeInfo(step.type);
  const Icon = stepInfo.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-[#F5F5F7]  cursor-pointer`}
        >
          <div className={`rounded ${stepInfo.iconColor} p-1`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium">{stepInfo.label}</span>
          <div className="ml-auto">
            <StepTimer startTime={startTime} endTime={endTime} />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`rounded ${stepInfo.iconColor} p-1`}>
              <Icon className={`h-6 w-6 text-white`} />
            </div>
            {stepInfo.label} Step {index + 1}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <StepResult step={step} index={index} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepResult({ step, index }: { step: Step; index: number }) {
  const stepNumber = index + 1;

  switch (step.type) {
    case "answer":
      return <AnswerStep key={stepNumber} step={step} />;
    case "evaluated_answer":
      return <EvaluatedAnswerStep key={stepNumber} step={step} />;
    case "search":
      return <SearchStep key={stepNumber} step={step} />;
    case "plan":
      return <PlanStep key={stepNumber} step={step} />;
    case "code":
      return <CodingStep key={stepNumber} step={step} />;
    case "citation":
      return <div>Citation Step</div>;
    case "surrender":
      return <SurrenderStep key={stepNumber} step={step} />;
    default:
      // Fallback for unknown step types
      return (
        <Card key={stepNumber} className="mb-4">
          <CardHeader>
            <CardTitle>Unknown Step Type: {(step as any).type}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(step, null, 2)}</pre>
          </CardContent>
        </Card>
      );
  }
}

function StepNavigation({
  steps,
  stepTiming,
  isCompleted,
}: {
  steps: AgenticRetriever["steps"];
  stepTiming: AgenticRetriever["stepTiming"];
  isCompleted: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (steps.length === 0) return null;
  return (
    <div className="flex flex-col px-4 py-2 mb-4 rounded-lg border border-[#D7D7D7]">
      <div className="flex w-full items-center" onClick={() => setIsOpen(!isOpen)}>
        <span className="flex-grow">{pluralize("step", steps.length, true)} completed</span>
        <StepTimer startTime={stepTiming[0]} endTime={isCompleted ? stepTiming[stepTiming.length - 1] : null} />
        <div className="pl-4 shrink-0">
          {isOpen ? <ChevronUp className="h-5 w-5 min-w-5" /> : <ChevronDown className="h-5 w-5 min-w-5" />}
        </div>
      </div>
      {isOpen && (
        <ul className="flex flex-col gap-3 pt-4 pb-1">
          {steps.map((step, index) => (
            <li key={index} className="rounded-lg border border-[#D7D7D7]">
              <StepListItem
                step={step}
                index={index}
                startTime={stepTiming[index]}
                endTime={stepTiming[index + 1] || null}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnswerStep({ step }: { step: Step & { type: "answer" } }) {
  return (
    <div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Current Question:</h4>
        <p className="text-sm">{step.current_question}</p>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Thought Process:</h4>
        <p className="text-sm bg-gray-50 p-2 rounded">{step.think}</p>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Answer:</h4>
        <p className="text-sm">{step.answer.text}</p>
      </div>
      {step.answer.evidence.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">Evidence:</h4>
          <ul className="text-sm space-y-1">
            {step.answer.evidence.map((evidence, idx) => (
              <li key={idx} className="bg-blue-50 p-2 rounded text-blue-800">
                {evidence}
              </li>
            ))}
          </ul>
        </div>
      )}
      {step.other_resolved_question_ids.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">Other Resolved Questions:</h4>
          <div className="flex flex-wrap gap-1">
            {step.other_resolved_question_ids.map((id, idx) => (
              <span key={idx} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                {id}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EvaluatedAnswerStep({ step }: { step: Step & { type: "evaluated_answer" } }) {
  return (
    <div>
      <div className="flex mb-2">
        <span
          className={`px-2 py-1 rounded text-xs ${
            step.eval_passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {step.eval_passed ? "PASSED" : "FAILED"}
        </span>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Current Question:</h4>
        <p className="text-sm">{step.current_question}</p>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Thought Process:</h4>
        <p className="text-sm bg-gray-50 p-2 rounded">{step.think}</p>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Answer:</h4>
        <p className="text-sm">{step.answer.text}</p>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Evaluation Reason:</h4>
        <p
          className={`text-sm p-2 rounded ${
            step.eval_passed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {step.eval_reason}
        </p>
      </div>
      {step.answer.evidence.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">Evidence:</h4>
          <ul className="text-sm space-y-1">
            {step.answer.evidence.map((evidence, idx) => (
              <li key={idx} className="bg-blue-50 p-2 rounded text-blue-800">
                {evidence}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SearchStep({ step }: { step: Step & { type: "search" } }) {
  return (
    <div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Current Question:</h4>
        <p className="text-sm">{step.current_question}</p>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Thought Process:</h4>
        <p className="text-sm bg-gray-50 p-2 rounded">{step.think}</p>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Search Requests:</h4>
        <ul className="text-sm space-y-1">
          {step.search.search_requests.map((request, idx) => (
            <li key={idx} className="bg-blue-50 p-2 rounded">
              {request}
            </li>
          ))}
        </ul>
      </div>
      {step.query_details.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">Query Details:</h4>
          <div className="space-y-2">
            {step.query_details.map((query, idx) => (
              <div key={idx} className="bg-gray-50 p-2 rounded">
                <p className="font-medium text-sm">Query: {query.query}</p>
                <p className="text-xs text-gray-600">Effort: {query.search_effort}</p>
                <p className="text-xs text-gray-600">Results: {query.search_results.length}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {step.search_log && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">Search Log:</h4>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-line">{step.search_log}</pre>
        </div>
      )}
    </div>
  );
}

function PlanStep({ step }: { step: Step & { type: "plan" } }) {
  return (
    <div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Current Question:</h4>
        <p className="text-sm">{step.current_question}</p>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Thought Process:</h4>
        <p className="text-sm bg-gray-50 p-2 rounded">{step.think}</p>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Questions to Answer:</h4>
        <ul className="text-sm space-y-1">
          {step.questions_to_answer.map((question, idx) => (
            <li key={idx} className="bg-purple-50 p-2 rounded text-purple-800">
              {question}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CodingStep({ step }: { step: Step & { type: "code" } }) {
  return (
    <div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Current Question:</h4>
        <p className="text-sm">{step.current_question}</p>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Thought Process:</h4>
        <p className="text-sm bg-gray-50 p-2 rounded">{step.think}</p>
      </div>
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Code Issue:</h4>
        <p className="text-sm bg-red-50 p-2 rounded text-red-800">{step.code_issue}</p>
      </div>
      {step.code && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">Code:</h4>
          <pre className="text-sm bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
            <code>{step.code}</code>
          </pre>
        </div>
      )}
      {step.code_result && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">Code Result:</h4>
          <pre className="text-sm bg-blue-50 p-2 rounded overflow-x-auto">{step.code_result}</pre>
        </div>
      )}
    </div>
  );
}

function SurrenderStep({ step }: { step: Step & { type: "surrender" } }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <XCircle className="h-5 w-5 text-orange-600" />
          Surrender Step
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">Current Question:</h4>
          <p className="text-sm">{step.current_question}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">Thought Process:</h4>
          <p className="text-sm bg-gray-50 p-2 rounded">{step.think}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">Partial Answer:</h4>
          <p className="text-sm bg-orange-50 p-2 rounded text-orange-800">{step.partial_answer.text}</p>
        </div>
        {step.partial_answer.evidence.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-600 mb-1">Evidence:</h4>
            <ul className="text-sm space-y-1">
              {step.partial_answer.evidence.map((evidence, idx) => (
                <li key={idx} className="bg-blue-50 p-2 rounded text-blue-800">
                  {evidence}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StreamingResponse({ currentResponse }: { currentResponse: AgenticRetriever["currentResponse"] }) {
  if (!currentResponse) return null;
  let response = null;
  switch (currentResponse.type) {
    case "plan":
      response = currentResponse.arguments.plan;
      break;
    case "search":
      response = currentResponse.arguments.query;
      break;
    case "code":
      response = currentResponse.arguments.code_issue;
      break;
    case "answer":
      response = currentResponse.arguments.answer_args?.answer_approach;
      break;
    case "think":
      response = "";
      break;
    case "citation":
      response = currentResponse.answer;
      break;
    default:
      console.warn("Unknown tool call type:", (currentResponse as any).type);
  }
  console.log("Streaming Response", response, currentResponse);
  return (
    <div>
      {response ? (
        <Markdown className="markdown" rehypePlugins={[rehypeHighlight, remarkGfm]}>
          {response}
        </Markdown>
      ) : (
        <></>
      )}
    </div>
  );
}

// function EvidenceList({ evidence }: { evidence: AgenticRetriever["evidence"] }) {
//   console.log("Evidence List", evidence);
//   if (Object.keys(evidence).length === 0) return null;

//   const truncateText = (text: string, maxLength: number = 20) => {
//     return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
//   };

//   return (
//     <div className="mt-4">
//       <div className="flex flex-col gap-2">
//         {Object.entries(evidence).map(([stepCount, e]) => (
//           <div key={stepCount}>
//             <h5 className="font-medium text-sm text-gray-600 mb-1">Step {Number(stepCount) + 1}:</h5>
//             {e.map((evidence, itemIdx) => {
//               const displayText = evidence.type === "ragie" ? evidence.document_name : evidence.type;
//               return (
//                 <Popover key={itemIdx}>
//                   <PopoverTrigger asChild>
//                     <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer">
//                       {truncateText(displayText)}
//                     </button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-auto max-w-xs p-2" side="top">
//                     <div className="text-xs">
//                       <p className="font-medium mb-1">Evidence:</p>
//                       <Markdown className="markdown mt-[10px]" rehypePlugins={[rehypeHighlight, remarkGfm]}>
//                         {evidence.text}
//                       </Markdown>
//                     </div>
//                   </PopoverContent>
//                 </Popover>
//               );
//             })}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

export default function AgenticResponse({
  currentStepType,
  currentResponse,
  result,
  steps,
  stepTiming,
  avatarName,
  avatarLogoUrl,
  tenantId,
}: {
  currentStepType: AgenticRetriever["currentStepType"];
  currentResponse: AgenticRetriever["currentResponse"] | null;
  result: AgenticRetriever["result"] | null;
  steps: AgenticRetriever["steps"];
  stepTiming: AgenticRetriever["stepTiming"];
  avatarName: string;
  avatarLogoUrl?: string | null;
  tenantId: string;
}) {
  const stepInfo = getStepTypeInfo(currentStepType || "think");

  return (
    <div className="flex w-full">
      <div className="mb-8 shrink-0">
        <Logo
          name={avatarName}
          url={avatarLogoUrl}
          width={40}
          height={40}
          className="text-[13px] h-[40px] w-[40px]"
          tenantId={tenantId}
        />
      </div>
      <div className="self-start flex-grow mb-6 rounded-md ml-7 max-w-[calc(100%-60px)]">
        <StepNavigation steps={steps} stepTiming={stepTiming} isCompleted={!!result} />
        {result ? (
          <>
            <Markdown className="markdown mt-[10px]" rehypePlugins={[rehypeHighlight, remarkGfm]}>
              {result.text}
            </Markdown>
          </>
        ) : (
          <>
            <strong>{stepInfo.activeLabel}…</strong>
            <StreamingResponse currentResponse={currentResponse} />
            <StepTimer startTime={stepTiming[stepTiming.length - 1]} endTime={null} />
          </>
        )}
      </div>
    </div>
  );
}

function formatElapsedTime(startTime: number, endTime: number) {
  const d = intervalToDuration({ start: new Date(startTime), end: new Date(endTime) });
  const units = [
    ["days", "d"],
    ["hours", "h"],
    ["minutes", "m"],
    ["seconds", "s"],
  ];

  // Collect nonzero parts in order
  const parts = units
    .map(([key, suffix]) => (d[key as keyof Duration] ? `${d[key as keyof Duration]}${suffix}` : null))
    .filter(Boolean);

  // Take the first two significant parts
  return parts.slice(0, 2).join(" ") || "0s";
}

function StepTimer({ startTime, endTime }: { startTime: number; endTime: number | null }) {
  const [time, setTime] = useState(endTime || Date.now());
  useEffect(() => {
    if (endTime) {
      setTime(endTime);
      return;
    }
    const interval = setInterval(() => {
      setTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const displayTime = formatElapsedTime(startTime, time);

  return <p className="text-xs text-muted-foreground">{displayTime}</p>;
}
