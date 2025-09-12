import { EventSourceMessage, fetchEventSource } from "@microsoft/fetch-event-source";
import { parse, OBJ, ARR, STR } from "partial-json";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { z } from "zod";

import { getRagieAgentsSearchPath } from "@/lib/paths";

import {
  inProgressCitationStepSchema,
  evidenceSchema,
  orchestratorThinkSchema,
  orchestratorToolCallSchema,
  rawResponseEventSchema,
  resultSchema,
  runItemSchema,
  stepResultSchema,
} from "./types";

type StepType = "think" | "search" | "code" | "answer" | "plan" | "citation" | "surrender";

// TODO: test surrender step
type AgenticRetrieverState = {
  query: string;
  runId: string | null;
  pastResults: Array<{ timestamp: string; runId: string; query: string; result: z.infer<typeof resultSchema> }>;
  result: null | z.infer<typeof resultSchema>;
  status: "idle" | "loading" | "error" | "success";
  currentStepType: StepType | null;
  accumulatedText: string;
  steps: Array<z.infer<typeof stepResultSchema>>;
  _streamedResponses: Array<any>;
  _agentUpdatedStreamEvent: Array<z.infer<any>>;
  _runItemStreamEvent: Array<z.infer<typeof runItemSchema>>;
  _rawResponseEvent: Array<z.infer<typeof rawResponseEventSchema>>;
  _inprogressResponse: string;
  _allEvents: Array<any>;
  _evidence: Record<string, z.infer<typeof evidenceSchema>>;
};

type EvidenceCollection = Record<string, Array<z.infer<typeof evidenceSchema>>>;
export type AgenticRetriever = {
  steps: Array<z.infer<typeof stepResultSchema>>;
  status: AgenticRetrieverState["status"];
  currentStepType: AgenticRetrieverState["currentStepType"];
  query: string;
  currentResponse:
    | z.infer<typeof orchestratorToolCallSchema>
    | z.infer<typeof orchestratorThinkSchema>
    | z.infer<typeof inProgressCitationStepSchema>
    | null;
  result: AgenticRetrieverState["result"];
  evidence: EvidenceCollection;
  submit: (payload: { query: string }) => void;
  reset: () => void;
};

type SetQueryAction = {
  type: "SET_QUERY";
  payload: string;
};

type TakeAgentUpdatedStreamEventAction = {
  type: "TAKE_AGENT_UPDATED_STREAM_EVENT";
  payload: any;
};
type TakeRunItemStreamEventAction = {
  type: "TAKE_RUN_ITEM_STREAM_EVENT";
  payload: z.infer<typeof runItemSchema>;
};
type TakeRawResponseEventAction = {
  type: "TAKE_RAW_RESPONSE_EVENT";
  payload: string; // raw JSON string from the event
};

type TakeDoneEvent = {
  type: "TAKE_DONE_EVENT";
  payload: any;
};
type SetRunIdAction = {
  type: "SET_RUN_ID";
  payload: string | null;
};

type ResetAction = {
  type: "RESET";
};

type RetryAction = {
  type: "RETRY";
};

type SetErrorAction = {
  type: "SET_ERROR";
  payload: string;
};

type AgenticRetrieverAction =
  | SetQueryAction
  | SetRunIdAction
  | TakeDoneEvent
  | ResetAction
  | RetryAction
  | SetErrorAction
  | TakeAgentUpdatedStreamEventAction
  | TakeRunItemStreamEventAction
  | TakeRawResponseEventAction;

