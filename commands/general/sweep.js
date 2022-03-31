const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sweep')
		.setDescription('Forces a database purge of outdated content.'),
	async execute(interaction) {

        if (!interaction.guildId) return interaction.reply({content: '⚠️ This command needs to be run in guild.', ephemeral: true});

		const liveRaids = await interaction.client.LiveRaids.findAll({
			where: {
				guildId: interaction.guildId,
			},
		});

		// Grab all the ids from the liveRaids into an array then,
		// if the channel doesn't exist, or it exists but starts with 'archived' sort it as invalid
		const invalidChannels = liveRaids.map(x => x.dataValues.channelId).filter(chan =>
			!interaction.guild.channels.cache.has(chan) || interaction.guild.channels.cache.get(chan).name.startsWith('archived')
		);

		invalidChannels.forEach(chan => {
			interaction.client.LiveRaids.destroy({ where:{ channelId: chan } });
		});
		interaction.reply({content: `Removed ${invalidChannels.length} entries from live raids database.`, ephemeral: true});
	},
};
