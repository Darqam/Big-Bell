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

async function filterGymNames(client, channel_gym, guildId, return_limit=10) {
	// We start by making sure we have a cached gym list
	if (!client.gymList) await cacheGymList(client);
	
	// We first make sure we have things for the right guild
	const gymList = client.gymList.filter(g => g.guildId == guildId);

	// Obtain our sorted gym names
	let sorted_name_list = arrayStringMatch(gymList.map(g => g.gymName), channel_gym)
	
	// Now we grab the relevant gym objects and push them to results
	const results = [];
	for (let i = 0; i < return_limit; i++) {
		if (!sorted_name_list[i]) break;

		results.push(gymList.find(sgym => sgym.gymName == sorted_name_list[i]));
	}

	return results;
}

async function filterUserGymNames(interaction, focusedValue, return_limit=10) {
	// We start by making sure we have a cached gym list
	if (!interaction.client.userGymList || !interaction.client.userGymList[interaction.user.id]) {
		await cacheUserGymList(interaction.client, interaction.user);
	}

	let userGymList = interaction.client.userGymList[interaction.user.id]

	// Obtain our sorted gym names
	let results = []

	if (userGymList.length > 0) {
		sorted_name_list = arrayStringMatch(userGymList.map(g => g.gymName), focusedValue)
		
		// Now we grab the relevant gym objects and push them to results
		for (let i = 0; i < return_limit; i++) {
			if (!sorted_name_list[i]) break;

			results.push(userGymList.find(sgym => sgym.gymName == sorted_name_list[i]));
		}

	}
	return results;
}

async function filterStopNames(interaction, focusedValue, return_limit=10) {
	// We start by making sure we have a cached stop list
	if (!interaction.client.stopList) {
		await cacheStopList(interaction.client, interaction.user);
	}

	// We first make sure we have things for the right guild
	const stopList = interaction.client.stopList; // .filter(g => g.guildId == interaction.guildId);

	// Obtain our sorted gym names
	let sorted_name_list = arrayStringMatch(stopList.map(g => g.stopName), focusedValue)
	
	// Now we grab the relevant gym objects and push them to results
	const results = [];
	for (let i = 0; i < return_limit; i++) {
		if (!sorted_name_list[i]) break;

		results.push(stopList.find(stop => stop.stopName == sorted_name_list[i]));
	}

	return results;
}

function filterLeaderNames(interaction, focusedValue) {
	return arrayStringMatch(interaction.client.ValidRocketLeaders, focusedValue);
	
}

module.exports = {
	filterGymNames: filterGymNames,
	filterUserGymNames: filterUserGymNames,
	filterStopNames: filterStopNames,
	filterLeaderNames: filterLeaderNames,
}
