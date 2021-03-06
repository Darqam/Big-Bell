const { Command } = require('discord-akairo');
const stringSimilarity = require('string-similarity');

class RocketLeaderCommand extends Command {
	constructor() {
		super('rocketLeader', {
			aliases: ['rocket', 'leader', 'rl'],
			category: 'general',
			description: {
				content: 'Adds an entry for a rocket leader battle.',
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

		const stopList = await message.client.pokestops.findAll();
		const ARBITRARY_LIMIT = 5;
		let stopName = '';
		const topStops = [];
		let defaulted = false;

		let sorted_name_list;
		const ratings = stringSimilarity.findBestMatch(leaderInfo[1].toLowerCase().trim(), stopList.map(n=>n.stopName.toLowerCase())).ratings;

		for(let i = 0; i < stopList.length; i++) {
			// Although the matching was done for lowercase, keep target names with uppercase
			ratings[i].target = stopList[i].stopName;
		}

		const sorted_lowercase_names_list = ratings.sort((a, b) => b.rating - a.rating);

		if(sorted_lowercase_names_list.filter(x => x.rating == 1).length == 1) {
			stopName = sorted_lowercase_names_list[0].target;
		}
		else if(sorted_lowercase_names_list[0].rating > 0.7 && sorted_lowercase_names_list[1].rating < 0.6) {
			// If we hit here, we default to top choice since we have 60% match or above on one, and less than 50% on any further stop.
			// Basically this is a "best guess".
			defaulted = true;
			stopName = sorted_lowercase_names_list[0].target;
		}

		if(!stopName) {
			sorted_name_list = stringSimilarity.findBestMatch(leaderInfo[1].trim(), stopList.map(n=>n.stopName)).ratings
				.sort((a, b) => b.rating - a.rating);

			if(sorted_name_list[0].rating == 1) {
				stopName = sorted_name_list[0].target;
			}
			else if(sorted_name_list[0].rating > 0.7 && sorted_name_list[1].rating < 0.6) {
				// If we hit here, we default to top choice since we have 70% match or above on one, and less than 70% on any further stop.
				// Basically this is a "best guess".
				defaulted = true;
				stopName = sorted_name_list[0].target;
			}
		}


		if(!stopName) {
			// We still don't have a good match.
			// Let's loop through both lowercase matches and uppercase matches and add
			let j = 0;
			let i = 0;
			for(let idx = 0; idx < ARBITRARY_LIMIT; idx++) {
				if(sorted_name_list[i].rating > sorted_lowercase_names_list[j].rating) {
					if(topStops.includes(sorted_name_list[i].target)) {
						i++;
						idx--;
						continue;
					}
					topStops.push(sorted_name_list[i].target);
					i++;
				}
				else {
					if(topStops.includes(sorted_lowercase_names_list[j].target)) {
						j++;
						idx--;
						continue;
					}
					topStops.push(sorted_lowercase_names_list[j].target);
					j++;
				}
			}

			return message.channel.send(`Could not find a unique stop name close to what was given, please try again. Close contestants were: \`${topStops.join(', ')}\``);
		}

		// Let's deal with the pokemonList
		if(!leaderInfo[2]) leaderInfo[2] = '';

		// Let's start adding to the database
		let stopObj = stopList.filter(stop => stop.stopName == stopName);
		if(!stopObj[0]) {
			stopObj = stopList.filter(stop => stop.stopName.toLowerCase() == stopName.toLowerCase());
			if(!stopObj[0]) {
				return message.channel.send(`There was an error in finding the pokestop name \`${stopName}\` in the database. This shouldn't happen, <@129714945238630400> you need to see this.`);
			}
		}

		stopObj = stopObj[0];
		const date = new Date();

		const curr = await this.client.rocketLeaders.findAll();
		const currentStops = curr.map(x => x.stopName);

		if(currentStops.includes(stopObj.stopName)) {
			return message.channel.send(`There is already a leader called out at \`${stopObj.stopName}\`, did not add this request to the database.`);
		}

		const niceLeader = `${stopLeader[0].toUpperCase()}${stopLeader.substring(1)}`;
		try{
			await this.client.rocketLeaders.create({
				guildId: message.guild.id,
				messageURL: message.url,
				stopId: stopObj.id,
				stopCoordinates: stopObj.coordinates,
				stopName: stopObj.stopName,
				leaderName: niceLeader,
				leaderLineup: leaderInfo[2].trim(),
				spawnDate: date.toString(),
			});
			const details = `\nLeader: \`${niceLeader}\`, Pokestop: \`${stopObj.stopName}\`, Extra info: \`${leaderInfo[2].trim()}\``;
			if(defaulted) return message.channel.send(`Rocket leader encounter added to database!\n**Please Note**: An exact pokestop name could not be matched, a close match was found with \`${stopName}\`. The encounter was slotted on this stop instead.${details}`);
			return message.channel.send(`Rocket leader encounter added to database!${details}`);
		}
		catch(e) {
			console.log(e);
			return message.channel.send(`There was an error saving to database \`${stopName}\`. This shouldn't happen, <@129714945238630400> you need to see this.`);
		}
	}
}

module.exports = RocketLeaderCommand;
