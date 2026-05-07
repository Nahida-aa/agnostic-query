import { useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { cn } from '#/lib/utils.ts';

type EditorPanelProps = {
	value: string;
	onChange: (value: string) => void;
	className?: string;
};

export function EditorPanel({ value, onChange, className }: EditorPanelProps) {
	const editorRef = useRef<Parameters<OnMount>[0]>(null);

	const handleMount: OnMount = (editor) => {
		editorRef.current = editor;
	};

	return (
		<div className={cn('flex flex-col', className)}>
			<Editor
				height="100%"
				defaultLanguage="json"
				theme="vs-dark"
				value={value}
				onChange={(v) => onChange(v ?? '')}
				onMount={handleMount}
				options={{
					minimap: { enabled: false },
					fontSize: 13,
					lineNumbers: 'on',
					scrollBeyondLastLine: false,
					padding: { top: 12, bottom: 12 },
					tabSize: 2,
				}}
			/>
		</div>
	);
}
