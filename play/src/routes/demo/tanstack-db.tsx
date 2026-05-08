import { useLiveInfiniteQuery, useLiveQuery } from '@tanstack/react-db';
import { createFileRoute } from '@tanstack/react-router';
import { demoQuery } from '#/features/play/data.ts';

export const Route = createFileRoute('/demo/tanstack-db')({
	component: RouteComponent,
});

function RouteComponent() {
	useLiveQuery(demoQuery);
	return <div>Hello "/demo/tanstack-db"!</div>;
}
