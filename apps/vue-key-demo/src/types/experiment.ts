export interface UserItem {
  id: number;
  name: string;
  age: number;
}

export type KeyStrategyId = 'no-key' | 'index-key' | 'unstable-key' | 'stable-key';

export type OperationId =
  | 'delete-first'
  | 'delete-middle'
  | 'insert-head'
  | 'insert-middle'
  | 'reverse'
  | 'shuffle'
  | 'modify-data'
  | 'parent-rerender'
  | 'reset';

export type ExecutionMode = 'immediate' | 'step';

export type StepPhase = 1 | 2 | 3 | 4 | 5;

export interface InstanceRecord {
  instanceId: string;
  initialOwnerId: number;
  initialOwnerName: string;
  currentUserId: number;
  currentUserName: string;
  currentIndex: number;
  currentKeyLabel: string;
  isNewlyMounted: boolean;
}

export interface InstanceMapping {
  instanceId: string;
  userId: number;
  userName: string;
  index: number;
  keyLabel: string;
  initialOwnerId: number;
  initialOwnerName: string;
  isNewlyMounted: boolean;
  isMismatched: boolean;
}

export interface DestroyedRecord {
  instanceId: string;
  userId: number;
  userName: string;
  initialOwnerName: string;
}

export interface StrategyDiffReport {
  strategy: KeyStrategyId;
  operationSeq: number;
  operationLabel: string;
  reusedCount: number;
  createdCount: number;
  destroyedCount: number;
  mismatchCount: number;
  beforeMappings: InstanceMapping[];
  afterMappings: InstanceMapping[];
  destroyedRecords: DestroyedRecord[];
}

export interface StrategyMeta {
  id: KeyStrategyId;
  orderLabel: string;
  title: string;
  shortTitle: string;
  templateCode: string;
  mechanismSummary: string;
  watchPoints: string[];
}

export interface PendingStepContext {
  operationId: OperationId;
  operationLabel: string;
  operationSummary: string;
  phase: StepPhase;
  beforeUsers: UserItem[];
  nextUsers: UserItem[];
  beforeMappings: Record<KeyStrategyId, InstanceMapping[]>;
  unstablePreviewNewKeys: string[];
}

export interface ClassicExperiment {
  id: string;
  number: string;
  title: string;
  presetUsers: UserItem[];
  operationId: OperationId;
  operationLabel: string;
  focusPoints: string[];
}
