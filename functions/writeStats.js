module.exports = {
	writeStats: async function(client, gymName) {
		const date = new Date().getTime();
		try {
			await client.Stats.create({
				timestamp: date,
				gymName: gymName,
			});
		}
		catch (e) {
			console.log('Error saving gym creation to stats.', e);
		}
	},
};
