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

			const send_chan = await this.client.Config.findOne({
				where: { guildId: channel.guild.id },
			});
			// If there is nothing configured for this guild, do nothing
			if(!send_chan) return console.log('No configs set, returning.');

			setTimeout(async () => {
				// This is run 20 seconds after channel create to give meowth time to post
				const messages = await channel.messages.fetch();
				const first = messages.last();

				const author_id = first.mentions.users.first().id;

				const users_arr = gym.userIds.split(',').filter(id => id != author_id).map(id => `<@${id}>`);

				this.client.channels.get('511235860625096726').send(`🔔🔔🔔\nBONG!\nA raid has just called for the gym \`${channel_gym}\` in ${channel}.\nConsider ye selves notified!\n🔔🔔🔔\n${users_arr.join(',')}\n\nIf you wish to no longer be notified for this gym, please type \`${config.prefix}remove ${channel_gym}\``, { split: true });
			}, 20000);
		}
		else {
			console.log('moop');
		}
	}
}

module.exports = ChannelCreateListener;
