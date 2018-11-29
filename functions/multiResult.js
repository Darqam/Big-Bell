const emojiCharacters = require('../data/emojiCharacters.js');
const chanList = require('./findGyms.js');
const list_max = 5;

module.exports = {
	doQuery: async function(author_mention, results, gym, channel_gym, send_chan, selection_done) {
		return new Promise(async (resolve) => {
			let react_out = `Hey${author_mention}, I found a few options, could anyone please specify which gym is correct so I can alert those who are watching for this gym? Choose ${send_chan.client.emojis.get('511174899969032193')} if the correct gym was not listed.\n`;
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
			await react_msg.react('511174899969032193');

			const react_filter = (reaction, user) => {
				return (valid_emojis.includes(reaction.emoji.name) || reaction.emoji.id == '511174899969032193') && !user.bot;
			};
			try {
				const collected = await react_msg.awaitReactions(react_filter, { max: 1, time: 120000, errors: ['time'] });
				const reaction = collected.first();


				if(reaction.emoji.id == '511174899969032193') {
					const msg_filter = m => {
						return reaction.users.some(u => u.id === m.author.id);
					};
					await react_msg.channel.send('Aborting choice, please give the exact name of the gym as the following message.');
					try{
						const new_gym_coll = await react_msg.channel.awaitMessages(msg_filter, { max: 1, time: 60000, errors: ['time'] });
						const new_gym = new_gym_coll.first().content.toLowerCase();
						const gym_return = await chanList.getGymNames(react_msg.client, new_gym);
						if(gym_return[0][0]) {
							const return_array = [results, gym_return[0][0], gym_return[0][0].GymName, true];
							resolve(return_array);
						}
						else {
							react_msg.channel.send('Could not find a channel by that name, consider using the `alert` command in the raid channel once 2 minutes has passed.');
							// pass whatever, and the abort code
							resolve([0, 0, 0, 0, true]);
						}
					}
					catch(e) {
						console.log('Did not recieve new gym name');
					}
				}

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

			const return_array = [results, gym, channel_gym, selection_done];
			resolve(return_array);
		});
	},
};
