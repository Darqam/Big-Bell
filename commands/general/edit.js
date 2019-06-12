const { Command } = require('discord-akairo');
const sanitize = require('../../functions/sanitize.js');

class EditCommand extends Command {
	constructor() {
		super('edit', {
			aliases: ['edit'],
			category: 'general',
			description: {
				content: 'Edits user configuration for the list of gyms. All provided configurations will apply to the entire given list.',
				usage: 'Gym Name 1, Gym Name 2, ... <start:##:##> <end:##:##> <levels:#,#,#,...> <pokemons:name1,name2,...> <disabled:true/false>',
				examples: ['edit awesome park, super park start:9:00 end:21:00 levels:2,4,5 pokemons:cresselia,breloom', 'edit Awesome Park, sucky park, ex raid magnet levels:5', 'edit sucky park disabled:true'],
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
					id: 'disabled',
					match: 'option',
					flag: 'disabled:',
				},
				{
					id: 'gymList',
					match: 'rest',
					type: 'lowercase',
				},
			],
		});
	}

	async exec(message, args) {
		if(!args.gymList) return message.reply('No gyms found in query');
		const gymList = args.gymList.tolLowerCase().split(',');
		const allUserGyms = await this.client.userGyms.findAll({ where: { userId: message.author.id } });
		const updateObj = {};

		const errors = [];
		const success = [];
		const notFound = [];
		let output = '';

		const [sanitized, errorM, parsedArgs] = sanitize.sanitizeArgs(args);
		if(sanitized == 1) return message.channel.send(errorM);

		if(parsedArgs.disabled) {
			updateObj.disabled = parsedArgs.disabled == 'true' ? 1 : 0;
		}

		if(parsedArgs.start) updateObj.timeStart = parsedArgs.start;
		if(parsedArgs.end) updateObj.timeStop = parsedArgs.end;

		if(args.level) updateObj.raidLevels = parsedArgs.levels.join();
		if(args.pokemons) updateObj.pokemons = parsedArgs.pokemons.join();

		for(let i = 0; i < gymList.length; i++) {
			if(!allUserGyms.some(g => g.gymName == gymList[i])) {
				notFound.push(gymList);
				continue;
			}
			const affectedRows = await this.client.userGyms.update(updateObj,
				{ where :
					{
						userId: message.author.id,
						gymName: gymList[i],
					},
				},
			);

			if(affectedRows > 0) {
				success.push(gymList[i]);
			}
			else {
				errors.push(gymList[i]);
			}
		}
		// End for loop
		if(success.length > 0) {
			output += `Successfully edited the following gyms: \n\`\`\`${success.join('\n')}\`\`\`\n`;
			await message.react(message.client.myEmojiIds.success);
		}

		if(notFound.length > 0) {
			output += `Could not find the following gyms associated with your id: \n\`\`\`\n${notFound.join('\n')}\`\`\`\n`;
			await message.react('❓');
		}

		if(errors.length > 0) {
			output += `Could not edit the following gyms due to an unknown error: \n\`\`\`\n${errors.join('\n')}\`\`\``;
			await message.react(message.client.myEmojiIds.failure);
		}

		return message.reply(output);

	}
}

module.exports = EditCommand;
