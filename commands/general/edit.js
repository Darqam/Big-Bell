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
					id: 'gym_list',
					match: 'rest',
					type: 'lowercase',
				},
			],
		});
	}

	async exec(message, args) {
		if(!args.gym_list) return message.reply('No gyms found in query');
		const gym_list = args.gym_list.tolLowerCase().split(',');
		const allUserGyms = await this.client.userGyms.findAll({ where: { userId: message.author.id } });
		const updateObj = {};

		const [sanitized, errorM, parsedArgs] = sanitize.sanitizeArgs(args);
		if(sanitized == 1) return message.channel.send(errorM);

		if(parsedArgs.disabled) {
			updateObj.disabled = parsedArgs.disabled == 'true' ? 1 : 0;
		}

		if(parsedArgs.start) updateObj.timeStart = parsedArgs.start;
		if(parsedArgs.end) updateObj.timeStop = parsedArgs.end;



		/*
		timeStart: Sequelize.STRING,
		timeStop: Sequelize.STRING,
		disabled: Sequelize.INTEGER, // 1 or 0
		raidLevels: Sequelize.STRING, // "2,4,5"
		pokemons: Sequelize.TEXT,
		*/

	}
}

module.exports = EditCommand;
