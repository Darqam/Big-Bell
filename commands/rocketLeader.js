const { SlashCommandBuilder } = require('@discordjs/builders');
const { cacheStopList } = require('../functions/cacheMethods.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('rocket_leader')
        .setDescription('Adds a rocket leader to a given stop.')
        .addStringOption(option =>
            option.setName('pokestop_name')
                .setDescription('The name of the pokestop')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option => 
            option.setName('leader')
                .setDescription('Name of the rocket leader.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option => 
            option.setName('loadout')
                .setDescription('Pokemon loadout, separated by commas')
                .setRequired(false)
        ),
    async execute(interaction) {
        // Get our values first
        let stopName = interaction.options.getString('pokestop_name');
        stopName = stopName.trim().replace('’', '\'');

        let leader = interaction.options.getString('leader');
        leader = leader.trim();
        // ensure starts with capital, rest lowercase
        leader = `${leader[0].toUpperCase()}${leader.substring(1).toLowerCase()}`;

        let loadout = interaction.options.getString('loadout');
        loadout = loadout?.trim();
        // This just to avoid null in db
        if (!loadout) loadout = '';

        // ---------------------
        // Validate stop name
        // ---------------------
        if (!interaction.client.stopList) await cacheStopList;

        matchingStop = interaction.client.stopList.filter(g => g.stopName == stopName);

        if (!matchingStop || matchingStop.length < 1) {
            return interaction.reply({
                content: `⚠️ Could not find a pokestop by the name of \`${stopName}\``,
                ephemeral:true,
            });
        }
        const stopObj = matchingStop[0];

        // ---------------------
        // Validate leader
        // ---------------------
        const validLeaders = interaction.client.ValidRocketLeaders;
        if (!validLeaders.includes(leader.toLowerCase())) {
            return interaction.reply({
                content: `⚠️ The rocket leader name is not one of \`${validLeaders.join(', ')}\``,
                ephemeral: true,
            });
        }

        // -------------------
        // Ensure we don't already have a leader at this stop
        // -------------------
        const curr = await interaction.client.RocketLeaders.findAll();
		const currentStops = curr.map(x => x.stopName);

		if(currentStops.includes(stopName)) {
			return interaction.reply({
                content: `⚠️ There is already a leader called out at \`${stopName}\`, did not add this request to the database.`,
                ephemeral: true,
            });
		}
        
        // -------------------
        // Try to save leader to the stop
        // -------------------
        const date = new Date();

        try {
			await interaction.client.RocketLeaders.create({
				guildId: interaction.guildId,
				messageURL: '',
				stopId: stopObj.id,
				stopCoordinates: stopObj.coordinates,
				stopName: stopObj.stopName,
				leaderName: leader,
				leaderLineup: loadout,
				spawnDate: date.toString(),
			});

			return interaction.reply({
                content: `Rocket leader encounter added to database!\nLeader: \`${leader}\`, Pokestop: \`${stopName}\`, Extra info: \`${loadout}\``,
                ephemeral: true,
            });
		}
		catch(e) {
			console.error(e);
            console.error(`Error in rockerLeader command, while running ${interaction.options.data}`);
			return interaction.reply({
                content: `⚠️ There was an error saving to database \`${stopName}\`. This shouldn't happen. Please contact Anhim about this.`,
                ephemeral: true,
            });
		}

    }
}