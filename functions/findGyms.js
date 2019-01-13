const stringSimilarity = require('string-similarity');
// https://www.npmjs.com/package/string-similarity#examples-1

module.exports = {
	getGymNames: async function(client, channel_gym) {
		return new Promise(async (resolve) => {
			// If the gym wasn't found with an exact match, pull all entries
			// from the database
			const gymList = await client.Gyms.findAll({ attributes: ['GymName', 'userIds', 'timesPinged', 'gymDirections', 'gymMap', 'exRaidNumber', 'exRaidEligibility'] });
			const results = [];
			let found;
			let gym;

			// use stringsimilarity to find how similar each gym name is to the given search name
			// The sort it such that highest match is at index 0
			// then filter out any entries below 0.3
			// And at the end keep only the name
			const sorted_name_list = stringSimilarity.findBestMatch(channel_gym, gymList.map(n=>n.GymName)).ratings.sort((a, b) => b.rating - a.rating).filter(m=>m.rating > 0.3).map(sorted => sorted.target);

			for(let i = 0; i < sorted_name_list.length; i++) {
				results.push(gymList.find(sgym => sgym.GymName == sorted_name_list[i]));
			}

			if(results.length == 1) {
				found = true;
				gym = results[0];
				channel_gym = results[0].GymName;
			}
			else if(results.length > 1) {
				found = true;
				console.log('more than one gym found');
			}

			// results needs to be an array of gym objects
			const return_array = [results, found, gym, channel_gym];
			resolve(return_array);
		});
	},
};
