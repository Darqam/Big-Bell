const fs = require('node:fs');
const path = require('path');
const util = require('util');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');


function readdirRecursive(directory) {
    const result = [];

    // Make our firectory path absolute if not already
    directory = path.resolve(directory);

    (function read(dir) {
        const files = fs.readdirSync(dir);

        for(const file of files) {
            const filepath = path.join(dir, file)
            
            if(fs.statSync(filepath).isDirectory()) {
                result.push(...readdirRecursive(filepath));
                continue;
            }
            
            //console.log(file)
            const content = require(filepath);
            result.push(content.data.toJSON())
        }
    }(directory));

    return result;
}

// Ensure proper directory path with keyword __dirname
const commands = readdirRecursive(path.join(__dirname, './commands/'));

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Refreshing apllication commands');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        )
        
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.log(util.inspect(error,
            {showHidden: false, depth: 20, colors: true}));
    }
})();