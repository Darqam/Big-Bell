const { Command } = require('discord-akairo');

class RemoveCommand extends Command {
	constructor() {
		super('remove', {
			aliases: ['remove', 'r', 'unwant'],
			category: 'general',
			description: {
				content: 'Removes the author from specified gym lists.',
				usage: 'Gym Name 1, Gym Name 2, ...',
				examples: ['Best Gym, Ok gym, ....', 'all'],
			},
			args: [
				{
					id: 'gymList',
					match: 'content',
					type: 'lowercase',
				},
			],
		});
	}

	async exec(message, args) {
		if(!args.gymList) return message.reply('No gyms found in query');

		let gymList = args.gymList.toLowerCase().split(',');
		gymList = gymList.map(x => x.trim());

		let userGyms = [];
		let output = '';
		const errors = [];
		const success = [];
		const noName = [];
		let notPresent = [];

		const allGyms = await this.client.userGyms.findAll({ where: { userId: message.author.id } });

		if(allGyms.length == 0) {
			await message.react(message.client.myEmojiIds.failure);
			return message.reply('I do not have you registered in any gyms');
		}

		if(gymList[0] === 'all') {
			try {
				await this.client.userGyms.Destroy({ where: { userId: message.author.id } });
			}
			catch(e) {
				console.log('Error in remove command', e);
				return message.channel.send('There was a problem in removing your entries, please bring this to Daro\'s/Anhim\'s attention.');
			}
		}
		else {
			// Go through the specified gym list and remove the associated ones.
			for(let i = 0; i < allGyms.length; i++) {
				try {
					await this.client.userGyms.Destroy({
						where: {
							userId: message.author.id,
							gymName: allGyms[i],
						},
					});
					success.push(gymList[i]);
				}
				catch(e) {
					console.log(`Error removing ${allGyms[i]} for ${message.author.tag}`, e);
					errors.push(gymList[i]);
				}
			}
		}

		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		// noName.push(gymList[i]);
		// This is still needed




		if(gymList[0] !== 'all') {
			userGyms = userGyms.filter(aGym => gymList.includes(aGym.gymName));
			notPresent = gymList.filter(choice => !userGyms.map(x => x.gymName).includes(choice));
		}

		// At this point, userGyms is either all gym objects the user is subscribed to (for the case of 'all')
		// or it is limited to the gyms who'se names were typed.

		for(let i = 0; i < userGyms.length; i++) {
			if(userGyms[i]) {
				let user_list = userGyms[i].userIds ? userGyms[i].userIds.split(',') : [];
				user_list = user_list.filter(e => e != message.author.id);

				const affectedRows = await this.client.Gyms.update(
					{ userIds: user_list.join(',') },
					{ where : { gymName: gymList[i] } },
				);

				if(affectedRows > 0) {
					// If we managed to save the entry
					success.push(gymList[i]);
				}
				else {
					// If there was a failure for some reason
					errors.push(gymList[i]);
				}
			}
			else {
				noName.push(gymList[i]);
			}
		}
		// End for loop
		if(success.length > 0) {
			output += `Successfully removed you from: \n\`\`\`\n${success.join('\n')}\`\`\`\n`;
			if(all) output += 'If this was temporary, consider blocking me next time, might be faster than running this and adding them back later.';
			await message.react(message.client.myEmojiIds.success);
		}

		if(noName.length > 0) {
			output += `Could not find gyms by the name of: \n\`\`\`\n${noName.join('\n')}\`\`\`\n`;
			await message.react('❓');
		}

		if(notPresent.length > 0) {
			output += `Could not remove you from the following since you were not registered there or the gym was not found: \n\`\`\`\n${notPresent.join('\n')}\`\`\`\n`;
			await message.react('❓');
		}

		if(errors.length > 0) {
			output += `Could not remove you to the following gyms due to an unknown error: \n\`\`\`\n${errors.join('\n')}\`\`\``;
			await message.react(message.client.myEmojiIds.failure);
		}
		return message.reply(output);
	}
}

module.exports = RemoveCommand;
