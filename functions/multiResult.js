const emojiCharacters = require('../data/emojiCharacters.js');
const list_max = 5;

module.exports = {
	doQuery: async function(author_mention, results, gym, channel_gym, send_chan) {
		return new Promise(async (resolve) => {

			const minimalTime = 120;

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
			const time_diff = (new Date() - react_msg.channel.createdAt) / 1000;
			let reaction;
			try {
				// If a user reacted quickly reaction might already be done,
				// so first check existig reactions
				const preReacts = react_msg.reactions.filter(r => r.users.size > 1);
				// if there is more than one reaction
				if(preReacts.size > 1) {
					console.log(`Got too many answers for ${react_msg.channel.name}, aborting.`);
					react_msg.channel.send(`There was more than one answer selected, please consider using the \`alert\` command after another ${Math.round(minimalTime - time_diff)} seconds with only one answer this time.`);
					resolve([0, 0, 0, true]);
				}
				else if(preReacts.size == 1) {
					reaction = preReacts.first();
				}
				else {
					// no one has reacted early, so let's wait for reactions.
					const collected = await react_msg.awaitReactions(react_filter, { max: 1, time: 120000, errors: ['time'] });
					reaction = collected.first();
				}

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
						const gym_return = await react_msg.client.Gyms.findOne({
							where: {
								GymName: new_gym,
							},
						});
						if(gym_return) {
							const return_array = [results, gym_return, gym_return.GymName];
							resolve(return_array);
						}
						else {
							react_msg.channel.send('Could not find a channel by that name, consider using the `alert` command in the raid channel once 2 minutes has passed.');
							// pass whatever, and the abort code
							resolve([0, 0, 0, true]);
						}
					}
					catch(e) {
						console.log(e);
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
				console.error(e);
				console.log('Got no answer for gym precision, tapping out');
				react_msg.channel.send(`Did not recieve gym name confirmation, please consider using the \`alert\` command after another ${Math.round(minimalTime - time_diff)} seconds.`);
				resolve([0, 0, 0, true]);
			}

			const return_array = [results, gym, channel_gym];
			resolve(return_array);
		});
	},
};
