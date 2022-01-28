const { SlashCommandBuilder } = require('@discordjs/builders');
const { sanitizeArgs } = require('../functions/sanitize');
const { cacheUserGymList } = require('../functions/cacheMethods.js');


function setDefaults(args) {
    // we want a few defaults if certain args were not passed
    if (!('start' in args)) args.start = '00:00';
    if (!('end' in args)) args.end = '23:59';
    if (!('levels' in args)) args.levels = '1, 2, 3, 4, 5, 7';

    return args
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Adds you to a gym')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the gym')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('start')
                .setDescription('Time when you wish alerts to start (defaults all day).')
                .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('end')
            .setDescription('Time when you wish alerts to stop (defaults all day).')
            .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('levels')
            .setDescription('Egg leves to notify, separated by commas (defaults all).')
            .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('pokemons')
            .setDescription('Exlusive pokemon list for notification (defaults all).')
            .setRequired(false)
        ),
    async execute(interaction) {
        // First we handle making sure that the gym name we got is a valid entry based on our cache
        gymName = interaction.options.getString('name')
        gymName = gymName.trim().replace('’', '\'');

        matchingGym = interaction.client.gymList.filter(g => g.gymName == gymName);

        if (!matchingGym || matchingGym.length < 1) {
            return interaction.reply({content: `⚠️ Could not find a gym by the name of \`${gymName}\``, ephemeral:true});
        }

        // Construct our args here for easier handling
        args = {}

        for (option of interaction.options.data) {
            args[option.name] = option.value
        }

        args = setDefaults(args);

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

        // Fetch gym from database to double check things
        const gym = await interaction.client.Gyms.findOne({
            where: {
                guildId: interaction.guildId,
                gymName: gymName,
            },
        });

        if (!gym) return interaction.reply({content: '‼️ \`${gymName}\` was in the local cache but not in the database, this should *NOT* happen, please contact Anhim about this.', ephemeral:true});

        const userGym = await interaction.client.UserGyms.findOne({
            where: {
                gymName: gymName,
                userId: interaction.user.id,
            },
        });

        // If the user already monitors this gym, continue
        if(userGym) return interaction.reply({content: `⚠️ You are already subscribed to \`${gymName}\``, ephemeral:true});
        

        try{
            await interaction.client.UserGyms.create({
                userId: interaction.user.id,
                gymId: gym.id,
                gymName: gym.gymName,
                timeStart: parsedArgs.start,
                timeStop: parsedArgs.end,
                disabled: 0, // 1 or 0
                raidLevels: parsedArgs.levels.join(), // "2,4,5"
                pokemons: args.pokemons ? parsedArgs.pokemons.join() : '',
            });

            // No need to await this promise
            cacheUserGymList(interaction.client, interaction.user);

            return interaction.reply({content: `Successfully added you to \`${gymName}\``, ephemeral: true});
        }
        catch(e) {
            interaction.reply({content: `⚠️ There was an unexpected error in updating your monitor list, please contact Anhim about this.`, ephemeral:true});
            console.error(e);
            console.error(`Error adding to userGyms in add command with ${interaction.options.data}`);
        }
        
    }
}