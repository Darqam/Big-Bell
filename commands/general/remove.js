const { SlashCommandBuilder } = require('@discordjs/builders');
const { cacheUserGymList } = require('../../functions/cacheMethods.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Removes the author from specified gym lists.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the gym')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async execute(interaction) {
        // First we handle making sure that the gym name we got is a valid entry based on our cache
        gymName = interaction.options.getString('name')
        gymName = gymName.trim().replace('’', '\'');

        // ----------------------
        // Deal with potential schenanigans
        // ----------------------
        if (gymName.toLowerCase() === 'no gyms in list') {
            return interaction.reply({
                content: '*Angry Victreebel noises*',
                ephemeral: true,
            });
        }

        // -----------------------
        // Deal with removing all gyms here
        // -----------------------
        if (gymName.toLowerCase() === 'all') {
            userList = await interaction.client.UserGyms.findAll({
                where: { 
                    userId: interaction.user.id
                }
            });
            userList = userList.map(g => g.gymName);

            try {
				await interaction.client.UserGyms.destroy({
                    where: { 
                        userId: interaction.user.id
                    }
                });

                // No need to await the promise
                cacheUserGymList(interaction.client, interaction.user);

				return interaction.reply({
                    content: `Succesfully removed you from \`${userList.join(', ')}\`.`,
                    ephemeral: true,
                });
			}
			catch(e) {
				console.error('Error in remove command', e);
				return interaction.reply({
                    content: 'There was a problem in removing your entries, please bring this to Anhim\'s attention.',
                    ephemeral: true,
                });
			}
        }

        // -----------------------
        // Deal with removing specific gyms
        // -----------------------
        matchingGym = interaction.client.gymList.filter(g => g.gymName == gymName);

        // Make sure the gym is in the list
        if (!matchingGym || matchingGym.length < 1) {
            return interaction.reply({content: `⚠️ Could not find a gym by the name of \`${gymName}\``, ephemeral:true});
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
        if(!userGym) return interaction.reply({content: `⚠️ You were not subscribed to \`${gymName}\``, ephemeral:true});

        try{
            await interaction.client.UserGyms.destroy({
                where: {
                    gymId: gym.id,
                    userId: interaction.user.id,
                }
            });
            
            // No need to await the promise
            cacheUserGymList(interaction.client, interaction.user);

            return interaction.reply({content: `Successfully removed you from \`${gymName}\``, ephemeral: true});
        }
        catch(e) {
            interaction.reply({content: `⚠️ There was an unexpected error in updating your monitor list, please contact Anhim about this.`, ephemeral:true});
            console.error(e);
            console.error(`Error removing from userGyms in remove command with ${interaction.options.data}`);
        }
        
    }
}