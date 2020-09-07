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
			channelRestriction: 'guild',
		});
	}

	async exec(message) {
		const liveRaids = await this.client.LiveRaids.findAll({
			where: {
				guildId: message.guild.id,
			},
		});

		// Grab all the ids from the liveRaids into an array then,
		// if the channel doesn't exist, or it exists but starts with 'archived' sort it as invalid
		const invalidChannels = liveRaids.map(x => x.dataValues.channelId).filter(chan => {
			if(!message.guild.channels.cahce.has(chan) || (message.guild.channels.cache.get(chan).name.startsWith('archived'))) return;
		});

		invalidChannels.forEach(chan => {
			this.client.LiveRaids.destroy({ where:{ channelId:chan } });
		});
		message.channel.send(`Removed ${invalidChannels.length} entries from live raids database.`);
	}
}

module.exports = SweepCommand;
