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
		this.client.Config.sync();
		this.client.Announcements.sync();

		this.client.user.setActivity('with bellends', { type: 'PLAYING' });
		console.log('I\'m ready!');
	}
}

module.exports = ReadyListener;
