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
		this.client.Guilds.sync();
		this.client.userGyms.sync();
		this.client.Stats.sync();
		this.client.LiveRaids.sync();

		this.client.user.setActivity('with bellends', { type: 'PLAYING' });
		console.log('I\'m ready!');
	}
}

module.exports = ReadyListener;
