import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Partials,
  ChannelType,
} from 'discord.js';
import {
  fetchLogs,
  summarizeLogsAction,
  interpretLogErrorAction,
} from '@/app/actions';
import { checkAdminRole } from '@/ai/flows/admin-control';
import type { LogEntry } from './lib/definitions';

const {
  DISCORD_BOT_TOKEN,
  DISCORD_CHANNEL_ID,
  DISCORD_ADMIN_ROLE_ID,
  RAILWAY_API_TOKEN,
  RAILWAY_SERVICE_ID,
} = process.env;

if (
  !DISCORD_BOT_TOKEN ||
  !DISCORD_CHANNEL_ID ||
  !RAILWAY_API_TOKEN ||
  !RAILWAY_SERVICE_ID
) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  console.log('Bot is ready and listening for commands.');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.GuildText) return;
  if (message.channelId !== DISCORD_CHANNEL_ID) return;

  const commandPrefix = '!';
  if (!message.content.startsWith(commandPrefix)) return;

  // Security Check: Admin role
  if (DISCORD_ADMIN_ROLE_ID) {
    if (!message.member?.roles.cache.has(DISCORD_ADMIN_ROLE_ID)) {
      message.reply({ content: 'Lo siento, no tienes permiso para usar este comando.' });
      return;
    }
  }


  const [command, ...args] = message.content.slice(commandPrefix.length).trim().split(/ +/);

  try {
    if (command === 'logs') {
      const logType = args[0] === 'deploy' ? 'deploy' : 'app';
      const limit = args[1] ? parseInt(args[1], 10) : 20;

      if (isNaN(limit) || limit <= 0 || limit > 100) {
        message.reply({ content: 'Por favor, introduce un número válido de logs a mostrar (entre 1 y 100).' });
        return;
      }
      
      await message.reply({ content: `Buscando los últimos ${limit} logs de \`${logType}\`...` });

      const { logs, error, title } = await fetchLogs(RAILWAY_API_TOKEN, RAILWAY_SERVICE_ID, logType, limit);

      if (error) {
        message.channel.send({ content: `Error al obtener los logs: ${error}` });
        return;
      }

      if (logs.length === 0) {
        message.channel.send({ content: 'No se encontraron logs.' });
        return;
      }

      const logMessages = logs.map(l => `\`[${new Date(l.timestamp).toLocaleTimeString()}]\` \`[${l.severity}]\` ${l.message}`);
      
      // Split messages if they are too long for Discord
      const chunks = [];
      let currentChunk = `**${title}**\n`;
      for (const logMessage of logMessages) {
        if (currentChunk.length + logMessage.length + 1 > 2000) {
          chunks.push(currentChunk);
          currentChunk = "";
        }
        currentChunk += logMessage + '\n';
      }
      chunks.push(currentChunk);

      for (const chunk of chunks) {
        await message.channel.send({ content: chunk });
      }

    } else if (command === 'summarize') {
       const logType = args[0] === 'deploy' ? 'deploy' : 'app';
       await message.reply({ content: `Generando resumen de los últimos 50 logs de \`${logType}\`...` });
       
       const { logs, error } = await fetchLogs(RAILWAY_API_TOKEN, RAILWAY_SERVICE_ID, logType, 50);

       if (error) {
         message.channel.send({ content: `Error: ${error}` });
         return;
       }
       if (logs.length === 0) {
          message.channel.send({ content: 'No hay logs para resumir.' });
          return;
       }

       const { summary, error: summaryError } = await summarizeLogsAction(logs);
       
       if (summaryError) {
         message.channel.send({ content: `Error de la IA: ${summaryError}` });
         return;
       }

       const embed = new EmbedBuilder()
        .setColor(0x8B5CF6)
        .setTitle(`Resumen de Logs de ${logType.charAt(0).toUpperCase() + logType.slice(1)}`)
        .setDescription(summary || 'No se pudo generar un resumen.')
        .setTimestamp();
        
       message.channel.send({ embeds: [embed] });
    
    } else if (command === 'interpret') {
        const logType = 'app'; // Interpretation is usually for app errors
        await message.reply({ content: 'Buscando el último error en los logs de aplicación para interpretar...' });

        const { logs, error } = await fetchLogs(RAILWAY_API_TOKEN, RAILWAY_SERVICE_ID, logType, 100);
        if (error) {
          message.channel.send({ content: `Error: ${error}` });
          return;
        }

        const lastError = logs.filter(l => l.severity === 'ERROR').pop();
        if (!lastError) {
          message.channel.send({ content: 'No se encontraron errores recientes en los logs de la aplicación.' });
          return;
        }

        const { interpretation, possibleSolutions, error: interpretError } = await interpretLogErrorAction(lastError.message);
        if (interpretError) {
          message.channel.send({ content: `Error de la IA: ${interpretError}` });
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle('Interpretación de Error con IA')
          .addFields(
            { name: 'Error Message', value: `\`\`\`${lastError.message.substring(0, 1000)}\`\`\`` },
            { name: 'Interpretación', value: interpretation || 'N/A' },
            { name: 'Posibles Soluciones', value: possibleSolutions || 'N/A' }
          )
          .setTimestamp();
        
        message.channel.send({ embeds: [embed] });

    } else if (command === 'help') {
        const embed = new EmbedBuilder()
          .setColor(0x10B981)
          .setTitle('Ayuda de Railway Logger Bot')
          .setDescription('Estos son los comandos disponibles:')
          .addFields(
            { name: '`!logs [app|deploy] [cantidad]`', value: 'Muestra los logs. (Ej: `!logs app 30`). Por defecto `app` y `20`.'},
            { name: '`!summarize [app|deploy]`', value: 'Genera un resumen con IA de los últimos 50 logs.' },
            { name: '`!interpret`', value: 'Interpreta el último error encontrado en los logs de la aplicación.' },
            { name: '`!help`', value: 'Muestra este mensaje de ayuda.' }
          );
        message.channel.send({ embeds: [embed] });
    }

  } catch (err) {
    console.error('An error occurred executing command:', err);
    message.reply({ content: 'Ocurrió un error inesperado al procesar tu comando.' });
  }
});

console.log('Logging in to Discord...');
client.login(DISCORD_BOT_TOKEN);
