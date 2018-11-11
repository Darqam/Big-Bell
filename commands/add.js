const { Command } = require('discord-akairo');

class AddCommand extends Command {
	constructor() {
		super('add', {
			aliases: ['add', 'a'],
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
		const gym_list = args.gym_list.split(',');
		let output = '';
		const errors = [];
		const success = [];
		const noName = [];
		const present = [];

		for(let i = 0; i < gym_list.length; i++) {
			gym_list[i] = gym_list[i].trim();
			const gym = await this.client.Gyms.findOne({
				where: {
					GymName: gym_list[i],
				},
			});
			if(gym) {
				const user_list = gym.userIds ? gym.userIds.split(',') : [];

				if(user_list.includes(message.author.id)) {
					// If the user is already in this list, just continue
					present.push(gym_list[i]);
					continue;
				}

				user_list.push(message.author.id);

				const affectedRows = await this.client.Gyms.update(
					{ userIds: user_list.join(',') },
					{ where : { GymName: gym_list[i] } },
				);

				if(affectedRows > 0) {
					// If we managed to save the entry
					success.push(gym_list[i]);
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
			output += `Successfully added you to: \n\`\`\`${success.join('\n')}\`\`\`\n`;
			await message.react('511174612323663874');
		}

		if(noName.length > 0) {
			output += `Could not find gyms by the name of: \n\`\`\`\n${noName.join('\n')}\`\`\`\n`;
			await message.react('❓');
		}

		if(present.length > 0) {
			output += `Could not add you to the following since you are already registered there: \n\`\`\`\n${present.join('\n')}\`\`\`\n`;
			await message.react('❓');
		}

		if(errors.length > 0) {
			output += `Could not add you to the following gyms due to an unknown error: \n\`\`\`\n${errors.join('\n')}\`\`\``;
			await message.react('511174899969032193');
		}

		return message.reply(output);
	}
}

module.exports = AddCommand;
