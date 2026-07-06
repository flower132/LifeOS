export interface StepItem {
  key: string;
  label: string;
}

export interface UseStepControllerOptions<TStep extends StepItem = StepItem> {
  steps: TStep[];
  homeIndex?: number;
  initialStepIndex?: number;
  isDirty?: () => boolean;
  confirmLeave?: (options: {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
  }) => Promise<boolean>;
}

export interface UseStepControllerReturn<TStep extends StepItem = StepItem> {
  steps: TStep[];
  currentStepIndex: number;
  currentStep: TStep;
  direction: "forward" | "backward" | "home";
  transitionState: "idle" | "entering" | "exiting";
  isHome: boolean;
  isDirty?: () => boolean;
  goTo: (index: number) => void;
  goBack: () => void;
  goHome: () => Promise<void>;
  next: () => void;
  previous: () => void;
  reset: () => void;
}
