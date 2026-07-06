"use client";

import { useCallback, useState } from "react";
import {
  StepItem,
  UseStepControllerOptions,
  UseStepControllerReturn,
} from "@/lib/navigation/stepTypes";

export function useStepController<TStep extends StepItem = StepItem>({
  steps,
  homeIndex = 0,
  initialStepIndex,
  isDirty,
  confirmLeave,
}: UseStepControllerOptions<TStep>): UseStepControllerReturn<TStep> {
  const safeInitial = Math.max(
    homeIndex,
    Math.min(initialStepIndex ?? homeIndex, steps.length - 1)
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(safeInitial);
  const [direction, setDirection] = useState<"forward" | "backward" | "home">(
    "forward"
  );
  const [transitionState, setTransitionState] = useState<
    "idle" | "entering" | "exiting"
  >("idle");

  const currentStep = steps[currentStepIndex] ?? steps[homeIndex];
  const isHome = currentStepIndex === homeIndex;

  const goTo = useCallback(
    (index: number) => {
      const target = Math.max(homeIndex, Math.min(index, steps.length - 1));
      if (target === currentStepIndex) return;

      setDirection(
        target === homeIndex
          ? "home"
          : target > currentStepIndex
          ? "forward"
          : "backward"
      );
      setTransitionState("entering");
      setCurrentStepIndex(target);
    },
    [currentStepIndex, homeIndex, steps.length]
  );

  const goBack = useCallback(() => {
    if (currentStepIndex > homeIndex) {
      goTo(currentStepIndex - 1);
    }
  }, [currentStepIndex, goTo, homeIndex]);

  const next = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      goTo(currentStepIndex + 1);
    }
  }, [currentStepIndex, goTo, steps.length]);

  const previous = useCallback(() => {
    goBack();
  }, [goBack]);

  const reset = useCallback(() => {
    setDirection("home");
    setTransitionState("entering");
    setCurrentStepIndex(homeIndex);
  }, [homeIndex]);

  const goHome = useCallback(async () => {
    if (currentStepIndex === homeIndex) return;

    const dirty = isDirty?.() ?? false;
    if (dirty) {
      const confirmed =
        (await confirmLeave?.({
          title: "放弃当前创建？",
          message: "你填写的内容还没有保存。",
          confirmLabel: "放弃并返回",
          cancelLabel: "继续编辑",
        })) ?? false;
      if (!confirmed) return;
    }

    setTransitionState("exiting");

    window.setTimeout(() => {
      reset();
    }, 280);
  }, [currentStepIndex, homeIndex, isDirty, confirmLeave, reset]);

  return {
    steps,
    currentStepIndex,
    currentStep,
    direction,
    transitionState,
    isHome,
    isDirty,
    goTo,
    goBack,
    goHome,
    next,
    previous,
    reset,
  };
}
