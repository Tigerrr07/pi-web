import type { FileViewerState } from "@/lib/file-viewer-state";
import type { Tab } from "./TabBar";

export interface FileWorkspaceState {
  tabs: Tab[];
  activeTabId: string | null;
  open: boolean;
}

export function switchFileWorkspace(
  states: Map<string, FileWorkspaceState>,
  currentKey: string | null,
  nextKey: string,
  current: FileWorkspaceState,
): FileWorkspaceState {
  if (currentKey === nextKey) return current;
  if (currentKey) states.set(currentKey, current);
  return states.get(nextKey) ?? { tabs: [], activeTabId: null, open: false };
}

interface OpenFileTabInput {
  fileName: string;
  filePath: string;
  modeHint?: "diff";
  page?: number;
  sourceSessionId?: string | null;
  tabId: string;
}

export function openFileTab(tabs: Tab[], input: OpenFileTabInput): Tab[] {
  const existing = tabs.find((tab) => tab.id === input.tabId);
  if (!existing) {
    return [...tabs, {
      id: input.tabId,
      label: input.fileName,
      filePath: input.filePath,
      sourceSessionId: input.sourceSessionId,
      initialDisplayMode: input.modeHint,
      page: input.page,
      viewerState: input.modeHint ? {
        displayMode: input.modeHint,
        wrapLines: false,
        scrollTop: 0,
        scrollLeft: 0,
      } : undefined,
      viewerRevision: 0,
    }];
  }

  const sourceChanged = Boolean(
    input.sourceSessionId && existing.sourceSessionId !== input.sourceSessionId,
  );
  const sourceUnchanged = !sourceChanged;
  const pageChanged = existing.page !== input.page;
  if (sourceUnchanged && !input.modeHint && !pageChanged) return tabs;

  return tabs.map((tab) => {
    if (tab.id !== input.tabId) return tab;
    const next: Tab = { ...tab };
    let bumpRevision = false;
    if (sourceChanged) {
      next.sourceSessionId = input.sourceSessionId;
      bumpRevision = true;
    }
    if (pageChanged) {
      next.page = input.page;
      bumpRevision = true;
    }
    if (input.modeHint) {
      next.initialDisplayMode = input.modeHint;
      next.viewerState = {
        displayMode: input.modeHint,
        wrapLines: tab.viewerState?.wrapLines ?? false,
        scrollTop: 0,
        scrollLeft: 0,
      };
      bumpRevision = true;
    }
    if (bumpRevision) next.viewerRevision = (tab.viewerRevision ?? 0) + 1;
    return next;
  });
}

export function saveWorkspaceFileViewerState(
  states: Map<string, FileWorkspaceState>,
  tabId: string,
  viewerRevision: number,
  viewerState: FileViewerState,
): void {
  for (const [key, workspace] of states) {
    const tabs = saveFileViewerState(workspace.tabs, tabId, viewerRevision, viewerState);
    if (tabs !== workspace.tabs) {
      states.set(key, { ...workspace, tabs });
      return;
    }
  }
}

export function saveFileViewerState(
  tabs: Tab[],
  tabId: string,
  viewerRevision: number,
  viewerState: FileViewerState,
): Tab[] {
  const index = tabs.findIndex((tab) => tab.id === tabId);
  if (index === -1 || (tabs[index].viewerRevision ?? 0) !== viewerRevision) return tabs;

  const next = [...tabs];
  next[index] = { ...next[index], viewerState };
  return next;
}
