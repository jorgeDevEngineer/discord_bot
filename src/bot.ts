import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Partials,
  ChannelType,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  Message,
  ButtonInteraction,
} from 'discord.js';
import {
  fetchLogs,
  summarizeLogsAction,
  interpretLogErrorAction,
} from '@/app/actions';

const {
  DISCORD_BOT_TOKEN,
  DISCORD_CHANNEL_ID,
  DISCORD_ADMIN_ROLE_ID,
  RAILWAY_API_TOKEN,
  TARGET_SERVICE_ID, // Renamed from RAILWAY_SERVICE_ID
} = process.env;

if (
  !DISCORD_BOT_TOKEN ||
  !DISCORD_CHANNEL_ID ||
  !RAILWAY_API_TOKEN ||
  !TARGET_SERVICE_ID // Renamed
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

// --- Helper Functions ---

async function sendErrorMessage(interactionOrMessage: Message | ButtonInteraction, content: string) {
    if (interactionOrMessage instanceof Message) {
      await interactionOrMessage.reply({ content });
    } else {
      if (interactionOrMessage.deferred || interactionOrMessage.replied) {
        await interactionOrMessage.editReply({ content });
      } else {
        await interactionOrMessage.reply({ content, ephemeral: true });
      }
    }
}

async function sendButtonMenu(channel: TextChannel, content: string) {
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('show_logs_app')
        .setLabel('📄 Logs App')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('show_logs_deploy')
        .setLabel('🚀 Logs Deploy')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('summarize_app')
        .setLabel('✍️ Resumir App')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('interpret_error')
        .setLabel('🐛 Interpretar Error')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('show_help')
        .setLabel('❓ Ayuda')
        .setStyle(ButtonStyle.Secondary),
    );

  await channel.send({ content, components: [row] });
}

// --- Command Logic Functions ---

async function handleLogsCommand(interactionOrMessage: Message | ButtonInteraction, args: string[]) {
    const isButtonInteraction = interactionOrMessage instanceof ButtonInteraction;
    const replyTarget = isButtonInteraction ? interactionOrMessage : interactionOrMessage;

    const logType = args[0] === 'deploy' ? 'deploy' : 'app';
    const limit = args[1] ? parseInt(args[1], 10) : 20;

    if (isNaN(limit) || limit <= 0 || limit > 100) {
      await sendErrorMessage(replyTarget, 'Por favor, introduce un número válido de logs a mostrar (entre 1 y 100).');
      return;
    }

    const initialMessage = 'Buscando los últimos ' + limit + ' logs de `' + logType + '`...';
    if (isButtonInteraction) {
        await (replyTarget as ButtonInteraction).editReply({ content: initialMessage });
    } else {
        await (replyTarget as Message).reply({ content: initialMessage });
    }

    const { logs, error, title } = await fetchLogs(RAILWAY_API_TOKEN!, TARGET_SERVICE_ID!, logType, limit);

    if (error) {
      await sendErrorMessage(replyTarget, 'Error al obtener los logs: ' + error);
      return;
    }

    if (!logs || logs.length === 0) {
      await replyTarget.channel?.send({ content: 'No se encontraron logs.' });
      return;
    }

    const logMessages = logs.map(l => '`[' + new Date(l.timestamp).toLocaleTimeString() + ']` `[' + l.severity + ']` ' + l.message);

    const chunks = [];
    let currentChunk = '**' + title + '**\n';
    for (const logMessage of logMessages) {
      if (currentChunk.length + logMessage.length + 1 > 2000) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      currentChunk += logMessage + '\n';
    }
    chunks.push(currentChunk);

    for (const chunk of chunks) {
      await replyTarget.channel?.send({ content: chunk });
    }
}

