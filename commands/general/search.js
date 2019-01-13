const { Command } = require('discord-akairo');
const chanList = require('../../functions/findGyms.js');

class SearchCommand extends Command {
	constructor() {
		super('search', {
			aliases: ['search'],
			category: 'general',
			description: {
				content: 'Searches for gyms with similar names as the given input.',
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
		const gym_list = args.gym_list.split(',');
		const output = [];

		for(let i = 0; i < gym_list.length; i++) {
			gym_list[i] = gym_list[i].trim();
			const func_return = await chanList.getGymNames(this.client, gym_list[i]);
			if(func_return[0]) output.push(gym_list[i] + '-->' + func_return[0].map(n => ' ' + n.GymName));
			else output.push(gym_list[i] + '-->' + 'No similar gyms found to that name.');
		}
		message.channel.send(`The search returned the following: \n\n\`\`\`\n${output.join('\n\n')}\n\`\`\`\n`);
	}
}

module.exports = SearchCommand;
