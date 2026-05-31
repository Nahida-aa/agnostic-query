export type Db = {
	prepare: (sql: string) => {
		all: (...params: any[]) => Promise<unknown[]> | unknown[];
	};
};
