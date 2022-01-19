// WordPress dependencies

const { select } = wp.data;
const { apiFetch } = wp;

// example of using 'middleware' to emulate a request to the server
// and return the result we need
const emulateRequest = true;
const { getCurrentPost } = select('core/editor');
apiFetch.use((options, next) => {
	if(emulateRequest) {
		window.console.log('?apiFetch - emulate some kind of request');
		const data = getCurrentPost();
		// const result = next(options);
		return sendSuccessResponse({ body: data });
	}
	return next(options);
});

// helper function that sends a success response
function sendSuccessResponse(responseData) {
	return Promise.resolve(
		new window.Response(
			JSON.stringify(responseData.body),
			{
				status: 200,
				statusText: 'OK',
				headers: responseData.headers ?? {},
			}
		)
	);
}
