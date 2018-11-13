const { Listener } = require('discord-akairo');
const config = require('../config.json');
let pokemons = require('../pokemons.json');
const FuzzySearch = require('fuzzy-search');

class ChannelCreateListener extends Listener {
	constructor() {
		super('channelCreate', {
			emitter: 'client',
			event: 'channelCreate',
		});
	}

	async exec(channel) {
		pokemons = pokemons.map(p => p.toLowerCase());
		// Let's start isolating channel name here

		// Case 1, regular raid. Assume format pokemonName-gym-name-here
		let channel_gym = '';
		let egg = false;
		const delay = 5 * 1000;
		let found = false;
		const channel_array = channel.name.split('-');

		// There is only (so far) a few pokemons with `-` in their name,
		// when they do it's only there once
		if(pokemons.includes(channel_array[0])) {
			channel_gym = channel_array.slice(1).join(' ');
		}
		else if(pokemons.includes(channel_array[0] + '-' + channel_array[1])) {
			channel_gym = channel_array.slice(2).join(' ');
		}

		// Case 2, raid egg. Assume format level-X-egg-park-name
		if(channel_gym == '' && channel_array[0].toLowerCase() == 'level' && channel_array[2].toLowerCase() == 'egg') {
			channel_gym = channel_array.slice(3).join(' ');
			egg = true;
		}

		if(!channel_gym) {
			console.log(`Could not match a pattern for ${channel.name}`);
			return;
		}

		// From here on, we *should* only have the gym name
		let gym = await this.client.Gyms.findOne({
			where: {
				GymName: channel_gym,
			},
		});
		if(!gym) {
			// If the gym wasn't found with an exact match, pull all entries
			// from the database
			const gymList = await this.client.Gyms.findAll({ attributes: ['GymName', 'userIds', 'timesPinged'] });

			const searcher = new FuzzySearch(gymList, ['GymName'], {
				caseSensitive: true,
				sort: true,
			});

			const results = searcher.search(channel_gym);
			if(results.length > 0) {
				found = true;
				// CHANGE THIS
				gym = results[0];
				channel_gym = results[0].GymName;
			}
		}
		else {
			console.log('moop');
			found = true;
		}

		if(found) {
			// Purely for fun
			const affectedRows = await this.client.Gyms.update(
				{ timesPinged: gym.timesPinged + 1 },
				{ where : { GymName: channel_gym } },
			);
			if(affectedRows <= 0) console.log(`Error incrementing for gym ${channel_gym}`);

			// Figure out which channel to send this to
			const send_chan = await this.client.Config.findOne({
				where: { guildId: channel.guild.id },
			});
			// If there is nothing configured for this guild, do nothing
			if(!send_chan) return console.log('No configs set, returning.');

			setTimeout(async () => {
				// This is run X seconds after channel create to give meowth time to post
				const messages = await channel.messages.fetch();
				const first = messages.last();

				if(!gym.userIds) return;

				// Here we start dealing with building up the mention list
				let users_arr = gym.userIds.split(',');
				if(first) {
					const author_id = first.mentions.users.first().id;

					users_arr = users_arr.filter(id => id != author_id).map(id => `<@${id}>`);
				}
				else {
					users_arr = users_arr.map(id => `<@${id}>`);
				}
				if(users_arr.length <= 1) {
					// If there are no users for this gym, stop
					console.log('meep');
					return;
				}

				return this.client.channels.get('511235860625096726').send(`🔔🔔🔔\nBONG!\nA raid has just called for the gym \`${channel_gym}\` in ${channel}.\nConsider ye selves notified!\n🔔🔔🔔\n${users_arr.join(',')}\n\nIf you wish to no longer be notified for this gym, please type \`${config.prefix}remove ${channel_gym}\``, { split: true });
			}, delay);
		}
	}
}

module.exports = ChannelCreateListener;
