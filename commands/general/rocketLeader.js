const { Command } = require('discord-akairo');
const stringSimilarity = require('string-similarity');

class DisableCommand extends Command {
	constructor() {
		super('rocketLeader', {
			aliases: ['rocket', 'leader', 'rl'],
			category: 'general',
			description: {
				content: 'Adds an entry for a rocket leader battle.',
				usage: 'Pokestop name; leader name; pokemon 1, pokemon 2, pokemon 3',
				examples: ['North Park; Cliff; Meowth, Snorlax, Tyranitar', 'North Park; Cliff'],
			},
			args: [
				{
					id: 'leaderInfo',
					match: 'content',
					type: 'lowercase',
				},
			],
		});
	}

	async exec(message, args) {
		if(!args.leaderInfo) return message.reply('No gyms found in query');
		const leaderNames = ['giovanni', 'cliff', 'sierra', 'arlo'];
		const leaderInfo = args.leaderInfo.trim().split(';');

		// Here we check leader name info
		if(!leaderNames.includes(leaderInfo[0].trim())) return message.channel.send('The given rocket leader does not match `Giovanni`, `Cliff`, `Sierra`, or `Arlo`.');

		// Now we check pokestop name
		if(!leaderInfo[1] || !leaderInfo[1].trim()) return message.channel.send('Missing pokestop name');

		const stopList = await message.client.pokestops.findAll();
		const ARBITRARY_LIMIT = 5;
		let stopName = '';
		const topStops = [];
		let defaulted = false;

		const sorted_name_list = stringSimilarity.findBestMatch(leaderInfo[1].trim(), stopList.map(n=>n.stopName)).ratings
			.sort((a, b) => b.rating - a.rating);

		if(sorted_name_list[0].rating == 1) {
			stopName = sorted_name_list[0].target;
		}
		else if(sorted_name_list[0].rating > 0.7 && sorted_name_list[1].rating < 0.7) {
			// If we hit here, we default to top choice since we have 70% match or above on one, and less than 70% on any further stop.
			// Basically this is a "best guess".
			defaulted = true;
			stopName = sorted_name_list[0].target;
		}
		else {
			for(let i = 0; i < ARBITRARY_LIMIT; i++) {
				topStops.push(sorted_name_list[i].target);
			}
			return message.channel.send(`Could not find a stop name close to what was given, please try again. Close contestants were: \`${topStops.join(', ')}\``);
		}

		// Let's deal with the pokemonList
		if(!leaderInfo[2]) leaderInfo[2] = '';

		// Let's start adding to the database
		let stopObj = stopList.filter(stop => stop.stopName == stopName);
		if(!stopObj[0]) return message.channel.send(`There was an error in finding the pokestop name \`${stopName}\` in the database. This shouldn't happen, <@129714945238630400> you need to see this.`);

		stopObj = stopObj[0];
		const date = new Date();

		try{
			await this.client.rocketLeaders.create({
				guildId: message.guild.id,
				messageURL: message.url,
				stopId: stopObj.id,
				leaderName: leaderInfo[0].trim(),
				leaderLineup: leaderInfo[2],
				spawnDate: date.toString(),
			});
			if(defaulted) return message.channel.send(`Rocket leader encounter added to database!\n**Please Note**: An exact pokestop name could not be matched, a close match was found with \`${stopName}\`. The encounter was slotted on this stop instead.`);
			return message.channel.send('Rocket leader encounter added to database!');
		}
		catch(e) {
			console.log(e);
			return message.channel.send(`There was an error saving to database \`${stopName}\`. This shouldn't happen, <@129714945238630400> you need to see this.`);
		}
	}
}

module.exports = DisableCommand;
