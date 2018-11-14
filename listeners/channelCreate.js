const { Listener } = require('discord-akairo');
const config = require('../config.json');
let pokemons = require('../data/pokemons.json');
const emojiCharacters = require('../data/emojiCharacters.js');
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

		// Figure out which channel to send this to
		let send_chan = await this.client.Config.findOne({
			where: { guildId: channel.guild.id },
		});
		// If there is nothing configured for this guild, do nothing
		if(!send_chan) return console.log('No configs set, returning.');
		else send_chan = this.client.channels.get(send_chan.announcementChan);

		// Let's start isolating channel name here

		// Case 1, regular raid. Assume format pokemonName-gym-name-here
		let channel_gym = '';
		let results = [];
		let egg = false;
		const delay = 5 * 1000;
		let found = false;
		let selection_done = false;
		const list_max = 5;
		const channel_array = channel.name.split('-');

		// There is only (so far) a few pokemons with `-` in their name,
		// when they do it's only there once
		if(pokemons.includes(channel_array[0] + '-' + channel_array[1])) {
			channel_array.splice(0, 2);
			channel_gym = channel_array.join(' ');
		}
		else if(pokemons.includes(channel_array[0])) {
			channel_array.splice(0, 1);
			channel_gym = channel_array.join(' ');
		}

		// Case 2, raid egg. Assume format level-X-egg-park-name
		if(channel_gym == '' && channel_array[0].toLowerCase() == 'level' && channel_array[2].toLowerCase() == 'egg') {
			channel_gym = channel_array.slice(3).join(' ');
			egg = true;
		}

		// Case 3, hatched raid egg: hatched-level-X-egg-gym-name-here
		if(channel_gym == '' && channel_array[0].toLowerCase() == 'hatched' && channel_array[1].toLowerCase() == 'level' && channel_array[3].toLowerCase() == 'egg') {
			channel_gym = channel_array.slice(4).join(' ');
		}

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
			// If the gym wasn't found with an exact match, pull all entries
			// from the database
			const gymList = await this.client.Gyms.findAll({ attributes: ['GymName', 'userIds', 'timesPinged', 'gymDirections', 'exRaidNumber', 'exRaidEligibility'] });

			const searcher = new FuzzySearch(gymList, ['GymName'], {
				caseSensitive: true,
				sort: true,
			});

			results = searcher.search(channel_gym);
			if(results.length == 1) {
				found = true;
				gym = results[0];
				channel_gym = results[0].GymName;
			}
			else if(results.length > 1) {
				found = true;
				console.log('more than one gym found');
			}
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
				if(first) {
					author_id = first.mentions.users.first().id;
					author_mention = ` <@${author_id}> `;
				}

				if(results.length > 1) {
					let react_out = `Hey${author_mention}, I found a few options, could anyone please specify which gym is correct so I can alert those who are watching for this gym?\n`;
					for(let i = 0; i < list_max; i++) {
						if(i == results.length) break;
						react_out += `${i} - ${results[i].GymName}\n`;
					}
					const react_msg = await send_chan.send(react_out);
					const valid_emojis = [];

					for(let j = 0; j < list_max; j++) {
						if(j == results.length) break;
						valid_emojis.push(emojiCharacters[j]);
						await react_msg.react(emojiCharacters[j]);
					}

					const react_filter = (reaction, user) => {
						return valid_emojis.includes(reaction.emoji.name) && !user.bot;
					};
					try {
						const collected = await react_msg.awaitReactions(react_filter, { max: 1, time: 120000, errors: ['time'] });
						const reaction = collected.first();

						// loop over our emoji numbers to see which index was used
						for(const key in emojiCharacters) {
							if(emojiCharacters.hasOwnProperty(key) && emojiCharacters[key] == reaction.emoji.name) {
								gym = results[key];
								channel_gym = gym.GymName;
							}
						}
						if(!gym) {
							gym = results[0];
							channel_gym = gym.GymName;
						}
					}
					catch(e) {
						console.log('Got no answer for gym precision, defaulting to highest match');
						gym = results[0];
						channel_gym = gym.GymName;
					}
					selection_done = true;
				}

				// Generating output text to give better map_info on ex raid for this gym
				let ex_out = '';
				if(gym.exRaidNumber) ex_out = `Amount of times this gym has been home to an Ex raid: ${gym.exRaidNumber}`;
				else if(gym.exRaidEligibility) ex_out = `Status of this gym with regards to Ex raids: ${gym.exRaidEligibility}`;

				if(ex_out && gym.gymDirections) channel.send(`🔔\nHere is the proper google maps: <${gym.gymDirections}>.\n${ex_out}`);
				else console.log(`Did not have map and Ex raid info for ${gym.GymName}.`);

				// Check if anyone is registered for this gym
				if(!gym.userIds) {
					console.log(`No users for ${channel_gym}.`);
					if(selection_done) send_chan.send('No one has this gym on their watchlist, keeping quiet.');
					return;
				}

				// Here we start dealing with building up the mention list
				let users_arr = gym.userIds.split(',');
				if(author_id) {
					users_arr = users_arr.filter(id => id != author_id).map(id => `<@${id}>`);
				}
				else {
					users_arr = users_arr.map(id => `<@${id}>`);
				}
				if(users_arr.length < 1) {
					// If there are no users for this gym, stop
					console.log(`No users for ${channel_gym} aside from author.`);
					if(selection_done) send_chan.send('No one but the author has this gym on their watchlist, keeping quiet.');
					return;
				}

				// Purely for fun
				const affectedRows = await this.client.Gyms.update(
					{ timesPinged: gym.timesPinged + 1 },
					{ where : { GymName: channel_gym } },
				);
				if(affectedRows <= 0) console.log(`Error incrementing for gym ${channel_gym}`);

				// Since this has the potential to be a massive message, tell
				// djs to split the message at ~1900 characters and split by the
				// comma character which will be in between each mention.
				return send_chan.send(`🔔🔔🔔\nBONG!\nA raid has just called for the gym \`${channel_gym}\` in ${channel}.\nConsider ye selves notified!\n🔔🔔🔔\n${users_arr.join(',')}\n\nIf you wish to no longer be notified for this gym, please type \`${config.prefix}remove ${channel_gym}\``, { split: { maxLength: 1900, char: ',' } });
			}, delay);
		}
		else {
			console.log(`Found nothing for ${channel_gym}.`);
		}
	}
}

module.exports = ChannelCreateListener;
