import { environmentManager, QueryClient } from '@tanstack/query-core';

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
