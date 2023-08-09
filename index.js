require('dotenv/config'); // gives access to env variables
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const client = new Client({//creates bot instance
  intents: [//intents that the bot can access
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', () => {//event listener for bot coming online
  console.log('The bot is online!');
});

const configuration = new Configuration({//defines a config to communicate with openAI-api
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);//now we can use variable openai to communicate with openai gpt

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;//if message author is bot, then we return without execution;
  if (message.channel.id !== process.env.CHANNEL_ID) return;//if channel id is different than our reqd server then we return.
  if (message.content.startsWith('!')) return; //to chat normally on channel without using bot

  let conversationLog = [
    { role: 'system', content: 'You are a friendly chatbot.' },//setting bot type; predefined syntax
  ];

  try {
    await message.channel.sendTyping();//to show bot typing
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });//fetches prev 15 messages
    prevMessages.reverse();//sorted in oldest to latest order now
    
    prevMessages.forEach((msg) => {//push the prevmessages to conversation log
      if (msg.content.startsWith('!')) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;//dont push if the message was by a different person or a bot
      if (msg.author.id == client.user.id) {
        conversationLog.push({
          role: 'assistant',
          content: msg.content,
          name: msg.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }

      if (msg.author.id == message.author.id) {
        conversationLog.push({//pushing the content of message to conversation log
          role: 'user',
          content: msg.content,
          name: message.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }
    });

    const result = await openai//make an api request to openai for a gpt result and store it in 'result'
      .createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,//we send the conversation log containing our message
        // max_tokens: 256, // limit token usage
      })
      .catch((error) => {
        console.log(`OPENAI ERR: ${error}`);//catches errors if any
      });
    message.reply(result.data.choices[0].message);//reply to the message using 'result'
  } catch (error) {
    console.log(`ERR: ${error}`);//catches errors if any
  }
});

client.login(process.env.TOKEN);//to login and bring bot online