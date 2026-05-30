export type Db = {
	prepare: (sql: string) => {
		all: <T>(...params: any[]) => Promise<T[]>;
	};
};
