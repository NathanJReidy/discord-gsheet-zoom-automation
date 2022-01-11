"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBotService = void 0;
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
const DiscordService_1 = require("./DiscordService");
const GoogleSheetsService_1 = require("./GoogleSheetsService");
dotenv_1.default.config();
class DiscordBotService {
    async startAdminBot() {
        const client = new discord_js_1.Client({
            intents: [
                discord_js_1.Intents.FLAGS.GUILDS,
                discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
                discord_js_1.Intents.FLAGS.GUILD_MEMBERS,
            ],
        });
        // const id = process.env.TEST_GUILD_ID;
        const prefix = "!";
        client.login(process.env.DISCORD_BOT_TOKEN);
        client.on("messageCreate", async function (message) {
            if (message.author.bot)
                return;
            if (!message.content.startsWith(prefix))
                return;
            const commandBody = message.content.slice(prefix.length);
            const args = commandBody.split(" ");
            const command = args.shift().toLowerCase();
            const discordService = new DiscordService_1.DiscordService();
            const discordBotService = new DiscordBotService();
            const allDiscordUsernames = await discordService.getAllDiscordUsernames();
            // const allDiscordUserIds = await discordService.getAllDiscordUserIds();
            const allDiscordGuildChannels = await discordService.getAllDiscordGuildChannels();
            // The bot will only work for people in the channelNameWithBotPermission specified below
            const channelNameWithBotPermission = "general";
            const channelIdWithBotPermission = allDiscordGuildChannels
                .filter((channel) => channel.name === channelNameWithBotPermission)
                .map((channel) => channel.id)
                .shift();
            const googleSheetsService = new GoogleSheetsService_1.GoogleSheetsService();
            const allSpreadSheetDiscordUsernames = await googleSheetsService.getAllSpreadSheetDiscordUsernames();
            const allDiscordUsernamesWithoutBookedCall = await discordService.findDiscordUsernamesWithoutBookedCall(allDiscordUsernames, allSpreadSheetDiscordUsernames);
            if (message.channelId === channelIdWithBotPermission) {
                switch (command) {
                    case "clean":
                        message.reply(`The following Discord users have not booked an onboarding call: ${allDiscordUsernames}`);
                        break;
                    case "notify":
                        message.reply(`The following Discord users have not booked an onboarding call: ${allDiscordUsernames}. Do you want me to remind them to book (yes/no)?`);
                        discordBotService.messageDiscordUsersWithoutBookedCall(client, allDiscordUsernamesWithoutBookedCall, message);
                        break;
                    case "execute":
                        message.reply(`The following Discord users have not booked an onboarding call: ${allDiscordUsernames}. Do I have permission to publicly execute them (yes/no)?`);
                        // TODO add functionality for bot to remove users from Discord
                        break;
                }
            }
            else if (command && message.channelId !== channelIdWithBotPermission) {
                message.reply(`You do not have permission to use this Bot. Only those in the ${channelNameWithBotPermission} channel can use it.`);
            }
        });
    }
    async messageDiscordUsersWithoutBookedCall(client, usernames, message) {
        const discordService = new DiscordService_1.DiscordService();
        const allDiscordUserIdsWithoutBookedCall = await discordService.getDiscordIdsFromUsernames(usernames);
        for (const discordUserId of allDiscordUserIdsWithoutBookedCall) {
            const user = await client.users.fetch(discordUserId);
            if (!user)
                return message.channel.send(`User with id ${discordUserId} not found`);
            try {
                await user.send("Reminder: You must book an onboarding call to stay in Theopetra. You have 7 days to book a call or we will publicly execute you ;)");
                return;
            }
            catch (error) {
                // message.channel.send(
                //   "User has DMs closed or has no mutual servers with the bot:("
                // );
                // This is currently being triggered once because the 'Discord Testing'
                // bot is included in the array of allDiscordUserIds, and obviously someone
                // cannot message themself. The bot tries to message itself and throws this error.
                // To fix this, all I need to do is add a conditional if statement to make sure
                // the username/userId does not equal that of the bot.
                console.log(`error is ${error}`);
                throw new Error(`error is ${error}`);
            }
        }
        return;
    }
}
exports.DiscordBotService = DiscordBotService;
//# sourceMappingURL=DiscordBotService.js.map