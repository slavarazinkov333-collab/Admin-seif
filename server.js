const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN || 'ВСТАВЬ_СЮДА_ТОКЕН';
const ADMIN_ID = 8683946808;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();
app.use(cors());
app.use(express.json());

const requests = new Map();
let reqCounter = 1;

// ==== API для сайта ====
app.post('/api/withdraw', async (req, res) => {
  const { skin, icon, price, commission, finalPrice, skinName, pattern, account } = req.body;
  const id = reqCounter++;
  requests.set(id, { ...req.body, status: 'pending', time: new Date().toLocaleString() });

  const text = `📤 НОВАЯ ЗАЯВКА #${id}\n\n` +
    `🎮 Скин в игре: ${skin}\n` +
    `💰 Цена: ${price} G\n` +
    `💸 Комиссия: ${commission} G\n` +
    `✅ К получению: ${finalPrice} G\n\n` +
    `📝 Имя в Standoff: ${skinName}\n` +
    `🎯 Паттерн: ${pattern}\n` +
    `👤 Аккаунт: ${account}\n\n` +
    `Ответь:\n/approve ${id}\n/reject ${id}`;

  try {
    await bot.sendMessage(ADMIN_ID, text);
    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/withdraw/:id', (req, res) => {
  const r = requests.get(Number(req.params.id));
  if (!r) return res.status(404).json({ ok: false });
  res.json({ ok: true, request: r });
});

// ==== Команды бота ====
bot.onText(/\/approve (\d+)/, async (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;
  const id = Number(match[1]);
  const r = requests.get(id);
  if (!r) return bot.sendMessage(ADMIN_ID, `❌ Заявка #${id} не найдена`);
  r.status = 'done';
  requests.set(id, r);
  bot.sendMessage(ADMIN_ID, `✅ Заявка #${id} одобрена\nСкин: ${r.skinName}\nПаттерн: ${r.pattern}\nАккаунт: ${r.account}`);
});

bot.onText(/\/reject (\d+)/, async (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;
  const id = Number(match[1]);
  const r = requests.get(id);
  if (!r) return bot.sendMessage(ADMIN_ID, `❌ Заявка #${id} не найдена`);
  r.status = 'rejected';
  requests.set(id, r);
  bot.sendMessage(ADMIN_ID, `❌ Заявка #${id} отклонена`);
});

bot.onText(/\/start/, (msg) => {
  if (msg.from.id === ADMIN_ID) bot.sendMessage(ADMIN_ID, '👑 Привет, админ! Жду заявки...');
  else bot.sendMessage(msg.from.id, 'Привет! Это бот для вывода скинов.');
});

bot.onText(/\/list/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return;
  if (requests.size === 0) return bot.sendMessage(ADMIN_ID, '📭 Нет заявок');
  let txt = '📋 ВСЕ ЗАЯВКИ:\n\n';
  requests.forEach((r, id) => {
    txt += `#${id} — ${r.skin} | ${r.status}\n`;
  });
  bot.sendMessage(ADMIN_ID, txt);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Сервер на порту ${PORT}`));
