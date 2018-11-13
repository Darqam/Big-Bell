const { Command } = require('discord-akairo');

class CreateCommand extends Command {
	constructor() {
		super('create', {
			aliases: ['create', 'c'],
			description: 'create Gym Name 1, Gym Name 2, ...\nCreates the given gyms in the database (mod only)',
			args: [
				{
					id: 'gym_list',
					match: 'content',
					type: 'lowercase',
				},
			],
			userPermissions: ['MANAGE_GUILD'],
			channelRestriction: 'guild',
		});
	}

	async exec(message, args) {
		if(!args.gym_list) return message.reply('No gyms found in query');
		const gym_list = args.gym_list.split(',');
		const error = [];
		const success = [];
		const alreadyExists = [];


		for(let i = 0; i < gym_list.length; i++) {
			gym_list[i] = gym_list[i].trim();

			const date = new Date();
			try {
				const gym = await this.client.Gyms.create({
					GymName: gym_list[i],
					userIds: '',
					submittedById: message.author.id,
					submittedOn: date.toString(),
					timesPinged: 0,
				});
				success.push(gym.GymName);
			}
			catch (e) {
				if (e.name === 'SequelizeUniqueConstraintError') {
					alreadyExists.push(gym_list[i]);
				}
				else {
					console.log(e);
					error.push(gym_list[i]);
				}
			}
		}
		let output = '';
		if(success.length > 0) {
			output += `Successfully created ${success.length} instances for: \n\`\`\`\n${success.join('\n')}\`\`\`\n`;
			await message.react('511174612323663874');
		}

		if(alreadyExists.length > 0) {
			output += `Gyms already existed by the name: \n\`\`\`\n${alreadyExists.join('\n')}\`\`\`\n`;
			await message.react('❓');
		}

		if(error.length > 0) {
			output += `Could not create the gym instance for the following names: \n\`\`\`\n${error.join('\n')}\`\`\``;
			await message.react('511174899969032193');
		}

		return message.reply(output);
	}
}

module.exports = CreateCommand;
