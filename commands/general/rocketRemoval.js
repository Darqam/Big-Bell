const { Command } = require('discord-akairo');
const stringSimilarity = require('string-similarity');

class RemoveRocketCommand extends Command {
	constructor() {
		super('rocketRemoval', {
			aliases: ['rocketRemove', 'rr'],
			category: 'general',
			description: {
				content: 'Removes a leader battle from the given stop.',
				usage: 'Pokestop name',
				examples: ['North Park'],
			},
			args: [
				{
					id: 'stopName',
					match: 'content',
				},
			],
		});
	}

	async exec(message, args) {
		if(!args.stopName) return message.reply('No stop given');

		if(args.stopName.toLowerCase() == 'all') {
			try {
				await this.client.rocketLeaders.destroy({
					where: {},
				});
				return message.channel.send('*Team rocket\'s blasting off agaaaaain!*🌠');
			}
			catch(e) {
				console.log(e);
				return message.channel.send('Error in cleaning up.');
			}
		}

		const stopList = await message.client.rocketLeaders.findAll();
		let ARBITRARY_LIMIT = 5;
		let stopName = '';
		const topStops = [];
		let defaulted = false;

		const sorted_name_list = stringSimilarity.findBestMatch(args.stopName.trim(), stopList.map(n=>n.stopName)).ratings
			.sort((a, b) => b.rating - a.rating);
		const sorted_lowercase_names_list = stringSimilarity.findBestMatch(args.stopName.toLowerCase().trim(), stopList.map(n=>n.stopName.toLowerCase())).ratings
			.sort((a, b) => b.rating - a.rating);

		if(ARBITRARY_LIMIT > sorted_name_list.length) ARBITRARY_LIMIT = sorted_name_list.length;

		if(sorted_name_list[0].rating == 1) {
			stopName = sorted_name_list[0].target;
		}
		else if(sorted_name_list[0].rating > 0.7 && sorted_name_list[1].rating < 0.6) {
			// If we hit here, we default to top choice since we have 70% match or above on one, and less than 70% on any further stop.
			// Basically this is a "best guess".
			defaulted = true;
			stopName = sorted_name_list[0].target;
		}
		else if(sorted_lowercase_names_list[0].rating == 1) {
			stopName = sorted_name_list[0].target;
		}
		else if(sorted_lowercase_names_list[0].rating > 0.7 && sorted_lowercase_names_list[1].rating < 0.6) {
			// If we hit here, we default to top choice since we have 70% match or above on one, and less than 70% on any further stop.
			// Basically this is a "best guess".
			defaulted = true;
			stopName = sorted_lowercase_names_list[0].target;
		}
		else {
			for(let i = 0; i < ARBITRARY_LIMIT; i++) {
				topStops.push(sorted_name_list[i].target);
			}
			return message.channel.send(`Could not find a unique stop name close to what was given, please try again. Close contestants were: \`${topStops.join(', ')}\``);
		}

		const curr = await this.client.rocketLeaders.findAll();
		const currentStops = curr.map(x => x.stopName);

		if(!currentStops.includes(stopName)) {
			return message.channel.send(`Could not find a rocket leader associated with the stop \`${stopName}\` in the database.`);
		}

		try{
			await this.client.rocketLeaders.destroy({
				where: {
					stopName: stopName,
				},
			});
			if(defaulted) return message.channel.send(`Rocket encounter was removed from the database!\n**Please Note**: An exact pokestop name could not be matched, a close match was found with \`${stopName}\`. The encounter was removed from this stop instead.`);
			return message.channel.send('Rocket leader encounter removed from database!');
		}
		catch(e) {
			console.log(e);
			return message.channel.send(`There was an error removing from database \`${stopName}\`. This shouldn't happen, <@129714945238630400> you need to see this.`);
		}
	}
}

module.exports = RemoveRocketCommand;
