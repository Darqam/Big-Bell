const { Listener } = require('discord-akairo');

class ReadyListener extends Listener {
	constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready',
			type: 'once',
		});
	}

	async exec() {
		// this.client.Gyms.sync({ force:true });
		const client = this.client;
		client.Gyms.sync();
		client.Guilds.sync();
		client.userGyms.sync();
		client.Announcements.sync();
		client.Stats.sync();
		client.LiveRaids.sync();
		client.Memory.sync();

		client.user.setActivity('with bellends', { type: 'PLAYING' });
		console.log('I\'m ready!');

		setInterval(async () => {
			try{
				await client.Memory.create({
					timestamp: new Date().getTime(),
					memory: process.memoryUsage().heapUsed,
					botUptime: client.uptime,
					processUptime: process.uptime() * 1000,
				});
			}
			catch(e) {
				console.log(e);
			}
		}, 900000);
	}
}

module.exports = ReadyListener;
