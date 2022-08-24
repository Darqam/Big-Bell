const stringSimilarity = require('string-similarity');
const { cacheGymList, cacheUserGymList, cacheStopList } = require('./cacheMethods.js');


function arrayStringMatch(stringArray, needle) {
	// use stringsimilarity to find how similar each gym name is to the given search name
	// The sort it such that highest match is at index 0
	// And at the end keep only the names
	// https://www.npmjs.com/package/string-similarity#examples-1
	const sorted_name_list = stringSimilarity.findBestMatch(needle, stringArray).ratings
		.sort((a, b) => b.rating - a.rating)
		.map(sorted => sorted.target);

	return sorted_name_list;
}

function sortMinimalArray(entries, prop, needle, return_limit=10) {
	// Return empty if empty
	if (entries.length < 1) return [];

	// Obtain our sorted entries
	const sortedNameArray = arrayStringMatch(entries.map(g => g[prop]), needle)

	// Limit to top N
	const results = [];
	if (entries.length > 0) {
		for (let i = 0; i < return_limit; i++) {
			if (!sortedNameArray[i]) break;

			results.push(entries.find(entry => entry[prop] == sortedNameArray[i]));
		}
	}

	return results;
}

async function filterGymNames(interaction, focusedValue, return_limit=10) {
	// We start by making sure we have a cached gym list
	if (!interaction.client.gymList) await cacheGymList(interaction.client);

	// We first make sure we have things for the right guild
	const gymList = interaction.client.gymList.filter(g => g.guildId == interaction.guildId);

	// Now we grab the relevant gym objects and push them to results
	const results = sortMinimalArray(gymList, 'gymName', focusedValue, return_limit);

	return results;
}

async function filterUserGymNames(interaction, focusedValue, return_limit=10) {
	// We start by making sure we have a cached gym list
	if (!interaction.client.userGymList || !interaction.client.userGymList[interaction.user.id]) {
		await cacheUserGymList(interaction.client, interaction.user);
	}

	const userGymList = interaction.client.userGymList[interaction.user.id]

	const results = sortMinimalArray(userGymList, 'gymName', focusedValue);
	
	return results;
}

async function filterStopNames(interaction, focusedValue, return_limit=10) {
	// We start by making sure we have a cached stop list
	if (!interaction.client.stopList) {
		await cacheStopList(interaction.client, interaction.user);
	}

	// We first make sure we have things for the right guild
	const stopList = interaction.client.stopList; // .filter(g => g.guildId == interaction.guildId);

	const results = sortMinimalArray(stopList, 'stopName', focusedValue);

	return results;
}

function filterLeaderNames(interaction, focusedValue) {
	return arrayStringMatch(interaction.client.ValidRocketLeaders, focusedValue);
	
}

async function filterRocketStops(interaction, focusedValue, return_limit=10) {
	const rocketStops = await interaction.client.RocketLeaders.findAll();

	const results = sortMinimalArray(rocketStops, 'stopName', focusedValue);
	return results;
}

module.exports = {
	filterGymNames: filterGymNames,
	filterUserGymNames: filterUserGymNames,
	filterStopNames: filterStopNames,
	filterLeaderNames: filterLeaderNames,
	filterRocketStops: filterRocketStops,
}
