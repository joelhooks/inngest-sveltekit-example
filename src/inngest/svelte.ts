import { InngestCommHandler, type ServeHandler, headerKeys, queryKeys } from 'inngest';

const allProcessEnv = (): Record<string, string | undefined> => {
	try {
		// eslint-disable-next-line @inngest/process-warn
		if (process.env) {
			// eslint-disable-next-line @inngest/process-warn
			return process.env;
		}
	} catch (_err) {
		// noop
	}

	return {};
};

const processEnv = (key: string): string | undefined => {
	return allProcessEnv()[key];
};

export const name = 'sveltekit';

export const serve: ServeHandler = (nameOrInngest, fns, opts) => {
	const handler = new InngestCommHandler(
		name,
		nameOrInngest,
		fns,
		opts,
		(method: string, event) => {
			const protocol = processEnv('NODE_ENV') === 'development' ? 'http' : 'https';
			const url = new URL(
				event.request.url,
				`${protocol}://${event.request.headers.get('host') || ''}`
			);

			console.log(event.query);
			const query = Object.fromEntries(url.searchParams.entries());

			console.log(query);

			return {
				url,
				run: async () => {
					if (method === 'POST') {
						return {
							fnId: url.searchParams.get(queryKeys.FnId) as string,
							stepId: url.searchParams.get(queryKeys.StepId) as string,
							data: (await event.request.json()) as Record<string, unknown>,
							signature: event.request.headers.get(headerKeys.Signature) || undefined
						};
					}
				},
				register: () => {
					if (method === 'PUT') {
						return {
							deployId: url.searchParams.get(queryKeys.DeployId)
						};
					}
				},
				view: () => {
					if (method === 'GET') {
						return {
							isIntrospection: url.searchParams.has(queryKeys.Introspect)
						};
					}
				}
			};
		},
		({ body, headers, status }) => {
			return new Response(body, { status, headers });
		}
	);

	console.log('handler', handler.createHandler());

	const fn = handler.createHandler();

	return Object.defineProperties(fn.bind(null, undefined), {
		GET: { value: fn.bind(null, 'GET') },
		POST: { value: fn.bind(null, 'POST') },
		PUT: { value: fn.bind(null, 'PUT') }
	});
};
