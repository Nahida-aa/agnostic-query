export type CursorSnapshot = {
	cursor: unknown;
	queryKey: unknown;
	limit: number | undefined;
	offset: number | undefined;
	timestamp: number;
};

let snapshot: CursorSnapshot | null = null;
const listeners = new Set<() => void>();

export function setCursor(info: CursorSnapshot) {
	snapshot = info;
	listeners.forEach((fn) => fn());
}

export function getCursor(): CursorSnapshot | null {
	return snapshot;
}

export function subscribe(fn: () => void) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
