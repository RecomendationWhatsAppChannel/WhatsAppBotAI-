const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const client = new Client({
  authStrategy: new LocalAuth()
});

let premiumUsers = {};

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', async message => {
  const chat = await message.getChat();
  chat.sendStateTyping(); // Indicates that the bot is 'typing'

  try {
    if (message.body.toLowerCase() === 'nama kamu siapa') {
      await message.react('🔎');
      await client.sendMessage(message.from, 'Hai! Namaku Zumi! Salam Kenal Yaa!');
      await message.react('✅');
    } else if (message.body.toLowerCase() === '.buypremium') {
      await client.sendMessage(message.from, `Hubungi Owner untuk membeli premium:\nOwner Utama: ${process.env.OWNER_MAIN}\nOwner Kedua: ${process.env.OWNER_SECOND}`);
    } else if (message.body.startsWith('.addprem')) {
      const [_, nomor, jam, menit, hari, bulan, tahun] = message.body.split(' ');
      if (message.from.includes(process.env.OWNER_MAIN) || message.from.includes(process.env.OWNER_SECOND)) {
        const expirationDate = new Date(tahun, bulan - 1, hari, jam, menit);
        premiumUsers[nomor] = expirationDate;
        await client.sendMessage(message.from, `Nomor ${nomor} telah ditambahkan sebagai pengguna premium hingga ${expirationDate}`);
      }
    } else if (message.body.toLowerCase() === 'buat gambar') {
      if (premiumUsers[message.from] && premiumUsers[message.from] > new Date()) {
        // Buat gambar menggunakan OpenAI
        const response = await openai.createImage({
          prompt: 'buat gambar',
          n: 1,
          size: '256x256',
        });
        await client.sendMessage(message.from, response.data.data[0].url);
        await message.react('✅');
      } else {
        await client.sendMessage(message.from, 'Maaf kak tapi kakak bukan premium beli premium dengan ketik .buypremium yaa kak');
      }
    } else {
      // Tanggapi chat lain dengan OpenAI
      const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: message.body,
        max_tokens: 150,
      });
      await client.sendMessage(message.from, response.data.choices[0].text.trim());
      await message.react('✅');
    }
  } catch (error) {
    await message.react('♻️');
    console.error(error);
  }
});

client.initialize();
