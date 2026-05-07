import { environmentManager, QueryClient } from '@tanstack/query-core';
import { getRouter } from '#/router.tsx';

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
			},
		},
	});
}

let browserQueryClient: QueryClient | undefined;

export const getQueryClient = () => {
	if (environmentManager.isServer()) {
		return makeQueryClient();
	} else {
		if (!browserQueryClient) browserQueryClient = makeQueryClient();
		return browserQueryClient;
	}
};

export const getContextQC = () => getRouter().options.context.queryClient;
