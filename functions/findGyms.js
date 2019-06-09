const stringSimilarity = require('string-similarity');
// https://www.npmjs.com/package/string-similarity#examples-1

module.exports = {
	getGymNames: async function(client, channel_gym) {
		return new Promise(async (resolve) => {
			// If the gym wasn't found with an exact match, pull all entries
			// from the database
			const gymList = await client.Gyms.findAll({ attributes: ['gymName', 'guildId', 'timesPinged', 'gymDirections', 'gymMap', 'exRaidNumber', 'exRaidEligibility'] });
			const ARBITRARY_LIMIT = 10;
			const results = [];
			let found = false;

			// use stringsimilarity to find how similar each gym name is to the given search name
			// The sort it such that highest match is at index 0
			// And at the end keep only the names
			// https://www.npmjs.com/package/string-similarity#examples-1
			const sorted_name_list = stringSimilarity.findBestMatch(channel_gym, gymList.map(n=>n.gymName)).ratings
				.sort((a, b) => b.rating - a.rating)
				.map(sorted => sorted.target);

			// Now we grab the relevant gym objects and push them to results
			for(let i = 0; i < ARBITRARY_LIMIT; i++) {
				results.push(gymList.find(sgym => sgym.gymName == sorted_name_list[i]));
			}

			if(results.length > 1) {
				found = true;
				console.log('more than one gym found');
			}

			// results needs to be an array of gym objects
			const return_array = [results, found];
			resolve(return_array);
		});
	},
};