function agenticRetrieverReducer(state: AgenticRetrieverState, action: AgenticRetrieverAction): AgenticRetrieverState {
  switch (action.type) {
    case "SET_QUERY":
      if (action.payload === state.query) {
        return state;
      }
      return { ...state, status: "loading", query: action.payload };

    case "SET_RUN_ID":
      return { ...state, runId: action.payload };

    case "TAKE_AGENT_UPDATED_STREAM_EVENT":
      return {
        ...state,
        _agentUpdatedStreamEvent: [...state._agentUpdatedStreamEvent, action.payload],
        _allEvents: [...state._allEvents, action.payload],
      };

    case "TAKE_RUN_ITEM_STREAM_EVENT": {
      let steps = state.steps;
      let currentStepType = state.currentStepType;
      console.log("TAKE_RUN_ITEM_STREAM_EVENT", action.payload);
      if ("output" in action.payload) {
        steps = [...steps, stepResultSchema.parse(action.payload.output)];
        currentStepType = "think";
      }
      return {
        ...state,
        steps,
        currentStepType,
        _runItemStreamEvent: [...state._runItemStreamEvent, action.payload],
        _allEvents: [...state._allEvents, action.payload],
      };
    }

    case "TAKE_RAW_RESPONSE_EVENT": {
      let _inprogressResponse = state._inprogressResponse;
      let currentStepType = state.currentStepType;
      // console.log("Current in-progress response:", _inprogressResponse);
      // console.log("Current event:", parse(action.payload, OBJ | ARR | STR));
      // const parsed = rawResponseEventSchema.parse(parse(action.payload, OBJ | ARR | STR));
      console.debug("Raw event payload:", action.payload);
      const parsedRes = rawResponseEventSchema.safeParse(action.payload);
      if (!parsedRes.success) {
        console.error("Failed to parse raw response event:", action.payload, parsedRes.error);
        return state;
      }
      const parsed = parsedRes.data;
      let _streamedResponses = state._streamedResponses;
      switch (parsed.type) {
        case "response.created":
          console.log("Response created:", parsed);
          break;
        case "response.in_progress":
          console.log("In-progress response:", parsed);
          break;
        case "response.output_item.added":
          console.log("Output item added:", parsed);
          _inprogressResponse = "";
          // Check if the item is a function call (which has a name property)
          if (parsed.item.type === "function_call") {
            // Map tool names to step types
            const toolToStepType: Record<string, StepType> = {
              plan: "plan",
              search: "search",
              code: "code",
              answer: "answer",
              transfer_to_citation: "citation",
              // TODO: Handle surrender step
              transfer_to_surrender: "answer",
            };
            currentStepType = toolToStepType[parsed.item.name] || "think";
          }
          break;
        case "handoff_call_item":
          console.log("Handoff call item:", parsed);
          _inprogressResponse = "";
          break;
        case "response.output_text.delta":
          console.log("Output text delta:", parsed);
          _inprogressResponse += parsed.delta;
          break;
        case "response.function_call_arguments.delta":
          console.log("Function call arguments delta:", parsed);
          // TypeScript now knows parsed.delta exists because of discriminated union
          _inprogressResponse += parsed.delta;
          break;
        case "response.function_call_arguments.done":
          console.log("Function call arguments done:", parsed);
          _streamedResponses = [
            ..._streamedResponses,
            { type: currentStepType || "think", data: JSON.parse(state._inprogressResponse) },
          ];
          break;
        case "response.completed":
          console.log("Response completed:", parsed);
          break;
        default:
          console.log("Parsed response:", parsed);
      }

      return {
        ...state,
        currentStepType,
        _rawResponseEvent: [...state._rawResponseEvent, parsed],
        _allEvents: [...state._allEvents, parsed],
        _inprogressResponse,
        _streamedResponses,
      };
    }

    case "TAKE_DONE_EVENT": {
      if (state.status !== "loading") {
        return state;
      }
      return {
        ...state,
        pastResults: [
          ...state.pastResults,
          { timestamp: new Date().toISOString(), query: state.query, runId: state.runId || "", result: action.payload },
        ],
        status: action.payload.type,
        result: action.payload,
      };
    }
    case "RESET": {
      if (state.status !== "loading") {
        return state;
      }
      return {
        ...state,
        status: "idle",
        query: "",
        result: null,
        accumulatedText: "",
        steps: [],
      };
    }
    case "RETRY": {
      // TODO: Implement retry logic
      return state;
    }
    default:
      return state;
  }
}

