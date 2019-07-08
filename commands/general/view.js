const { Command } = require('discord-akairo');

class ViewCommand extends Command {
	constructor() {
		super('view', {
			aliases: ['view', 'v', 'list', 'details'],
			category: 'general',
			description: {
				content: 'Displays which gyms the author is monitoring. Use the `--details` flag time and enabled status, the `--all` to view all info',
				usage: '<--details>',
				examples:['list', 'list --details', 'list --all'],
			},
			args: [
				{
					id: 'details',
					match: 'flag',
					flag: '--details',
				},
				{
					id: 'all',
					match: 'flag',
					flag: '--all',
				},
			],
		});
	}

	async exec(message, args) {
		const gymList = await this.client.userGyms.findAll({ where: { userId: message.author.id }	});

		if(gymList.length == 0) return message.reply('You currently are registered to recieve no alerts.');

		let userGyms;
		if(!args.details && !args.all) {
			userGyms = gymList.map(gym => gym.gymName);
		}
		else {
			if(args.all) {
				userGyms = gymList.map(gym => {
					return [gym.gymName, gym.timeStart, gym.timeStop, gym.raidLevels, gym.pokemons, gym.disabled ? 'True' : 'False'];
				});
				userGyms.unshift(['Gym Name', 'Start', 'Stop', 'Raid levels', 'Pokemons', 'Disabled']);
			}
			if(args.details) {
				userGyms = gymList.map(gym => {
					return [gym.gymName, gym.timeStart, gym.timeStop, gym.disabled ? 'True' : 'False'];
				});
				userGyms.unshift(['Gym Name', 'Start', 'Stop', 'Disabled']);
			}

			// Find longest string
			// get size of longest string
			// Loop over and add consistent spacing everywhere to match size.
			const longest = new Array(userGyms[0].length).fill(0);
			userGyms.forEach(gymOut => {
				gymOut.forEach((elem, index) => {
					if(elem.length > longest[index]) longest[index] = elem.length;
				});
			});

			const output = [];
			let spacing = '';

			userGyms.forEach(gym => {
				const out = gym.map((elem, i) => {
					const distance = Math.floor(longest[i] - elem.length);
					// Replace 4 spaces by a tab to save characters
					spacing = '\t'.repeat(distance / 4) + ' '.repeat(distance % 4);
					return elem + spacing;
				});
				output.push(out.join('  '));
			});
			userGyms = output;
		}


		return message.reply(`You currently have alerts for the following gyms:\n\`\`\`\n${userGyms.join('\n')}\`\`\``, {
			split: {
				maxLength: 1900,
				char: '\n',
				prepend: '*cntd*...\n```',
				append: '```',
			},
		});

	}
}

module.exports = ViewCommand;
