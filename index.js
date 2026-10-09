const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) {
                startBot()
            }
        } else if (connection === 'open') {
            console.log('✅ Panther Bot Connected!')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return

        const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
        const from = m.key.remoteJid

        console.log('Message:', text)

        // AUTO REPLIES - Edit these!
        if (text.toLowerCase() === 'hi' || text.toLowerCase() === 'hello') {
            await sock.sendMessage(from, { text: '👋 Hey! I am Panther Bot 🐆\n\nType:\n*menu* - see options\n*ai your question* - ask AI\n*sticker* - make sticker' })
        }
        else if (text.toLowerCase() === 'menu') {
            await sock.sendMessage(from, { text: '🐆 PANTHER BOT MENU\n\n1. *ai* + question - Chat with AI\n2. *sticker* (with image) - Create sticker\n3. *tagall* (in group) - Tag everyone\n4. *play* + song name - Download song\n\nMade by Mokaya' })
        }
        else if (text.toLowerCase().startsWith('ai ')) {
            const question = text.slice(3)
            // Connect to your Panther Chat API here
            await sock.sendMessage(from, { text: `🤖 Panther AI thinking about: "${question}"\n\n[Connect your AI API here]` })
        }
        else if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(from, { text: 'Pong! 🏓 Bot is alive!' })
        }
    })
}

startBot()
