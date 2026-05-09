export type UserShape = {
	id: string;
	name: string;
	age: number;
	tags: string[];
	addr: {
		city: string;
	}
}

export interface DB {
	user: UserShape;
}

