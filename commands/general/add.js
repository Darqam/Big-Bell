const { Command } = require('discord-akairo');
const chanList = require('../../functions/findGyms.js');
const sanitize = require('../../functions/sanitize.js');

class AddCommand extends Command {
	constructor() {
		super('add', {
			aliases: ['add', 'a', 'want'],
			category: 'general',
			description: {
				content: 'Adds user to a list of gyms. All configurations are optional, but will apply to the entire given list. Time is in 24H format! Time will default to all times if nothing is provided.',
				usage: 'Gym Name 1, Gym Name 2, ... <start:##:##> <end:##:##> <levels:#,#,#,...> <pokemons:name1,name2,...>',
				examples: ['add awesome park, super park start:9:00 end:21:00 levels:2,4,5 pokemons:cresselia,breloom', 'add Awesome Park, sucky park, ex raid magnet'],
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
					default: '',
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

		const [sanitized, errorM, parsedArgs] = sanitize.sanitizeArgs(args);
		if(sanitized == 1) return message.channel.send(errorM);

		const gyms_that_make_me_angry = ['ice cream, anyone?'];

		for(let i = 0; i < gym_list.length; i++) {
			if(!gym_list[i] || !gym_list[i + 1]) break;

			const merged_name = `${gym_list[i].trim()}, ${gym_list[i + 1].trim()}`;

			if(gyms_that_make_me_angry.some(g => g == merged_name)) {
				gym_list.splice(i + 1, 1);
				gym_list[i] = merged_name;
			}
		}

		// At this point, inputs should be good
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
						timeStart: parsedArgs.start,
						timeStop: parsedArgs.end,
						disabled: 0, // 1 or 0
						raidLevels: parsedArgs.levels.join(), // "2,4,5"
						pokemons: args.pokemons ? parsedArgs.pokemons.join() : '',
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
