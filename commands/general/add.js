const { Command } = require('discord-akairo');
const chanList = require('../../functions/findGyms.js');

class AddCommand extends Command {
	constructor() {
		super('add', {
			aliases: ['add', 'a', 'want'],
			category: 'general',
			description: {
				content: 'Adds user to a list of gyms. All configurations are optional, but will apply to the entire given list. Time is in 24H format! Time will default to all times if nothing is provided.',
				usage: 'Gym Name 1, Gym Name 2, ... <start:##:##> <end:##:##> <levels:#,#,#,...>',
				examples: ['add awesome park, super park start:9:00 end:21:00 levels:2,4,5', 'add Awesome Park, sucky park, ex raid magnet'],
			},
			args: [
				{
					id: 'start',
					match: 'option',
					flag: 'start:',
					default: '00:00',
				},
				{
					id: 'end',
					match: 'option',
					flag: 'end:',
					default: '23:59',
				},
				{
					id: 'levels',
					match: 'option',
					flag: 'levels:',
					default: '1,2,3,4,5',
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

		const start = args.start.match(/^[0-2]?[0-9]:[0-5][0-9]$/)[0];
		const end = args.end.match(/^[0-2]?[0-9]:[0-5][0-9]$/)[0];
		let levels = args.levels ? args.levels.split(',') : [];
		const pokemons = args.pokemons ? args.pokemons.match(/['a-zA-Z\s\-\u00C0-\u017F.]+/g) : [];

		// Lets get some input checks in here
		if(!start) return message.channel.send('I could not match your start time in the format ##:##, aborting. Please try again.');
		if(!end) return message.channel.send('I could not match your end time in the format ##:##, aborting. Please try again.');

		// Remove duplicates
		levels = [...new Set(levels)];
		// Keep only 1-5 values
		if(levels.filter(n => parseInt(n) < 1 || parseInt(n) > 5 || isNaN(parseInt(n))).length > 0) levels = null;
		if(!levels) return message.channel.send('I could not match your levels format in the format `#,#,#`, aborting. Please try again.');

		if(!pokemons) return message.channel.send('I could not match the pokemon name formats (alphabetical, with accents, spaces, and `.-` allowed), aborting. Please try again.');

		const endSplit = end.split(':');
		const startSplit = start.split(':');
		if(endSplit[0] < startSplit[0] || (endSplit[0] == startSplit[0] && endSplit[1] <= startSplit[1])) {
			return message.channel.send('Got an end time before or equal to start time, aborting. Please try again.');
		}

		// End input sanitation
		for(let i = 0; i < gym_list.length; i++) {
			gym_list[i] = gym_list[i].trim();
			const gym = await this.client.Gyms.findOne({
				where: {
					guildId: message.guild.id,
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

				try{
					await this.client.userGyms.create({
						userId: message.author.id,
						gymId: gym.id,
						gymName: gym.gymName,
						timeStart: start,
						timeStop: end,
						disabled: 0, // 1 or 0
						raidLevels: levels.join(), // "2,4,5"
						pokemons: pokemons.join(),
					});

					success.push(gym_list[i]);
				}
				catch(e) {
					errors.push(gym_list[i]);
					console.log(e);
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
