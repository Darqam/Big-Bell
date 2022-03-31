const { SlashCommandBuilder } = require('@discordjs/builders');
const { sanitizeArgs } = require('../../functions/sanitize');
const { cacheUserGymList } = require('../../functions/cacheMethods.js');


function setDefaults(args) {
    // we want a few defaults if certain args were not passed
    if (!('start' in args)) args.start = '00:00';
    if (!('end' in args)) args.end = '23:59';
    if (!('levels' in args)) args.levels = '1, 2, 3, 4, 5, 7';

    return args
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show_mmr')
        .setDescription('Display MMR')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to query for (mod only)')
        ),
    async execute(interaction) {
        const queryUser = interaction.options.getUser('user') || interaction.user;

        if (!interaction.guildId) return interaction.reply({content: '⚠️ Please use this command in a proper guild.', ephemeral: true});

        // Could maybe depend on interaction.member, but this grabs from cache anyway so meh
        const commandMember = await interaction.guild.members.fetch(interaction.user);
        
        // If the user is not a mod and didn't select themselves
        if(!commandMember.roles.cache.has('428292301429669890') && (queryUser && queryUser.id !== commandMember.id)) {
            return interaction.reply({content: 'Only mods may check other\'s history.', ephemeral: true});
        }

        // Loadup current season
        const seasons = await interaction.client.PvPSeason.findAll({
			where: {
				guildId: interaction.guildId,
			},
		});
		// This sorts such that newest is at entry 0
		seasons.sort((a, b) => (a.seasonId > b.seasonId) ? -1 : 1);

        if(!seasons[0] || seasons[0].seasonActive === false) {
		    return interaction.reply({content:'No active season, aborting.', ephemeral: true});
		}

		// Fetch an entry by this user's and guild's id
		// Will return null if non existing
		const mmrEntry = await interaction.client.MMR.findOne({
			where: {
				guildId: interaction.guildId,
				userID: queryUser.id,
				seasonId: seasons[0].seasonId,
			},
		});

		if(!mmrEntry) {
			return interaction.reply({content:'Could not find an MMR entry for your user id in this season.', ephemeral: true});
		}
		
        const history = JSON.parse(mmrEntry.userHistory);
        const out = history.map(h => `${h.date} - ${h.value}`);

        return interaction.reply({content: out.join('\n'), ephemeral: true});
    }
}