const { Listener } = require('discord-akairo');
const { Permissions } = require('discord.js');

const chanName = require('../functions/isolateNames.js');
const chanList = require('../functions/findGyms.js');
const multiResult = require('../functions/multiResult.js');
const prodOut = require('../functions/prodOut.js');
const stats = require('../functions/writeStats.js');
const saveRaids = require('../functions/saveRaids.js');

function waitUp(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

class ChannelCreateListener extends Listener {
	constructor() {
		super('channelCreate', {
			emitter: 'client',
			event: 'channelCreate',
		});
	}

	async exec(channel) {

		if(!channel.guild || channel.type != 'text') return;
		const perm = new Permissions(channel.permissionsFor(channel.guild.me));
		if(!perm.has('VIEW_CHANNEL')) return console.log(`Channel ${channel.name} created in ${channel.guild.name} without view channel perms, aborting.`);


		let results = [];
		const delay = 5 * 1000;
		let found = false;

		// eslint-disable-next-line prefer-const
		let [channel_gym, pokemon] = chanName.getChanGym(channel);
		console.log(`New channel created with the name ${channel.name}`);

		if(!channel_gym) {
			console.log(`Could not match a gym pattern for ${channel.name}`);
			return;
		}

		// From here on, we *should* only have the gym name
		let gym = await this.client.Gyms.findOne({
			where: {
				guildId: channel.guild.id,
				gymName: channel_gym,
			},
		});
		if(!gym) {
			const func_return = await chanList.getGymNames(this.client, channel_gym);
			results = func_return[0];
			found = func_return[1];
		}
		else {
			found = true;
		}
		// results is an array of gym objects, let loop through those to see if any "discord sanitized" channel name is found first.
		const filterResults = results.filter(gymMatch => {
			return gymMatch.gymName.replace(/[-]+/g, ' ').replace(/[^a-zA-Z0-9\s]+/g, '') == channel_gym;
		});
		if(filterResults.length == 1) {
			gym = filterResults[0];
			channel_gym = gym.gymName.replace(/[^a-zA-Z0-9-\s]+/g, '');
		}
		else {
			const tmp = results.filter(gymMatch => {
				const temp = channel_gym.split(' ');
				temp.shift();
				return gymMatch.gymName.replace(/[-\\]+/g, ' ').replace(/[^a-zA-Z0-9\s]+/g, '') == temp.join(' ');
			});
			if(tmp.length == 1) {
				gym = tmp[0];
				channel_gym = gym.gymName.replace(/[^a-zA-Z0-9-\s]+/g, '');
			}
		}

		if(found) {
			// Wait a given time to make sure Meowth has time to post
			await waitUp(delay);

			// The below runs only after the delay
			const messages = await channel.messages.fetch();
			const first = messages.last();

			// If there is still no first message, wait the delayed amount again
			if(!first || !first.author.bot) await waitUp(delay);

			let author_id = '';
			let author_mention = '';
			if(first && first.mentions.users.first()) {
				author_id = first.mentions.users.first().id;
				author_mention = ` <@${author_id}> `;
			}

			if(results.length > 1 && !gym) {
				const f_r = await multiResult.doQuery(author_mention, results, channel_gym, channel);

				// f_r[3] is basically an abort boolean
				if(f_r[3] == true) return undefined;

				results = f_r[0];
				gym = f_r[1];
				channel_gym = f_r[2];
			}
			// At this point channel_gym will be the 'valid' gym name

			// This doesn't need to resolve before the rest can go, so no await
			stats.writeStats(this.client, channel_gym, channel.guild.id, pokemon);
			saveRaids.saveLiveRaids(channel, channel_gym, gym);

			const fi_r = await prodOut.produceOut(gym, channel, channel_gym, author_id);
			const final_return = fi_r[0];
			channel_gym = fi_r[1];

			return channel.send(final_return, { split: { maxLength: 1900, char: ',' } });
		}
		else {
			console.log(`Found nothing for ${channel_gym}.`);
		}
	}
}

module.exports = ChannelCreateListener;
