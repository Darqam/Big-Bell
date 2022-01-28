const { filterGymNames, filterUserGymNames } = require('../functions/autoCompleteGyms.js');

module.exports = {
    name: 'interactionCreate',
    execute(interaction) {
        if (!interaction.isCommand() && !interaction.isAutocomplete) return;

        if (interaction.isCommand()) {
            handleCommand(interaction);
        }
        else if (interaction.isAutocomplete()) {
            handleAutocomplete(interaction);
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
    // Get what was typed
    const focusedValue = interaction.options.getFocused();

    const gymAutocompleteCommands = ['add'];
    const userGymAutoCompleteCommands = ['remove'];

    if (gymAutocompleteCommands.includes(interaction.commandName)) {
        const gyms = await filterGymNames(interaction.client, focusedValue, interaction.guildId)
        gymNames = gyms.map(g => g.gymName)

        const response = await interaction.respond(
            gymNames.map(choice => ({name: choice, value: choice})),
        );

        // console.log(response)
    } else if(userGymAutoCompleteCommands.includes(interaction.commandName)) {
        const gyms = await filterUserGymNames(interaction, focusedValue);

        if (gyms.length > 0) {
            gymNames = gyms.map(g => g.gymName)
            
            // Add an option for all gyms
            gymNames.push('all');

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

    }

    
}
