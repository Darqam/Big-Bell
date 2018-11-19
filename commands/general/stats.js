const { Command } = require('discord-akairo');

class StatsCommand extends Command {
	constructor() {
		super('stats', {
			aliases: ['stats', 's', 'stat'],
			category: 'general',
			description: {
				content: 'Shows some stats about the gyms used in this group.',
				usage: '<gym name>',
				examples: ['', 'Gym Name'],
			},
			args: [
				{
					id: 'gym_choice',
					match: 'content',
					type: 'lowercase',
					optional:true,
				},
			],
		});
	}

	async exec(message, { gym_choice }) {
		const timeList = await this.client.Stats.findAll({ attributes: ['timestamp', 'gymName'] });
		if(!gym_choice) {
			timeList.forEach(time => {
				console.log(`[${time.timestamp}, ${time.gymName}]`);
			});
			return message.channel.send('done.');
		}
		const gym_times = timeList.filter(tmpTime => tmpTime.gymName === gym_choice);
		if(gym_times.length == 0) return message.channel.send('Could not find stats for this gym');
		gym_times.forEach(time => {
			console.log(`[${time.timestamp}, ${time.gymName}]`);
		});
		return message.channel.send('done');
	}
}

module.exports = StatsCommand;
