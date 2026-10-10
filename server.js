const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN || 'ВСТАВЬ_ТОКЕН';
const ADMIN_ID = 8683946808;
