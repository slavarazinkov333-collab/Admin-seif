export default {
  async fetch(request, env, ctx) {
    const BOT_TOKEN = env.BOT_TOKEN;
    const ADMIN_ID = env.ADMIN_ID;
    const SECRET = env.SECRET;
    
    // Проверка, что токен задан
    if (!BOT_TOKEN) {
      return new Response('BOT_TOKEN not set', { status: 500 });
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    // ==== CORS preflight ====
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // ==== API для сайта: приём заявок ====
    if (path === '/api/withdraw' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { skin, price, commission, finalPrice, skinName, pattern, account } = body;
        
        const text = `📤 НОВАЯ ЗАЯВКА НА ВЫВОД\n\n` +
          `🎮 Скин в игре: ${skin}\n` +
          `💰 Цена: ${price} G\n` +
          `💸 Комиссия: ${commission} G\n` +
          `✅ К получению: ${finalPrice} G\n\n` +
          `📝 Имя в Standoff: ${skinName}\n` +
          `🎯 Паттерн: ${pattern}\n` +
          `👤 Аккаунт: ${account}\n\n` +
          `Ответь:\n/approve — одобрить\n/reject — отклонить`;
        
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: ADMIN_ID, text })
        });
        
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    // ==== Webhook от Telegram ====
    if (request.method === 'POST') {
      // Проверка секрета
      if (SECRET) {
        const headerSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
        if (headerSecret !== SECRET) {
          return new Response('Unauthorized', { status: 401 });
        }
      }
      
      try {
        const update = await request.json();
        const msg = update.message;
        
        if (msg && msg.from && msg.from.id == ADMIN_ID) {
          const text = msg.text || '';
          
          if (text === '/start') {
            await sendMessage(BOT_TOKEN, ADMIN_ID, '👑 Привет, админ! Жду заявки...');
          }
          
          if (text.startsWith('/approve')) {
            await sendMessage(BOT_TOKEN, ADMIN_ID, '✅ Заявка одобрена!');
          }
          
          if (text.startsWith('/reject')) {
            await sendMessage(BOT_TOKEN, ADMIN_ID, '❌ Заявка отклонена');
          }
          
          if (text === '/list') {
            await sendMessage(BOT_TOKEN, ADMIN_ID, '📋 Заявок пока нет (или смотри выше)');
          }
        }
        
        return new Response('OK');
      } catch (e) {
        return new Response('Error: ' + e.message, { status: 500 });
      }
    }
    
    // ==== Главная ====
    return new Response('🤖 Bot is running', { status: 200 });
  }
};

// Helper: отправка сообщения в Telegram
async function sendMessage(token, chatId, text) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}
