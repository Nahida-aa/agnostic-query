/**
 * 核心逻辑：
 * 1. 取 T 的返回值 R
 * 2. 判断 R 是否还是一个函数？
 * 3. 如果是函数，递归取 R 的返回值；如果不是，返回 R
 */
export type Unpack<T> = T extends (...args: any[]) => infer R
	? R extends (...args: any[]) => any
		? Unpack<R>
		: R
	: T;
