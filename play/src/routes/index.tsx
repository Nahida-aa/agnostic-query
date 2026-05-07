import { useState, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { EditorPanel } from '#/components/playground/editor-panel.tsx';
import { PreviewPanel } from '#/components/playground/preview-panel.tsx';
import { defaultWhere } from '#/components/playground/default-where.ts';
import {
	runSqlString,
	runDb0,
	runZod,
	runValibot,
	runDrizzle,
} from '#/components/playground/adapters.ts';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
	const [json, setJson] = useState(defaultWhere);

	const input = useMemo(() => {
		try {
			return JSON.parse(json);
		} catch {
			return null;
		}
	}, [json]);

	const tabs = [
		{ id: 'sql', label: 'SQL', run: runSqlString },
		{ id: 'db0', label: 'db0', run: runDb0 },
		{ id: 'zod', label: 'Zod', run: runZod },
		{ id: 'valibot', label: 'Valibot', run: runValibot },
		{ id: 'drizzle', label: 'Drizzle', run: runDrizzle },
	];

	return (
		<div className="h-dvh flex">
			<EditorPanel
				className="w-1/2 border-r border-border"
				value={json}
				onChange={setJson}
			/>
			<PreviewPanel
				className="w-1/2"
				tabs={tabs}
				input={input}
			/>
		</div>
	);
}