async function handleSummarizeCommand(interactionOrMessage: Message | ButtonInteraction, args: string[]) {
    const isButtonInteraction = interactionOrMessage instanceof ButtonInteraction;
    const replyTarget = isButtonInteraction ? interactionOrMessage : interactionOrMessage;

    const logType = args[0] === 'deploy' ? 'deploy' : 'app';
    const initialMessage = 'Generando resumen de los últimos 50 logs de `' + logType + '`...';

    if (isButtonInteraction) {
        await (replyTarget as ButtonInteraction).editReply({ content: initialMessage });
    } else {
        await (replyTarget as Message).reply({ content: initialMessage });
    }

    const { logs, error } = await fetchLogs(RAILWAY_API_TOKEN!, TARGET_SERVICE_ID!, logType, 50);

    if (error) {
      await sendErrorMessage(replyTarget, 'Error: ' + error);
      return;
    }
    if (!logs || logs.length === 0) {
       await replyTarget.channel?.send({ content: 'No hay logs para resumir.' });
       return;
    }

    const { summary, error: summaryError } = await summarizeLogsAction(logs);

    if (summaryError) {
      await sendErrorMessage(replyTarget, 'Error de la IA: ' + summaryError);
      return;
    }

    const embed = new EmbedBuilder()
     .setColor(0x8B5CF6)
     .setTitle('Resumen de Logs de ' + logType.charAt(0).toUpperCase() + logType.slice(1))
     .setDescription(summary || 'No se pudo generar un resumen.')
     .setTimestamp();

    await replyTarget.channel?.send({ embeds: [embed] });
}

async function handleInterpretCommand(interactionOrMessage: Message | ButtonInteraction) {
    const isButtonInteraction = interactionOrMessage instanceof ButtonInteraction;
    const replyTarget = isButtonInteraction ? interactionOrMessage : interactionOrMessage;
    const initialMessage = 'Buscando el último error en los logs de aplicación para interpretar...';

    if (isButtonInteraction) {
        await (replyTarget as ButtonInteraction).editReply({ content: initialMessage });
    } else {
        await (replyTarget as Message).reply({ content: initialMessage });
    }

    const { logs, error } = await fetchLogs(RAILWAY_API_TOKEN!, TARGET_SERVICE_ID!, 'app', 100);
    if (error) {
      await sendErrorMessage(replyTarget, 'Error: ' + error);
      return;
    }

    if (!logs) {
        await replyTarget.channel?.send({ content: 'No se encontraron logs.' });
        return;
    }

    const lastError = logs.filter(l => l.severity === 'ERROR').pop();
    if (!lastError) {
      await replyTarget.channel?.send({ content: 'No se encontraron errores recientes en los logs de la aplicación.' });
      return;
    }

    const { interpretation, possibleSolutions, error: interpretError } = await interpretLogErrorAction(lastError.message);
    if (interpretError) {
      await sendErrorMessage(replyTarget, 'Error de la IA: ' + interpretError);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('Interpretación de Error con IA')
      .addFields(
        { name: 'Error Message', value: '```' + lastError.message.substring(0, 1000) + '```' },
        { name: 'Interpretación', value: interpretation || 'N/A' },
        { name: 'Posibles Soluciones', value: possibleSolutions || 'N/A' }
      )
      .setTimestamp();

    await replyTarget.channel?.send({ embeds: [embed] });
}

async function handleHelpCommand(interactionOrMessage: Message | ButtonInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('Ayuda de Railway Logger Bot')
      .setDescription('Puedes usar los botones o los siguientes comandos:')
      .addFields(
        { name: '`!start`', value: 'Muestra el menú de botones para un acceso rápido.' },
        { name: '`!logs [app|deploy] [cantidad]`', value: 'Muestra los logs. (Ej: `!logs app 30`).' },
        { name: '`!summarize [app|deploy]`', value: 'Genera un resumen con IA de los últimos 50 logs.' },
        { name: '`!interpret`', value: 'Interpreta el último error encontrado en los logs de la aplicación.' },
        { name: '`!debugid`', value: 'Muestra el Service ID que el bot está usando como objetivo.' }, // Updated help text
        { name: '`!help`', value: 'Muestra este mensaje de ayuda.' }
      );

    if (interactionOrMessage instanceof Message) {
        await interactionOrMessage.reply({ embeds: [embed] });
    } else {
        await (interactionOrMessage as ButtonInteraction).editReply({ embeds: [embed] });
    }
}

async function handleDebugIdCommand(message: Message) {
  const serviceId = process.env.TARGET_SERVICE_ID;
  const embed = new EmbedBuilder()
    .setColor(0xFBBF24) // Amber color
    .setTitle('🕵️‍♂️ Debug: Target Service ID')
    .setDescription('El bot está configurado para obtener logs del siguiente Service ID:')
    .addFields({ name: 'Current Target Service ID', value: '`' + serviceId + '`' });
  await message.reply({ embeds: [embed] });
}

// --- Client Ready Event ---
client.once('clientReady', async (c) => {
  console.log(`Logged in as ${c.user?.tag}!`);
  console.log('Bot is ready and listening for commands.');

  try {
    const channel = await c.channels.fetch(DISCORD_CHANNEL_ID);
    if (channel && channel.isTextBased()) {
      (channel as TextChannel).send("¡Hola! Estoy en línea. Escribe `!start` para ver el menú de opciones o `!help` para más información.");
    } else {
      console.log('Could not find the specified channel or it is not a text channel.');
    }
  } catch (error) {
    console.error("Failed to send startup message:", error);
  }
});

// --- Interaction (Button) Handler ---
client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.channelId !== DISCORD_CHANNEL_ID) {
    await interaction.reply({ content: 'Lo siento, solo puedo operar en el canal autorizado.', ephemeral: true });
    return;
  }

  // Security Check
  if (DISCORD_ADMIN_ROLE_ID && DISCORD_ADMIN_ROLE_ID.length > 0) {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (!member?.roles.cache.has(DISCORD_ADMIN_ROLE_ID)) {
      await interaction.reply({ content: 'Lo siento, no tienes permiso para usar este botón.', ephemeral: true });
      return;
    }
  }

  await interaction.deferReply({ ephemeral: true });

  const { customId } = interaction;

  try {
    switch (customId) {
      case 'show_logs_app':
        await handleLogsCommand(interaction, ['app', '20']);
        break;
      case 'show_logs_deploy':
        await handleLogsCommand(interaction, ['deploy', '20']);
        break;
      case 'summarize_app':
        await handleSummarizeCommand(interaction, ['app']);
        break;
      case 'interpret_error':
        await handleInterpretCommand(interaction);
        break;
      case 'show_help':
        await handleHelpCommand(interaction);
        break;
      default:
        await sendErrorMessage(interaction, 'Comando de botón no reconocido.');
    }
  } catch (error) {
    console.error(`Error handling button interaction ${customId}:`, error);
    await sendErrorMessage(interaction, 'Ocurrió un error inesperado al procesar tu solicitud.');
  }
});


