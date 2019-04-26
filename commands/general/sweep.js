const { Command } = require('discord-akairo');

class SweepCommand extends Command {
	constructor() {
		super('sweep', {
			aliases: ['sweep'],
			category: 'general',
			description: {
				content: 'Sweeps through existing live raids in database and checks if they are still valid.',
				usage: '',
			},
		});
	}

	async exec(message) {
		const liveRaids = await this.client.LiveRaids.findAll();
		const liveChannels = liveRaids.map(x => x.dataValues.channelId);
		const invalidChannels = [];
		liveChannels.forEach(chan => {
			if(message.guild.channels.has(chan)) {
				if(message.guild.channels.get(chan).name.startsWith('archived')) {
					invalidChannels.push(chan);
				}
			}
			else {
				invalidChannels.push(chan);
			}
		});
		invalidChannels.forEach(chan => {
			this.client.LiveRaids.destroy({ where:{ channelId:chan } });
		});
		message.channel.send(`Removed ${invalidChannels.length} entries from live raids database.`);
	}
}

module.exports = SweepCommand;
