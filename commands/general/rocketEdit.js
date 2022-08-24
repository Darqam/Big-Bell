const { ActionRowBuilder, ModalBuilder,
    TextInputBuilder, TextInputStyle, SlashCommandBuilder } = require('discord.js');
const { cacheUserGymList, cacheGymList, cacheRocketLeaders } = require('../../functions/cacheMethods.js');
const { sanitizeArgs } = require('../../functions/sanitize');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rocket_edit')
        .setDescription('Edits a team rocket stop')
        .addStringOption(option =>
            option.setName('rocket_stop_name')
                .setDescription('The name of the pokestop')
                .setRequired(true)
                .setAutocomplete(true)
        ),

		
    async execute(interaction) {
        stopName = interaction.options.getString('rocket_stop_name')
        stopName = stopName.trim().replace('’', '\'');

        const matchingStops = interaction.client.rocketLeaders.filter(s => s.stopName == stopName);

        if (!matchingStops || matchingStops.length < 1) {
            return interaction.reply({content: `⚠️ Could not find a gym by the name of \`${stopName}\``, ephemeral:true});
        }

        const rocketStop = interaction.client.rocketLeaders.find(rs => rs.id == matchingStops[0].id);

        const modal = new ModalBuilder()
			.setCustomId(`rocket_edit-${rocketStop.id}`)
			.setTitle(rocketStop.stopName)
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('pokestop_name')
                    // The label is the prompt the user sees for this input
                    .setLabel("Pokestop Name")
                    .setValue(rocketStop.stopName)
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('leader')
                    // The label is the prompt the user sees for this input
                    .setLabel("Leader present at the stop")
                    .setValue(rocketStop.leaderName)
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short),
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('loadout')
                    .setLabel("Leader linup (if know)")
                    // Paragraph means multiple lines of text.
                    .setValue(rocketStop.leaderLineup)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)
                )
            )
        await interaction.showModal(modal)
    },

    async handleModal(interaction) {
        args = {}
        updateObj = {}

        for ([optId, option] of interaction.fields.fields) {
            args[optId] = option.value
        }

        // Validate all of our args
        let sanitized, errorM, parsedArgs;
        try {
            [sanitized, errorM, parsedArgs] = sanitizeArgs(args, interaction.client);

            if(sanitized == 1) return interaction.reply({content: `⚠️ ${errorM}`, ephemeral:true});
        } catch (e) {
            console.error(e);
            console.error('In sanitizing for rocket_edit')

            return interaction.reply({content: '‼️ There was an issue in sanitizing arguments, please check your inputs or contact Anhim.', ephemeral:true});
        }

        // -------------------
        // Ensure we already have a leader at this stop
        // -------------------
        const rocketId = parseInt(interaction.customId.split('-')[1]);

        await cacheRocketLeaders(interaction.client);
		const currentStops = interaction.client.rocketLeaders.map(x => x.id);

		if(!currentStops.includes(rocketId)) {
			return interaction.reply({
                content: `⚠️ There is no leader called out at \`${stopName}\`, aborting edit.`,
                ephemeral: true,
            });
		}

        

        const currentStop = interaction.client.rocketLeaders.filter(x => x.id == rocketId)[0];

        // If it's not the same we might have a stop change, so need to update a few things
        if (currentStop.pokestop_name != parsedArgs.pokestop_name) {
            const pokestop = interaction.client.stopList.filter(s => s.stopName == parsedArgs.pokestop_name)[0];
            if (!pokestop) {
                return interaction.reply({
                    content: `⚠️ Could not find a pokestop by the name \`${parsedArgs.pokestop_name}\`, aborting edit.`,
                    ephemeral: true,
                });
            }
            updateObj.stopId = pokestop.id;
            updateObj.stopCoordinates = pokestop.coordinates;

            // --------------------
            // Ensure there's not already a rocket stop here
            // --------------------
            const existingStop = interaction.client.rocketLeaders.filter(x => x.stopId == pokestop.id)[0];
            if (existingStop) {
                return interaction.reply({
                    content: `⚠️ There is already a leader reported at \`${parsedArgs.pokestop_name}\`, aborting edit.`,
                    ephemeral: true,
                });
            }

        }

        // Build the update object for the database update
        updateObj.stopName = parsedArgs.pokestop_name;
        updateObj.leaderName = parsedArgs.leader;
        updateObj.leaderLineup = parsedArgs.lineup;
        
        // Grab the gym from the customId
        // Custom id is of the form 'modalName-rocketStopId'
        const rocketStopId = parseInt(interaction.customId.split('-')[1]);

        // Update the entry
        const affectedRows = await interaction.client.RocketLeaders.update(updateObj,
            { where :
                {
                    id: rocketStopId,
                },
            },
        );

        if(affectedRows > 0) {
            cacheRocketLeaders(interaction.client);
            return await interaction.reply({
                content: `Updated preferences for ${parsedArgs.pokestop_name}`,
                ephemeral: true
            });
        }

        return await interaction.reply({
            content: `⚠️ There was an error updating database for ${parsedArgs.pokestop_name}`,
            ephemeral:true
        });
    }
}