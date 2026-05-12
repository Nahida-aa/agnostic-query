import { queryOnce, useLiveInfiniteQuery } from '@tanstack/react-db';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { clearProjects, seedProjects } from '#/features/project/project.fn.ts';
import { infiniteProjectQuery } from '#/features/project/project.sync.ts';

export const Route = createFileRoute('/')({
	loader: () => {
		// queryOnce((q) => infiniteProjectQuery(q).limit(10));
	},
	component: Home,
});

function Home() {
	const [busy, setBusy] = useState<'seed' | 'clear' | null>(null);

	const {
		pages,
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isReady,
	} = useLiveInfiniteQuery(infiniteProjectQuery, {
		pageSize: 10,
	});

	const totalLoaded = pages?.reduce((s, p) => s + p.length, 0) ?? 0;
	const pageCount = pages?.length ?? 0;

	return (
		<div className="max-w-2xl mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">useLiveInfiniteQuery Demo</h1>

			<div className="flex gap-2 mb-4">
				<button
					type="button"
					disabled={busy !== null}
					onClick={async () => {
						setBusy('seed');
						const r = await seedProjects();
						console.log('[seed]', r);
						setBusy(null);
					}}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white disabled:opacity-40"
				>
					{busy === 'seed' ? 'Seeding...' : 'Seed 100 Rows'}
				</button>
				<button
					type="button"
					disabled={busy !== null}
					onClick={async () => {
						setBusy('clear');
						const r = await clearProjects();
						console.log('[clear]', r);
						setBusy(null);
					}}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white disabled:opacity-40"
				>
					{busy === 'clear' ? 'Clearing...' : 'Clear All'}
				</button>
			</div>

			<div className="flex gap-3 mb-4 text-sm">
				<span>
					Pages: <strong>{pageCount}</strong>
				</span>
				<span>
					Items: <strong>{totalLoaded}</strong>
				</span>
				{isFetchingNextPage && (
					<span className="animate-pulse">Loading...</span>
				)}
			</div>

			{!isReady && isLoading && (
				<div className="py-8 text-center">Loading...</div>
			)}

			<div className="space-y-3">
				{data?.map((p, i) => (
					<div key={p.id} className="border rounded-lg p-4">
						<div className="flex items-start justify-between gap-2">
							<div>
								<h2 className="font-semibold">{p.name}</h2>
								<p className="text-xs text-gray-500">
									{p.created_at?.toLocaleString() ?? p.created_at}
								</p>
							</div>
							{p.tags && p.tags.length > 0 && (
								<div className="flex flex-wrap gap-1 shrink-0">
									{p.tags.map((t) => (
										<span
											key={t}
											className={`text-xs px-2 py-0.5 rounded-full ${
												t === 'test'
													? 'bg-green-100 text-green-700'
													: 'bg-gray-100 text-gray-600'
											}`}
										>
											{t}
										</span>
									))}
								</div>
							)}
						</div>
					</div>
				))}
			</div>

			{hasNextPage && (
				<button
					type="button"
					onClick={() => fetchNextPage()}
					disabled={isFetchingNextPage}
					className="w-full mt-6 py-3 rounded-lg font-medium bg-blue-600 text-white disabled:opacity-40"
				>
					{isFetchingNextPage ? 'Loading...' : 'Load More'}
				</button>
			)}

			{!hasNextPage && isReady && (
				<p className="text-center text-sm mt-6">All loaded</p>
			)}
		</div>
	);
}