export default function useAgenticRetriever({
  tenantSlug,
  onDone,
  onError,
}: {
  tenantSlug: string;
  onDone: (payload: z.infer<typeof resultSchema>) => Promise<void>;
  onError: (payload: string) => Promise<void>;
}): AgenticRetriever {
  const abortControllerRef = useRef<AbortController | null>(null);
  const eventDebugRef = useRef<string>("");
  const [state, dispatch] = useReducer(agenticRetrieverReducer, {
    query: "",
    runId: null,
    status: "idle",
    pastResults: [],
    result: null,
    currentStepType: null,
    accumulatedText: "",
    steps: [],
    _streamedResponses: [],
    _agentUpdatedStreamEvent: [],
    _runItemStreamEvent: [],
    _rawResponseEvent: [],
    _allEvents: [],
    _inprogressResponse: "",
    _evidence: {},
  });

  const submit = useCallback((payload: { query: string }) => {
    dispatch({ type: "SET_QUERY", payload: payload.query });
  }, []);

  const close = useCallback(() => {
    console.log("Closing EventSource");
  }, []);

  const reset = useCallback(() => {
    console.log("Resetting agentic retrieval state");
    abortControllerRef.current?.abort();
    close();
    dispatch({ type: "RESET" });
  }, [close]);

  const start = useCallback(async () => {
    if (typeof window === "undefined") return;
    abortControllerRef.current = new AbortController();

    const handleError = async (e: EventSourceMessage) => {
      // Browsers fire 'error' on transient disconnects too; the stream may auto-retry.
      // You can inspect (e as any).data if your server sends a body with errors.
      console.error("Stream error:", e);
      dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : "Unknown error" });
      await onError(e instanceof Error ? e.message : "Unknown error");
    };

    const handleEvent = (e: EventSourceMessage) => {
      // Attempt to parse and handle different event types
      try {
        const parsed = JSON.parse(e.data);
        console.debug("Parsed generic event:", parsed);
        switch (parsed.type) {
          case "agent_updated_stream_event":
            dispatch({ type: "TAKE_AGENT_UPDATED_STREAM_EVENT", payload: parsed });
            break;
          case "run_item_stream_event":
            dispatch({ type: "TAKE_RUN_ITEM_STREAM_EVENT", payload: runItemSchema.parse(parsed.data.item) });
            break;
          case "raw_response_event":
            dispatch({ type: "TAKE_RAW_RESPONSE_EVENT", payload: parsed.data });
            break;
          default:
            console.warn("Unhandled event type:", parsed, parsed.type);
        }
      } catch (err) {
        console.error("Failed to parse generic event:", e.data, err);
      }
    };

    const handleDone = async (e: EventSourceMessage) => {
      console.log("Stream done event:", e.data);
      let doneEvent = resultSchema.safeParse(JSON.parse(e.data));
      if (!doneEvent.success) {
        console.error("Failed to parse done event:", e.data, doneEvent.error);
        dispatch({ type: "SET_ERROR", payload: "Failed to parse done event" });
        return;
      }
      dispatch({ type: "TAKE_DONE_EVENT", payload: doneEvent.data });
      await onDone(doneEvent.data);
      console.log("Stream closed", e.data);
    };

    // TODO: Obv stop hardcoding here and PROXY to the actual API
    await fetchEventSource(getRagieAgentsSearchPath(), {
      openWhenHidden: true,
      method: "POST",
      async onmessage(event) {
        console.debug("Event:", event);
        eventDebugRef.current += `event: ${event.event}\n${JSON.stringify(JSON.parse(event.data), null, 2)}\n\n`;
        if (event.event === "message") {
          handleEvent(event);
        } else if (event.event === "done") {
          await handleDone(event);
        } else if (event.event === "error") {
          await handleError(event);
        }
      },
      async onopen(response) {
        console.log("Stream opened");
        dispatch({ type: "SET_RUN_ID", payload: response.headers.get("run-id") || null });
      },
      async onclose() {
        console.log("Stream closed");
      },
      onerror(event) {
        console.error("Stream error:", event);
      },
      body: JSON.stringify({
        query: state.query,
        effort: "low",
        stream: true,
        tenantSlug,
      }),
      signal: abortControllerRef.current?.signal,
    });
  }, [dispatch, abortControllerRef, state.query, tenantSlug, onDone, onError]);

  useEffect(() => {
    if (state.query) {
      // reset(); // reset state before starting a new query
      start();
    }
  }, [state.query, start, reset]);

  let partialJson = null;
  try {
    partialJson = state._inprogressResponse ? parse(state._inprogressResponse, OBJ | ARR | STR) : null;
    console.debug("partial-json", partialJson);
  } catch (err) {
    console.error("Failed to parse in progress response", state._inprogressResponse, err);
  }

  // TODO: Memoize currentResponse
  let currentResponse:
    | null
    | z.infer<typeof orchestratorToolCallSchema>
    | z.infer<typeof orchestratorThinkSchema>
    | z.infer<typeof inProgressCitationStepSchema> = null;
  if (state.currentStepType === "think") {
    currentResponse = { type: "think" };
  } else if (partialJson && state.currentStepType === "citation") {
    const safeParse = inProgressCitationStepSchema.safeParse({ ...partialJson, type: "citation" });
    if (safeParse.success) {
      currentResponse = safeParse.data;
    } else {
      console.error("Failed to parse in progress citation step schema", safeParse.error);
    }
  } else if (partialJson) {
    const safeParse = orchestratorToolCallSchema.safeParse({
      type: state.currentStepType,
      arguments: partialJson,
    });
    if (safeParse.success) {
      currentResponse = safeParse.data;
    } else {
      // If parsing fails, we can still return a partial response
      console.error(partialJson);
      console.error("Failed to parse orchestrator tool call schema", safeParse.error);
    }
  }

  console.log("currentResponse", currentResponse, state.currentStepType, partialJson);

  const evidence = useMemo(() => {
    const toolCallOutputs = state._runItemStreamEvent.filter((item) => item.type === "tool_call_output_item");
    const evidence = toolCallOutputs.reduce<EvidenceCollection>((acc, item, idx) => {
      if ("output" in item && item.output.type === "search") {
        // TODO: This is not deduping as expected
        const searchResultMap = item.output.query_details
          .flatMap((q) => q.search_results)
          .reduce<Record<string, z.infer<typeof evidenceSchema>>>((searchAcc, searchItem) => {
            console.log("searchItem", searchItem.id);
            searchAcc[searchItem.id] = searchItem;
            return searchAcc;
          }, {});
        if (Object.keys(searchResultMap).length === 0) {
          return acc;
        }
        acc[String(idx)] = Object.entries(searchResultMap).map(([id, searchItem]) => searchItem);
      }
      if ("output" in item && item.output.type === "code") {
        // TODO: Hack. The code step does not have the same shape as evidence.
        // Maybe this should only get pulled if you used by an answer step?
        const codeInterpreterEvidence = evidenceSchema.parse({ ...item.output, text: item.output.code_result });
        acc[String(idx)] = [codeInterpreterEvidence];
      }
      return acc;
    }, {});
    return evidence;
  }, [state._runItemStreamEvent]);

  console.log("state", state, new Set(state._rawResponseEvent.map((e) => e.type)));

  return {
    query: state.query,
    result: state.result,
    status: state.status,
    steps: state.steps,
    currentResponse,
    currentStepType: state.currentStepType,
    evidence,
    submit,
    reset,
  };
}
