import { useLiveInfiniteQuery } from '@tanstack/react-db';
import { createFileRoute } from '@tanstack/react-router';
import { useSyncExternalStore, useMemo } from 'react';
import { postsInfiniteQuery } from '#/features/pglite-demo/data.ts';
import { getCursor, subscribe } from '#/features/pglite-demo/cursor-store.ts';
import type { Post } from '#/features/pglite-demo/data.ts';

export const Route = createFileRoute('/demo/tanstack-db')({
	component: RouteComponent,
});

function CursorPanel() {
	const cursor = useSyncExternalStore(subscribe, getCursor);

	if (!cursor) return null;

	return (
		<div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 mb-4 text-xs font-mono">
			<details open>
				<summary className="cursor-pointer text-[var(--lagoon-deep)] font-semibold">
					Cursor Info (from loadSubsetOptions)
				</summary>
				<div className="mt-2 space-y-1 text-[var(--sea-ink-soft)]">
					<div>queryKey: {JSON.stringify(cursor.queryKey)}</div>
					<div>limit: {cursor.limit}, offset: {cursor.offset}</div>
					<div>
						hasCursor: {cursor.cursor ? '✅ yes' : '❌ no (first load)'}
					</div>
					{!!cursor.cursor && (
						<div className="border-t border-[var(--line)] pt-1 mt-1">
							<div className="text-[var(--kicker)] font-semibold mb-1">
								cursor:
							</div>
							<pre className="whitespace-pre-wrap break-all">
								{JSON.stringify(cursor.cursor, null, 2)}
							</pre>
						</div>
					)}
				</div>
			</details>
		</div>
	);
}

function RouteComponent() {
	const {
		pages,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isReady,
	} = useLiveInfiniteQuery(postsInfiniteQuery, { pageSize: 10 });

	const totalLoaded = useMemo(
		() => pages?.reduce((sum, p) => sum + p.length, 0) ?? 0,
		[pages],
	);
	const pageCount = pages?.length ?? 0;

	return (
		<div className="max-w-2xl mx-auto p-4">
			<h1 className="display-title text-3xl font-bold mb-6">
				Posts from PGlite
			</h1>
			<p className="text-sm text-[var(--sea-ink-soft)] mb-2">
				100 seeded posts — loaded via useLiveInfiniteQuery with 10 per page
			</p>

			<CursorPanel />

			<div className="flex gap-3 mb-4 text-xs text-[var(--sea-ink-soft)]">
				<span>
					Pages loaded:{' '}
					<strong className="text-[var(--sea-ink)]">{pageCount}</strong>
				</span>
				<span>
					Items:{' '}
					<strong className="text-[var(--sea-ink)]">{totalLoaded}</strong>
				</span>
				{isFetchingNextPage && (
					<span className="text-[var(--lagoon-deep)] animate-pulse">
						Loading more...
					</span>
				)}
			</div>

			{!isReady && isLoading && (
				<div className="flex justify-center py-12">
					<div className="animate-pulse text-[var(--sea-ink-soft)]">
						Loading...
					</div>
				</div>
			)}

			<div className="space-y-4">
				{pages?.map((page, i) => (
					<div key={i}>
						{(page as Post[]).map((post) => (
							<div
								key={post.id}
								className="feature-card rounded-xl p-5 mb-3 border border-[var(--line)]"
							>
								<h2 className="font-semibold text-lg text-[var(--sea-ink)]">
									{post.title}
								</h2>
								<p className="text-[var(--sea-ink-soft)] mt-2 leading-relaxed line-clamp-3">
									{post.body}
								</p>
								<p className="text-xs text-[var(--kicker)] mt-3">
									{new Date(post.created_at).toLocaleDateString(undefined, {
										year: 'numeric',
										month: 'short',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit',
									})}
								</p>
							</div>
						))}
					</div>
				))}
			</div>

			{hasNextPage && (
				<button
					type="button"
					onClick={fetchNextPage}
					disabled={isFetchingNextPage}
					className="w-full mt-6 py-3 rounded-xl font-medium text-white bg-[var(--lagoon-deep)] hover:bg-[var(--lagoon)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				>
					{isFetchingNextPage ? 'Loading...' : 'Load More'}
				</button>
			)}

			{!hasNextPage && isReady && (
				<p className="text-center text-sm text-[var(--sea-ink-soft)] mt-6">
					All posts loaded
				</p>
			)}
		</div>
	);
}
