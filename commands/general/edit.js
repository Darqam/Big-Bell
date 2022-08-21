const { ActionRowBuilder, ModalBuilder,
    TextInputBuilder, TextInputStyle, SlashCommandBuilder } = require('discord.js');
const { cacheUserGymList, cacheGymList } = require('../../functions/cacheMethods.js');
const { sanitizeArgs } = require('../../functions/sanitize');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit')
        .setDescription('Edits a tracked gym')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the gym')
                .setRequired(true)
                .setAutocomplete(true)
        ),

		
    async execute(interaction) {
        gymName = interaction.options.getString('name')
        gymName = gymName.trim().replace('’', '\'');

        const matchingGyms = interaction.client.gymList.filter(g => g.gymName == gymName);

        if (!matchingGyms || matchingGyms.length < 1) {
            return interaction.reply({content: `⚠️ Could not find a gym by the name of \`${gymName}\``, ephemeral:true});
        }

        const user = interaction.user;
        // Populate cache if needed
        if (!interaction.client.userGymList[user.id].includes(gymName)) {
            await cacheUserGymList(interaction.client, interaction.user)
        }

        const userGym = interaction.client.userGymList[user.id].find(ug => ug.gymId = matchingGyms[0].id);

        const modal = new ModalBuilder()
			.setCustomId(`edit-${userGym.gymId}`)
			.setTitle(gymName)
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('disabled')
                    .setLabel("Disable gym alert?")
                    // Paragraph means multiple lines of text.
                    .setValue(userGym.disabled ? 'True' : 'False')
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('start')
                    // The label is the prompt the user sees for this input
                    .setLabel("Alert start time")
                    .setValue(userGym.timeStart ?? '')
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('end')
                    // The label is the prompt the user sees for this input
                    .setLabel("Alert end time")
                    .setValue(userGym.timeStop ?? '')
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short),
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('levels')
                    .setLabel("Egg levels(comma separated, or \`all\`)")
                    // Paragraph means multiple lines of text.
                    .setValue(userGym.raidLevels)
                    .setStyle(TextInputStyle.Short)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('pokemons')
                    .setLabel("Pokemons (empty = all mons)")
                    // Paragraph means multiple lines of text.
                    .setPlaceholder('Bulbasaur,Squirttle,Charmander')
                    .setValue(userGym.pokemons)
                    .setRequired(false)
                    .setStyle(TextInputStyle.Paragraph)
                )
                
            )
        await interaction.showModal(modal)
    },

    async handleModal(interaction) {
        // Construct our args here for easier handling
        args = {}
        updateObj = {}

        for ([optId, option] of interaction.fields.fields) {
            args[optId] = option.value
        }

        // Validate all of our args
        let sanitized, errorM, parsedArgs;
        try {
            [sanitized, errorM, parsedArgs] = sanitizeArgs(args);

            if(sanitized == 1) return interaction.reply({content: `⚠️ ${errorM}`, ephemeral:true});
        } catch (e) {
            console.error(e);
            console.error(`In sanitizing for add, ${interaction.options.data}`)

            return interaction.reply({content: '‼️ There was an issue in sanitizing arguments, please check your inputs or contact Anhim.', ephemeral:true});
        }

        // Build the update object for the database update
        if(parsedArgs.disabled) {
			updateObj.disabled = parsedArgs.disabled == 'true' ? 1 : 0;
		}

		if(parsedArgs.start) updateObj.timeStart = parsedArgs.start;
		if(parsedArgs.end) updateObj.timeStop = parsedArgs.end;

		if(args.levels) updateObj.raidLevels = parsedArgs.levels.join();
		if(args.pokemons) updateObj.pokemons = parsedArgs.pokemons.join();

        // Grab the gym from the customId
        // Custom id is of the form 'modalName-GymId'
        
        const gymId = parseInt(interaction.customId.split('-')[1]);

        let gym = interaction.client.gymList.filter(g => g.id == gymId)[0]
        if(!gym) {
            cacheGymList(interaction.client);
            gym = interaction.client.gymList.filter(g => g.id == gymId)[0];
        }
        if (!gym) {
            return interaction.reply({content: `⚠️ Could not locate gym in DB`, ephemeral:true});
        }

        // Update the entry
        const affectedRows = await interaction.client.UserGyms.update(updateObj,
            { where :
                {
                    userId: interaction.user.id,
                    gymName: gym.gymName,
                },
            },
        );

        if(affectedRows > 0) {
            cacheUserGymList(interaction.client, interaction.user);
            return await interaction.reply({content: `Updated preferences for ${gym.gymName}`, ephemeral: true});
        }

        return await interaction.reply({content: `⚠️ There was an error updating database for ${gym.gymName}`, ephemeral:true});
    }
}