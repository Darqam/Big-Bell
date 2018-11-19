module.exports = {
	writeStats: async function(client, gymName) {
		const date = new Date().getTime();
		try {
			await this.client.Stats.create({
				timestamp: date,
				GymName: gymName,
			});
		}
		catch (e) {
			console.log('Error saving gym creation to stats.', e);
		}
	},
};
