require('dotenv').config();
const { Telegraf } = require('telegraf');
const puppeteer = require('puppeteer');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

function enviarMenu(ctx) {
  ctx.reply(`🎉 ¡Hola, ${ctx.from.first_name}!\n¿Qué deseas hacer hoy?`, {
    reply_markup: {
      inline_keyboard: [
        [
          { 
            text: "Ver horario 📅", 
            web_app: { url: "https://fravens7.github.io/telegram-webapp/" } 
          },
          { 
            text: "Descargar PNG 🖼️", 
            callback_data: "descargar_png" 
          }
        ],
        [
          { 
            text: "Cerrar ❌", 
            callback_data: "cerrar_menu" 
          }
        ]
      ]
    }
  });
}

// Si escriben /start
bot.command('start', (ctx) => {
  enviarMenu(ctx);
});

// Si escriben cualquier otro mensaje
bot.on('message', (ctx) => {
  enviarMenu(ctx);
});

// Acciones cuando presiona un botón
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === 'descargar_png') {
    await ctx.answerCbQuery();
    await ctx.reply('🔄 Generando tu horario en imagen, por favor espera...');

    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
      });

      const page = await browser.newPage();
      await page.goto('https://fravens7.github.io/telegram-webapp/', { waitUntil: 'networkidle2' });

      // Esperar a que cargue la tabla
      await page.waitForSelector('#data-table', { visible: true });

      // Capturar sólo la tabla
      const element = await page.$('#data-table');
      const screenshotPath = './horario.png';
      await element.screenshot({ path: screenshotPath });

      await browser.close();

      // Enviar la imagen a Telegram
      await ctx.replyWithPhoto({ source: fs.createReadStream(screenshotPath) });

      // Opcional: borrar imagen después de enviarla
      // fs.unlinkSync(screenshotPath);

    } catch (error) {
      console.error('Error al generar imagen:', error);
      await ctx.reply('❌ Hubo un error al generar la imagen.');
    }
  }

  if (data === 'cerrar_menu') {
    await ctx.answerCbQuery();
    await ctx.reply('❌ Menú cerrado.');
  }
});

bot.launch();
console.log('✅ Bot en funcionamiento...');
