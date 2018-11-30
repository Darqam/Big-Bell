const emojiCharacters = require('../data/emojiCharacters.js');
const chanList = require('./findGyms.js');
const list_max = 5;

module.exports = {
	doQuery: async function(author_mention, results, gym, channel_gym, send_chan) {
		return new Promise(async (resolve) => {
			// Print out message asking for gym name verification
			// Loop over the given `results` array which contains all gym objects
			let react_out = `Hey${author_mention}, I found a few options, could anyone please specify which gym is correct so I can alert those who are watching for this gym? Choose ${send_chan.client.emojis.get('511174899969032193')} if the correct gym was not listed.\n`;
			for(let i = 0; i < list_max; i++) {
				if(i == results.length) break;
				react_out += `${i} - ${results[i].GymName}\n`;
			}

			// Send the message, and loop over the proper emojis to react with
			const react_msg = await send_chan.send(react_out);
			const valid_emojis = [];
			for(let j = 0; j < list_max; j++) {
				if(j == results.length) break;
				valid_emojis.push(emojiCharacters[j]);
				await react_msg.react(emojiCharacters[j]);
			}
			// Add the X emoji
			await react_msg.react('511174899969032193');

			// Filter out any emoji reaction that was not initially used by the bot (as done in the few lines above this comment)
			const react_filter = (reaction, user) => {
				return (valid_emojis.includes(reaction.emoji.name) || reaction.emoji.id == '511174899969032193') && !user.bot;
			};

			// Begin awaitReaction block
			try {
				const collected = await react_msg.awaitReactions(react_filter, { max: 1, time: 120000, errors: ['time'] });
				const reaction = collected.first();

				// If the user reacted with X, abort current process and request an exact gym name
				if(reaction.emoji.id == '511174899969032193') {
					// Create a message filter where only the one who reacted with X can state the gym name
					const msg_filter = m => {
						return reaction.users.some(u => u.id === m.author.id);
					};
					await react_msg.channel.send('Aborting choice, please give the **exact name** of the gym as the following message.');
					try{
						const new_gym_coll = await react_msg.channel.awaitMessages(msg_filter, { max: 1, time: 60000, errors: ['time'] });
						const new_gym = new_gym_coll.first().content.toLowerCase();

						// Attempt to fetch the gym object from database via the given name
						const gym_return = await chanList.getGymNames(react_msg.client, new_gym);
						if(gym_return[0][0]) {
							const return_array = [results, gym_return[0][0], gym_return[0][0].GymName];
							resolve(return_array);
						}
						else {
							react_msg.channel.send('Could not find a channel by that name, consider using the `alert` command in the raid channel once 2 minutes has passed.');
							// pass whatever, and the abort code
							resolve([0, 0, 0, true]);
						}
					}
					catch(e) {
						console.log('Did not recieve new gym name');
					}
					// End try catch for X reaction
				}
				// End if reaction is X

				// loop over our emoji numbers to see which index was used
				for(const key in emojiCharacters) {
					if(emojiCharacters.hasOwnProperty(key) && emojiCharacters[key] == reaction.emoji.name) {
						gym = results[key];
						channel_gym = gym.GymName;
					}
				}
				// This if should never trigger, but it's there just in case
				// Forces gym to default to the best option returned by fuzzySearch
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

			const return_array = [results, gym, channel_gym];
			resolve(return_array);
		});
	},
};
