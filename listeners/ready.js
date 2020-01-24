const { Listener } = require('discord-akairo');
const cron = require('node-cron');

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
		client.pokestops.sync();
		client.rocketLeaders.sync();
		client.Memory.sync();

		client.user.setActivity('with Samerz\'s head', { type: 'PLAYING' });
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

		cron.schedule('00 00 * * *', async () => {
			try {
				await client.rocketLeaders.destroy({
					where: {},
				});
				console.log('cleared rocket leaders at midnight');
			}
			catch(e) {
				console.log(e);
				console.log('Error in cleaning up rocket leaders.');
			}
			// ----------------------------------------------

			const liveRaids = await client.LiveRaids.findAll();

			// Grab channels that no longer exist, or are now archived
			const invalidChannels = liveRaids.map(x => x.dataValues.channelId).filter(chan => {
				if(!client.channels.has(chan) || (client.channels.get(chan).name.startsWith('archived'))) return;
			});

			// Said channels (raids) are now removed from live db
			invalidChannels.forEach(chan => {
				client.LiveRaids.destroy({ where:{ channelId:chan } });
			});
			console.log(`Removed ${invalidChannels.length} entries from live raids database.`);
		});
	}
}

module.exports = ReadyListener;
