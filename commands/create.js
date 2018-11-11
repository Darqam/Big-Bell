const { Command } = require('discord-akairo');

class CreateCommand extends Command {
	constructor() {
		super('create', {
			aliases: ['create', 'c'],
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
		console.log(gym_list);
		const error = [];
		const success = [];
		const alreadyExists = [];


		for(let i = 0; i < gym_list.length; i++) {
			const date = new Date();
			try {
				const gym = await this.client.Gyms.create({
					GymName: gym_list[i],
					userIds: '',
					submittedByTag: message.author.tag,
					submittedById: message.author.id,
					submittedOn: date.toString(),
					timesPinged: 0,
				});
				console.log(gym);
				success.push(gym.name);
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
		if(success.length > 0) output += `Successfully created instances for: \n\`\`\`${success.join(', ')}\`\`\`\n`;

		if(alreadyExists.length > 0) output += `Gyms already existed by the name: \n\`\`\`${alreadyExists.join(', ')}\`\`\``;

		if(error.length) output += `Could not create the gym instance for the following names: \n\`\`\`${error.join(', ')}\`\`\`\n`;

		return message.reply(output);
	}
}

module.exports = CreateCommand;
