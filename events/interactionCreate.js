const { 
    filterGymNames,
    filterUserGymNames,
    filterStopNames,
    filterLeaderNames,
    filterRocketStops
} = require('../functions/autoCompleteGyms.js');
const { InteractionType } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    execute(interaction) {
        if (interaction.type === InteractionType.ApplicationCommand) {
            handleCommand(interaction);
        }
        else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
            handleAutocomplete(interaction);
        }
        else if (interaction.type === InteractionType.ModalSubmit) {
            handleModalSubmission(interaction);
        }
        else {
            return;
        }
    }
}

async function handleCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return console.log('no command found');

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing the command.', ephemeral: true});
    }
}

async function handleAutocomplete(interaction) {
    // Get the "current" options object
    const option = interaction.options.getFocused(true);

    const gymAutocompleteCommands = ['add'];
    const userGymAutoCompleteCommands = ['remove', 'edit'];
    const stopAutocompleteCommands = ['rocket_leader'];
    const rocketStopAutocompleteCommands = ['remove_rocket', 'rocket_edit'];

    if (gymAutocompleteCommands.includes(interaction.commandName)) {
        const gyms = await filterGymNames(interaction, option.value)
        gymNames = gyms.map(g => g.gymName)

        const response = await interaction.respond(
            gymNames.map(choice => ({name: choice, value: choice})),
        );

    } else if(userGymAutoCompleteCommands.includes(interaction.commandName)) {
        const gyms = await filterUserGymNames(interaction, option.value);
        
        if (gyms.length > 0) {
            gymNames = gyms.map(g => g.gymName)
            
            // Add an option for all gyms
            if (interaction.commandName != 'edit') {
                gymNames.push('all');
            }
            

            const response = await interaction.respond(
                gymNames.map(choice => ({name: choice, value: choice})),
            );
        } else {
            interaction.respond([
                {
                    name: 'No gyms in list',
                    value: 'No gyms in list',
                }
            ]);
        }
    
    } else if(stopAutocompleteCommands.includes(interaction.commandName)) {
        // If we are doing stop name completion
        if (option.name == 'pokestop_name') {
            const stops = await filterStopNames(interaction, option.value)
            stopNames = stops.map(g => g.stopName)

            const response = await interaction.respond(
                stopNames.map(choice => ({name: choice, value: choice})),
            );
        } else if (option.name === 'leader') {
            const leaders = filterLeaderNames(interaction, option.value);
            const response = await interaction.respond(
                leaders.map(choice => ({name: choice, value: choice})),
            );
        }
    } else if (rocketStopAutocompleteCommands.includes(interaction.commandName)) {
        if (option.name === 'rocket_stop_name') {
            const leaders = await filterRocketStops(interaction, option.value);
            leaderStops = leaders.map(l => l.stopName);

            const response = await interaction.respond(
                leaderStops.map(choice => ({name: choice, value: choice})),
            );
        }
    }    
}

async function handleModalSubmission(interaction) {
    //console.log(interaction.client.commands)
    const command = interaction.client.commands.find(i => {
        const modalId = interaction.customId.split('-')[0];
        return i.data.name == modalId;
    });
    command.handleModal(interaction);
}