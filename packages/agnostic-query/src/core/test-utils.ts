export type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
export type Expect<T extends true> = T
export type ExpectExtends<A, B> = A extends B ? true : false
