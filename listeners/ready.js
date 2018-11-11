const { Listener } = require('discord-akairo');

class ReadyListener extends Listener {
	constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready',
			type: 'once',
		});
	}

	exec() {
		// this.client.Gyms.sync({ force:true });
		this.client.Gyms.sync();
		console.log('I\'m ready!');
	}
}

module.exports = ReadyListener;
