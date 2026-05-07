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
