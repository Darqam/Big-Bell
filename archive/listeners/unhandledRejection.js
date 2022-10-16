const { Listener } = require('discord-akairo');

class UnhandledRejectionListener extends Listener {
	constructor() {
		super('unhandledRejection', {
			emitter: 'client',
			event: 'unhandledRejection',
		});
	}

	exec(error) {
		console.error('Unhandled Rejection: \n', error);
	}
}

module.exports = UnhandledRejectionListener;
