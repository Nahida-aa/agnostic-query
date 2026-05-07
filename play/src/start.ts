// src/start.ts
import { createMiddleware, createStart } from '@tanstack/react-start';

const debugReqMiddleware = createMiddleware().server(
	async ({ request, next }) => {
		const startTime = Date.now();
		const timestamp = new Date().toISOString();

		console.log(`[${timestamp}] ${request.method} ${request.url} - Starting`);
		try {
			const result = await next();
			const duration = Date.now() - startTime;

			console.log(
				`[${timestamp}] ${request.method} ${request.url} - ${result.response.status} (${duration}ms)`,
			);
			if (process.env.NODE_ENV === 'development') {
				result.response.headers.set(
					'X-Debug-Timestamp',
					new Date().toISOString(),
				);
				result.response.headers.set('X-Debug-Node-Version', process.version);
				result.response.headers.set(
					'X-Debug-Uptime',
					process.uptime().toString(),
				);
			}

			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(
				`[${timestamp}] ${request.method} ${request.url} - Error (${duration}ms):`,
				error,
			);
			throw error;
		}
	},
);

const debugMiddleware = createMiddleware({ type: 'function' }).server(
	async ({ method, data, serverFnMeta, next }) => {
		const startTime = new Date();
		const startTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}:${startTime.getSeconds().toString().padStart(2, '0')}.${startTime.getMilliseconds().toString().padStart(3, '0')}`;
		console.log(
			`[${startTimeStr}] Calling function ${method} ${serverFnMeta.name} with data:`,
			data,
		);
		const result = await next();
		const endTime = new Date();
		const duration = endTime.getTime() - startTime.getTime();
		const endTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}:${startTime.getSeconds().toString().padStart(2, '0')}.${startTime.getMilliseconds().toString().padStart(3, '0')}`;
		console.log(
			`[${endTimeStr}] Function ${serverFnMeta.name} return (${duration}ms)`,
		);
		return result;
	},
);
// 全局中间件
export const startInstance = createStart(() => {
	return {
		// requestMiddleware: [debugReqMiddleware],
		functionMiddleware: [debugMiddleware],
		defaultSsr: 'data-only',
	};
});
