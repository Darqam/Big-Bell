module.exports = {
	writeStats: async function(client, gymName, guildId, pokemon) {
		const date = new Date().getTime();
		try {
			await client.Stats.create({
				timestamp: date,
				gymName: gymName,
				guildId: guildId,
				pokemon: pokemon,
			});
		}
		catch (e) {
			console.log('Error saving gym creation to stats.', e);
		}
	},
};
