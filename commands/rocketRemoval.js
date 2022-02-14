const { SlashCommandBuilder } = require('@discordjs/builders');
const { cacheUserGymList } = require('../functions/cacheMethods.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_rocket')
        .setDescription('Removes the rocket leader from this stop.')
        .addStringOption(option =>
            option.setName('rocket_stop_name')
                .setDescription('The name of the pokestop')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async execute(interaction) {
        // First we handle making sure that the gym name we got is a valid entry based on our cache
        stopName = interaction.options.getString('rocket_stop_name')
        stopName = stopName.trim().replace('’', '\'');

        // ----------------------
        // Deal with potential schenanigans
        // ----------------------
        if (stopName.toLowerCase() === 'no pokestop in list') {
            return interaction.reply({
                content: '*Angry Victreebel noises*',
                ephemeral: true,
            });
        }

        // -----------------------
        // Deal with clearing stop
        // -----------------------
        
        // Fetch from DB 
        const rocketStop = await interaction.client.RocketLeaders.findOne({
            where: {
                guildId: interaction.guildId,
                stopName: stopName,
            },
        });

        if (!rocketStop) {
            return interaction.reply({content: `⚠️ Could not find a rocket leader at \`${stopName}\``, ephemeral:true});
        }

        // Try to remove
        try{
            await interaction.client.RocketLeaders.destroy({
                where: {
                    guildId: interaction.guildId,
                    stopName: stopName,
                }
            });
            return interaction.reply({content: `Successfully removed the rocket leader from \`${stopName}\``, ephemeral: true});
        }
        catch(e) {
            interaction.reply({content: `⚠️ There was an unexpected error in removing rocket leader from ${stopName}, please contact Anhim about this.`, ephemeral:true});
            console.error(e);
            console.error(`Error removing rocket leader in rocketRemove command with ${interaction.options.data}`);
        }
        
    }
}