const FuzzySearch = require('fuzzy-search');

module.exports = {
	getGymNames: async function(client, channel_gym) {
		return new Promise(async (resolve) => {
			// If the gym wasn't found with an exact match, pull all entries
			// from the database
			const gymList = await client.Gyms.findAll({ attributes: ['GymName', 'userIds', 'timesPinged', 'gymDirections', 'gymMap', 'exRaidNumber', 'exRaidEligibility'] });
			let results = [];
			let found;
			let gym;

			const searcher = new FuzzySearch(gymList, ['GymName'], {
				caseSensitive: true,
				sort: true,
			});

			results = searcher.search(channel_gym);
			if(results.length == 1) {
				found = true;
				gym = results[0];
				channel_gym = results[0].GymName;
			}
			else if(results.length > 1) {
				found = true;
				console.log('more than one gym found');
			}

			const return_array = [results, found, gym, channel_gym];
			resolve(return_array);
		});
	},
};
