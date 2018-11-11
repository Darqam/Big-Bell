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
		const gym_list = args.gym_list.split(',');
		const output = [];

		for(let i = 0; i < gym_list.length; i++) {
			const gym = await this.client.Gyms.findOne({
				where: {
					GymName: gym_list[i],
				},
			});
			if(gym) {
				const old_list = gym.userIds.split(',');
				const new_list = old_list + message.author.id;

				const affectedRows = await this.client.Gyms.update(
					{ userIds: new_list },
					{ where : { GymName: gym_list[i] } },
				);

				if(affectedRows > 0) {
					output.push(gym_list[i]);
				}
				else if(output != '') {
					return message.reply(`Could not add you to gym: ${gym_list[i]}, please check your spelling or ask an admin to add it to the list.\n\nI did manage to add you to the following gyms however: \n\`\`\`\n${output.join(', ')}\`\`\``);
				}
			}
			if(output != '') {
				return message.reply(`Could not add you to find: ${gym_list[i]}, please check your spelling or ask an admin to add it to the list.\n\nI did manage to add you to the following gyms however: \n\`\`\`\n${output.join(', ')}\`\`\``);
			}
			return message.reply(`Could not find a gym by the name: "${gym_list[i]}", please check your spelling or ask an admin to add it to the list.`);
		}
	}
}

module.exports = AddCommand;
