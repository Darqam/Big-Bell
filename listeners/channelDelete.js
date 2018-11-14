const { Listener } = require('discord-akairo');

class ChannelDeleteListener extends Listener {
	constructor() {
		super('channelDelete', {
			emitter: 'client',
			event: 'channelDelete',
		});
	}

	async exec(channel) {
		const channelConfig = await channel.client.Announcements.findOne({
			where: {
				channelId: channel.id,
			},
		});
		if(channelConfig) {
			const rowCount = await channel.client.Announcements.destroy({ where:
				{ channelId: channel.id },
			});
			if(!rowCount) return console.log('Could not delete channel from pinged database for some reason.');
			else return console.log('Deleted channel from pinged database.');
		}
		return console.log('Channel was deleted, not held within ping database.');
	}
}

module.exports = ChannelDeleteListener;
