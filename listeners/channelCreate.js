const { Listener } = require('discord-akairo');
const config = require('../config.json');

class ChannelCreateListener extends Listener {
	constructor() {
		super('channelCreate', {
			emitter: 'client',
			event: 'channelCreate',
		});
	}

	async exec(channel) {
		const channel_gym = channel.name.split('-').slice(1).join(' ');

		const gym = await this.client.Gyms.findOne({
			where: {
				GymName: channel_gym,
			},
		});
		if(gym) {
			const affectedRows = await this.client.Gyms.update(
				{ timesPinged: gym.timesPinged + 1 },
				{ where : { GymName: channel_gym } },
			);
			if(affectedRows <= 0) console.log(`Error incrementing for gym ${channel_gym}`);
			const users_arr = gym.userIds.split(',').map(id => `<@${id}>`);

			this.client.channels.get('511235860625096726').send(`🔔🔔🔔\nBONG!\nA raid has just called for the gym \`${channel_gym}\`.\nConsider ye selves notified!\n🔔🔔🔔\n${users_arr.join(',')}\n\nIf you wish to no longer be notified for this gym, please type \`${config.prefix}remove ${channel_gym}\``, { split: true });
		}
		else {
			console.log('moop');
		}
	}
}

module.exports = ChannelCreateListener;
