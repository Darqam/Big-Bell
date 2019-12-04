const { Command } = require('discord-akairo');
const stringSimilarity = require('string-similarity');

class RocketEditCommand extends Command {
	constructor() {
		super('rocketEdit', {
			aliases: ['rocketedit', 'redit', 're'],
			category: 'general',
			description: {
				content: 'Edits an entry for a rocket encounter.',
				usage: 'leader name; Pokestop name; pokemon 1, pokemon 2, pokemon 3',
				examples: ['North Park; Cliff; Meowth, Snorlax, Tyranitar', 'North Park; Cliff'],
			},
			args: [
				{
					id: 'leaderInfo',
					match: 'content',
				},
			],
		});
	}

	async exec(message, args) {
		if(!args.leaderInfo) return message.reply('No stops found in query');
		const leaderNames = ['giovanni?', 'giovanni', 'cliff', 'sierra', 'arlo', 'unknown', 'decoy'];
		const leaderInfo = args.leaderInfo.trim().split(';');

		// Here we check leader name info
		if(!leaderNames.includes(leaderInfo[0].toLowerCase().trim())) return message.channel.send(`The given rocket leader does not match ${leaderNames.join(', ')}.`);
		const stopLeader = leaderInfo[0].trim();

		// Now we check pokestop name
		if(!leaderInfo[1] || !leaderInfo[1].trim()) return message.channel.send('Missing pokestop name');

		const stopList = await message.client.rocketLeaders.findAll();
		const ARBITRARY_LIMIT = 5;
		let stopName = '';
		const topStops = [];
		let defaulted = false;

		const sorted_name_list = stringSimilarity.findBestMatch(leaderInfo[1].trim(), stopList.map(n=>n.stopName)).ratings
			.sort((a, b) => b.rating - a.rating);

		const sorted_lowercase_names_list = stringSimilarity.findBestMatch(leaderInfo[1].toLowerCase().trim(), stopList.map(n=>n.stopName.toLowerCase())).ratings
			.sort((a, b) => b.rating - a.rating);

		if(sorted_name_list[0].rating == 1 || (sorted_name_list.length == 1 && sorted_name_list[0].rating > 0.5)) {
			stopName = sorted_name_list[0].target;
		}
		else if(sorted_name_list[0].rating > 0.7 && sorted_name_list[1].rating < 0.6) {
			// If we hit here, we default to top choice since we have 70% match or above on one, and less than 70% on any further stop.
			// Basically this is a "best guess".
			defaulted = true;
			stopName = sorted_name_list[0].target;
		}
		else if(sorted_lowercase_names_list[0].rating == 1) {
			stopName = sorted_lowercase_names_list[0].target;
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

		let stopObj = stopList.filter(stop => stop.stopName == stopName);
		if(!stopObj[0]) {
			stopObj = stopList.filter(stop => stop.stopName.toLowerCase() == stopName.toLowerCase());
			if(!stopObj[0]) {
				return message.channel.send(`There was an error in finding the pokestop name \`${stopName}\` in the database. This shouldn't happen, <@129714945238630400> you need to see this.`);
			}
		}

		stopObj = stopObj[0];
		// At this point we have a confirmed leader and stop name

		// Let's deal with the pokemonList
		// If nothing is given, grab existing list
		if(!leaderInfo[2]) leaderInfo[2] = stopObj.leaderLineup;

		const niceLeader = `${stopLeader[0].toUpperCase()}${stopLeader.substring(1)}`;
		try{
			await this.client.rocketLeaders.update({
				messageURL: message.url,
				leaderName: niceLeader,
				leaderLineup: leaderInfo[2].trim(),
			}, {
				where: {
					stopName: stopObj.stopName,
				},
			});
			const details = `\nLeader: \`${niceLeader}\`, Pokestop: \`${stopObj.stopName}\`, Extra info: \`${leaderInfo[2].trim()}\``;
			if(defaulted) return message.channel.send(`Rocket leader encounter was updated!\n**Please Note**: An exact pokestop name could not be matched, a close match was found with \`${stopName}\`. The encounter was updated for this stop instead.${details}`);
			return message.channel.send(`Rocket leader encounter was updated${details}`);
		}
		catch(e) {
			console.log(e);
			return message.channel.send(`There was an error saving to database \`${stopName}\`. This shouldn't happen, <@129714945238630400> you need to see this.`);
		}
	}
}

module.exports = RocketEditCommand;
