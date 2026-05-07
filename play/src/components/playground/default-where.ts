export const defaultTanStack = JSON.stringify(
	{
		type: 'func',
		name: 'and',
		args: [
			{
				type: 'func',
				name: 'eq',
				args: [
					{ type: 'ref', path: ['name'] },
					{ type: 'val', value: 'Alice' },
				],
			},
			{
				type: 'func',
				name: 'gt',
				args: [
					{ type: 'ref', path: ['age'] },
					{ type: 'val', value: 18 },
				],
			},
			{
				type: 'func',
				name: 'or',
				args: [
					{
						type: 'func',
						name: 'eq',
						args: [
							{ type: 'ref', path: ['role'] },
							{ type: 'val', value: 'admin' },
						],
					},
					{
						type: 'func',
						name: 'eq',
						args: [
							{ type: 'ref', path: ['role'] },
							{ type: 'val', value: 'moderator' },
						],
					},
				],
			},
		],
	},
	null,
	2,
);

export const defaultWhere = JSON.stringify(
	{
		operator: 'and',
		conditions: [
			{ field: 'name', operator: 'eq', conditions: 'Alice' },
			{ field: 'age', operator: 'gt', conditions: 18 },
			{
				operator: 'or',
				conditions: [
					{ field: 'role', operator: 'eq', conditions: 'admin' },
					{ field: 'role', operator: 'eq', conditions: 'moderator' },
				],
			},
		],
	},
	null,
	2,
);
