export interface TerminalTab {
  id: string;
  cwd: string;
  restored?: boolean;
  closing?: "close" | "restart";
}

export const TERMINAL_TABS_KEY = "pi-web:terminal-tabs";

export function newTerminalTab(cwd: string): TerminalTab {
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { id, cwd };
}

export function restoreTerminalTabs(raw: string | null): { tabs: TerminalTab[]; activeId: string | null; open: boolean } {
  try {
    const saved = JSON.parse(raw ?? "null");
    const tabs: TerminalTab[] = [];
    for (const tab of Array.isArray(saved?.tabs) ? saved.tabs : []) {
      if (tab && typeof tab.id === "string" && /^[a-f0-9]{32}$/.test(tab.id)
        && typeof tab.cwd === "string" && tab.cwd.trim()
        && !tabs.some((existing) => existing.id === tab.id)) {
        tabs.push({ id: tab.id, cwd: tab.cwd, restored: true });
      }
    }
    return { tabs, activeId: tabs.some((tab) => tab.id === saved.activeId) ? saved.activeId : null, open: saved?.open === true };
  } catch {
    return { tabs: [], activeId: null, open: false };
  }
}

/** Tab labels: a folder's name, numbered from its second terminal on ("app (2)"). */
export function terminalTabLabels(tabs: readonly TerminalTab[], name: (cwd: string) => string): Map<string, string> {
  const seen = new Map<string, number>();
  const labels = new Map<string, string>();
  for (const tab of tabs) {
    const count = (seen.get(tab.cwd) ?? 0) + 1;
    seen.set(tab.cwd, count);
    labels.set(tab.id, count === 1 ? name(tab.cwd) : `${name(tab.cwd)} (${count})`);
  }
  return labels;
}
