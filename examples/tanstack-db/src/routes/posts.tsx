import { useLiveInfiniteQuery } from '@tanstack/react-db';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { seedProjects } from '#/features/project/project.fn.ts';
import { infiniteProjectQuery } from '#/features/project/project.sync.ts';

export const Route = createFileRoute('/posts')({
	component: RouteComponent,
});

function RouteComponent() {
	const [seeding, setSeeding] = useState(false);

	useEffect(() => {
		setSeeding(true);
		seedProjects()
			.then((r) => console.log('[infinite] seeded:', r))
			.finally(() => setSeeding(false));
	}, []);

	const {
		pages,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isReady,
	} = useLiveInfiniteQuery(infiniteProjectQuery, { pageSize: 10 });

	const totalLoaded = pages?.reduce((s, p) => s + p.length, 0) ?? 0;
	const pageCount = pages?.length ?? 0;

	console.log('[infinite] render:', {
		isReady,
		isLoading,
		pageCount,
		totalLoaded,
		hasNextPage,
	});

	return (
		<div className="max-w-2xl mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">useLiveInfiniteQuery Demo</h1>

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
				{seeding && <span className="animate-pulse">Seeding DB...</span>}
			</div>

			{!isReady && isLoading && (
				<div className="py-8 text-center">Loading...</div>
			)}

			<div className="space-y-3">
				{pages?.map((page, i) => (
					<div key={i}>
						{page.map((p: any) => (
							<div key={p.id} className="border rounded-lg p-4">
								<h2 className="font-semibold">{p.name}</h2>
								<p className="text-xs text-gray-500">
									{p.created_at?.toLocaleString() ?? p.created_at}
								</p>
							</div>
						))}
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
