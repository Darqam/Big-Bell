const { Listener } = require('discord-akairo');

const chanName = require('../functions/isolateNames.js');
const chanList = require('../functions/findGyms.js');
const multiResult = require('../functions/multiResult.js');
const prodOut = require('../functions/prodOut.js');
const stats = require('../functions/writeStats.js');

class ChannelCreateListener extends Listener {
	constructor() {
		super('channelCreate', {
			emitter: 'client',
			event: 'channelCreate',
		});
	}

	async exec(channel) {

		if(!channel.guild) return;
		// Figure out which channel to send this to
		let send_chan = await this.client.Config.findOne({
			where: { guildId: channel.guild.id },
		});
		// If there is nothing configured for this guild, do nothing
		if(!send_chan) return console.log('No configs set, returning.');
		else send_chan = this.client.channels.get(send_chan.announcementChan);

		let results = [];
		const delay = 5 * 1000;
		let found = false;
		let selection_done = false;

		let channel_gym = chanName.getChanGym(channel);
		console.log(`New channel created with the name ${channel.name}`);

		if(!channel_gym) {
			console.log(`Could not match a gym pattern for ${channel.name}`);
			return;
		}

		// From here on, we *should* only have the gym name
		let gym = await this.client.Gyms.findOne({
			where: {
				GymName: channel_gym,
			},
		});
		if(!gym) {
			const func_return = await chanList.getGymNames(this.client, channel_gym);
			results = func_return[0];
			found = func_return[1];
			gym = func_return[2];
			channel_gym = func_return[3];
		}
		else {
			found = true;
		}

		if(found) {
			setTimeout(async () => {
				// This is run X seconds after channel create to give meowth time to post
				const messages = await channel.messages.fetch();
				const first = messages.last();

				let author_id = '';
				let author_mention = '';
				if(first && first.mentions.users.first()) {
					author_id = first.mentions.users.first().id;
					author_mention = ` <@${author_id}> `;
				}

				if(results.length > 1) {
					const f_r = await multiResult.doQuery(author_mention, results, gym, channel_gym, send_chan, selection_done);

					results = f_r[0];
					gym = f_r[1];
					channel_gym = f_r[2];
					selection_done = f_r[3];
				}
				// At this point channel_gym will be the 'valid' gym name

				// This doesn't need to resolve before the rest can go, so no await
				stats.writeStats(this.client, channel_gym);

				const fi_r = await prodOut.produceOut(gym, channel, channel_gym, selection_done, author_id, send_chan);
				const final_return = fi_r[0];
				channel_gym = fi_r[1];

				return send_chan.send(final_return, { split: { maxLength: 1900, char: ',' } });
			}, delay);
		}
		else {
			console.log(`Found nothing for ${channel_gym}.`);
		}
	}
}

module.exports = ChannelCreateListener;
