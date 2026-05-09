import { useState, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { EditorPanel } from '#/components/playground/editor-panel.tsx';
import { PreviewPanel } from '#/components/playground/preview-panel.tsx';
import { defaultWhere, defaultTanStack } from '#/components/playground/default-where.ts';
import { fromTanDbWhere, type FromTanDbWhereParam } from 'agnostic-query/tanstack-db';
import {
	runSqlString,
	runDb0,
	runZod,
	runValibot,
	runDrizzle,
	runFromTanDbWhere,
	runQueryWhereJson,
} from '#/components/playground/adapters.ts';

export const Route = createFileRoute('/')({ component: Home });

type Format = 'query-where' | 'tanstack';

function Home() {
	const [format, setFormat] = useState<Format>('query-where');
	const [json, setJson] = useState(defaultWhere);

	const input = useMemo(() => {
		try {
			return JSON.parse(json);
		} catch {
			return null;
		}
	}, [json]);

	const handleFormatChange = (f: Format) => {
		setFormat(f);
		setJson(f === 'tanstack' ? defaultTanStack : defaultWhere);
	};

	const tabs = useMemo(() => {
		if (format === 'tanstack') {
			return [
				{ id: 'tanstack-json', label: 'QueryWhere JSON', run: runFromTanDbWhere },
				{ id: 'sql', label: 'SQL', run: (i: unknown) => runSqlString(fromTanDbWhere(i as any) as any) },
				{ id: 'db0', label: 'db0', run: (i: unknown) => runDb0(fromTanDbWhere(i as any) as any) },
				{ id: 'zod', label: 'Zod', run: (i: unknown) => runZod(fromTanDbWhere(i as any) as any) },
				{ id: 'drizzle', label: 'Drizzle', run: (i: any) => runDrizzle(fromTanDbWhere(i) ?? undefined) },
			];
		}
		return [
			{ id: 'json', label: 'JSON', run: runQueryWhereJson },
			{ id: 'sql', label: 'SQL', run: runSqlString },
			{ id: 'db0', label: 'db0', run: runDb0 },
			{ id: 'zod', label: 'Zod', run: runZod },
			{ id: 'valibot', label: 'Valibot', run: runValibot },
			{ id: 'drizzle', label: 'Drizzle', run: runDrizzle },
		];
	}, [format]);

	return (
		<div className="h-dvh flex">
			<div className="w-1/2 border-r border-border flex flex-col">
				<div className="flex items-center gap-2 border-b border-border px-4 py-2">
					<button
						onClick={() => handleFormatChange('query-where')}
						className={`px-3 py-1 text-xs rounded-full border transition-colors ${
							format === 'query-where'
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-transparent text-muted-foreground border-border hover:text-foreground'
						}`}
					>
						QueryWhere
					</button>
					<button
						onClick={() => handleFormatChange('tanstack')}
						className={`px-3 py-1 text-xs rounded-full border transition-colors ${
							format === 'tanstack'
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-transparent text-muted-foreground border-border hover:text-foreground'
						}`}
					>
						TanStack DB
					</button>
				</div>
				<EditorPanel
					className="flex-1"
					value={json}
					onChange={setJson}
				/>
			</div>
			<PreviewPanel
				className="w-1/2"
				tabs={tabs}
				input={input}
			/>
		</div>
	);
}