// --- Message (Text Command) Handler ---
client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.GuildText) return;
  if (message.channelId !== DISCORD_CHANNEL_ID) return;

  const commandPrefix = '!';
  if (!message.content.startsWith(commandPrefix)) return;

  // Security Check
  if (DISCORD_ADMIN_ROLE_ID && DISCORD_ADMIN_ROLE_ID.length > 0) {
    if (!message.member?.roles.cache.has(DISCORD_ADMIN_ROLE_ID)) {
      message.reply({ content: 'Lo siento, no tienes permiso para usar este comando.' });
      return;
    }
  }

  const [command, ...args] = message.content.slice(commandPrefix.length).trim().split(/ +/);
  if (!command) return;

  try {
    switch (command.toLowerCase()) {
      case 'start':
        await sendButtonMenu(message.channel as TextChannel, '¿Qué te gustaría hacer?');
        break;
      case 'logs':
        await handleLogsCommand(message, args);
        break;
      case 'summarize':
        await handleSummarizeCommand(message, args);
        break;
      case 'interpret':
        await handleInterpretCommand(message);
        break;
      case 'help':
        await handleHelpCommand(message);
        break;
      case 'debugid':
        await handleDebugIdCommand(message);
        break;
      default:
        await message.reply('Comando no reconocido. Escribe `!help` o usa los botones.');
        break;
    }
  } catch (err) {
    console.error('An error occurred executing command:', err);
    message.reply({ content: 'Ocurrió un error inesperado al procesar tu comando.' });
  }
});

console.log('Logging in to Discord...');
client.login(DISCORD_BOT_TOKEN);