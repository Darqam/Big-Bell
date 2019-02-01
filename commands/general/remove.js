const { Command } = require('discord-akairo');
const { debugList } = require('../../functions/debugList.js');


class RemoveCommand extends Command {
	constructor() {
		super('remove', {
			aliases: ['remove', 'r', 'unwant'],
			category: 'general',
			description: {
				content: 'Removes the author from the specified gym list.',
				usage: 'Gym Name 1, Gym Name 2, ...',
			},
			args: [
				{
					id: 'gym_list',
					match: 'content',
					type: 'lowercase',
				},
			],
		});
	}

	async exec(message, args) {
		if(!args.gym_list) return message.reply('No gyms found in query');

		let gym_list = args.gym_list.split(',');
		gym_list = gym_list.map(x => x.trim());

		let user_gyms = [];
		let output = '';
		const errors = [];
		const success = [];
		const noName = [];
		let notPresent = [];
		let all = false;

		const all_gyms = await this.client.Gyms.findAll({ attributes: ['GymName', 'userIds'] });
		all_gyms.forEach(gym => {
			if (gym.userIds.split(',').includes(message.author.id)) {
				user_gyms.push(gym);
			}
		});

		if(gym_list[0] !== 'all') {
			user_gyms = user_gyms.filter(aGym => gym_list.includes(aGym.GymName));
			notPresent = gym_list.filter(choice => !user_gyms.map(x => x.GymName).includes(choice));
		}
		else {
			gym_list = user_gyms.map(x => x.GymName);
			all = true;
			if(user_gyms.length == 0) {
				await message.react(message.client.myEmojiIds.failure);
				return message.reply('I do not have you registered in any gyms');
			}
		}

		// At this point, user_gyms is either all gym objects the user is subscribed to (for the case of 'all')
		// or it is limited to the gyms who'se names were typed.

		for(let i = 0; i < user_gyms.length; i++) {
			if(user_gyms[i]) {
				let user_list = user_gyms[i].userIds ? user_gyms[i].userIds.split(',') : [];
				user_list = user_list.filter(e => e != message.author.id);

				const affectedRows = await this.client.Gyms.update(
					{ userIds: user_list.join(',') },
					{ where : { GymName: gym_list[i] } },
				);

				if(affectedRows > 0) {
					// If we managed to save the entry
					success.push(gym_list[i]);
					debugList(message, gym_list[i], 'remove.js');
				}
				else {
					// If there was a failure for some reason
					errors.push(gym_list[i]);
				}
			}
			else {
				noName.push(gym_list[i]);
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
