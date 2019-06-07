const { Command } = require('discord-akairo');
const chanList = require('../../functions/findGyms.js');

class AddCommand extends Command {
	constructor() {
		super('add', {
			aliases: ['add', 'a', 'want'],
			category: 'general',
			description: {
				content: 'Adds user to a list of gyms. All configurations are optional, but will apply to the entire given list. Time is in 24H format!',
				usage: 'Gym Name 1, Gym Name 2, ... <start:##:##> <end:##:##> <levels:#,#,#,...>',
				examples: ['add awesome park, super park start:9:00 end:21:00 levels:2,4,5'],
			},
			args: [
				{
					id: 'start',
					match: 'option',
					flag: 'start:',
				},
				{
					id: 'end',
					match: 'option',
					flag: 'end:',
				},
				{
					id: 'levels',
					match: 'option',
					flag: 'levels:',
				},
				{
					id: 'pokemons',
					match: 'option',
					flag: 'pokemons:',
				},
				{
					id: 'gym_list',
					match: 'rest',
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
		const alternatives = [];
		const present = [];

		for(let i = 0; i < gym_list.length; i++) {
			gym_list[i] = gym_list[i].trim();
			const gym = await this.client.Gyms.findOne({
				where: {
					gymName: gym_list[i],
				},
			});
			if(gym) {
				const userGym = await this.client.userGyms.findOne({
					where: {
						gymName: gym_list[i],
						userId: message.author.id,
					},
				});

				if(userGym) {
					// If the user already monitors this gym, continue
					present.push(gym_list[i]);
					continue;
				}

				user_list.push(message.author.id);

				const affectedRows = await this.client.Gyms.update(
					{ userIds: user_list.join(',') },
					{ where : { gymName: gym_list[i] } },
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
				// Try to find gyms of similar names to suggest them
				const func_return = await chanList.getGymNames(this.client, gym_list[i]);
				if(func_return[0]) alternatives.push(func_return[0]);
				else alternatives.push(['No alternatives found.']);
			}
		}
		// End for loop
		if(success.length > 0) {
			output += `Successfully added you to: \n\`\`\`${success.join('\n')}\`\`\`\n`;
			await message.react(message.client.myEmojiIds.success);
		}

		if(noName.length > 0) {
			const tmpOut = [];
			for(let i = 0; i < noName.length; i++) {
				tmpOut.push(noName[i] + ' --> ' + alternatives[i].map(a => a.gymName).join(', '));
			}
			output += `Could not find the following gyms, check the spelling or it may be one of the following: \n\`\`\`\n${tmpOut.join('\n')}\`\`\`\n`;
			await message.react('❓');
		}

		if(present.length > 0) {
			output += `Could not add you to the following since you are already registered there: \n\`\`\`\n${present.join('\n')}\`\`\`\n`;
			await message.react('❓');
		}

		if(errors.length > 0) {
			output += `Could not add you to the following gyms due to an unknown error: \n\`\`\`\n${errors.join('\n')}\`\`\``;
			await message.react(message.client.myEmojiIds.failure);
		}

		return message.reply(output);
	}
}

module.exports = AddCommand;
