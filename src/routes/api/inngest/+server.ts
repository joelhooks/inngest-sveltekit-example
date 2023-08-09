import { serve } from '../../../inngest/svelte';
import { inngest } from '$lib/inngest.client';

const helloWorld = inngest.createFunction(
	{ name: 'Hello World' },
	{ event: 'test/hello.world' },
	async ({ event, step }) => {
		await step.sleep('1s');
		return { event, body: 'Hello, World!' };
	}
);

export const { GET, POST, PUT } = serve(inngest, [helloWorld]);
