import { useState } from 'react';
import { cn } from '#/lib/utils.ts';
import type { AdapterResult } from './adapters.ts';

type Tab = {
	id: string;
	label: string;
	run: (input: unknown) => AdapterResult;
};

type PreviewPanelProps = {
	tabs: Tab[];
	input: unknown;
	className?: string;
};

export function PreviewPanel({ tabs, input, className }: PreviewPanelProps) {
	const [active, setActive] = useState(0);
	const tab = tabs[active];
	const result = tab.run(input);

	return (
		<div className={cn('flex flex-col', className)}>
			<div className="flex border-b border-border overflow-x-auto">
				{tabs.map((t, i) => (
					<button
						key={t.id}
						onClick={() => setActive(i)}
						className={cn(
							'px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors',
							i === active
								? 'border-primary text-foreground font-semibold'
								: 'border-transparent text-muted-foreground hover:text-foreground',
						)}
					>
						{t.label}
					</button>
				))}
			</div>
			<div className="flex-1 overflow-auto p-4 font-mono text-sm">
				{result.status === 'ok' ? (
					<pre className="whitespace-pre-wrap text-green-600 dark:text-green-400">
						{result.value}
					</pre>
				) : (
					<pre className="whitespace-pre-wrap text-red-600 dark:text-red-400">
						{result.message}
					</pre>
				)}
			</div>
		</div>
	);
}
