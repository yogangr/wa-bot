const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const { Boom } = require("@hapi/boom")
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyD8NaDlqtOlwGY2Sl9jFTb2hO8PFiy57oY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function run(pesan) {
    const prompt = pesan

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text
}

async function connectToWhatsapp() {
    const { state, saveCreds } = await useMultiFileAuthState("./login.json")
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        defaultQueryTimeoutMs: undefined
    })

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update
        console.log("Update connection:", update) // Log detail
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : false
            console.log("Koneksi terputus karena", lastDisconnect.error, "Hubungkan kembali!", shouldReconnect)
            if (shouldReconnect) {
                connectToWhatsapp()
            }
        } else if (connection === "open") {
            console.log("Koneksi tersambung")
        }
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("messages.upsert", async m => {
        console.log("Pesan baru", m.messages)
        console.log("Pesan baru tipe :", m.type)
        if (m.type === "notify" && !m.messages[0].key.fromMe) {
            try {
                const senderNumber = m.messages[0].key.remoteJid
                let message = m.messages[0].message.conversation

                if (message == "") {
                    message = m.messages[0].message.extendedTextMessage.text
                }

                const isMessageFromGroup = senderNumber.includes("@g.us")
                const isMessageMentionBot = message.includes("@6285604205356")

                if (!isMessageFromGroup) {
                    async function main() {
                        const result = await run(message);
                        console.log(result)
                        await sock.sendMessage(senderNumber,
                            { text: result },
                            { quoted: m.messages[0] },
                            2000
                        )
                    }

                    main();
                }

                if (isMessageFromGroup && isMessageMentionBot) {
                    let excludeWord = "@6285604205356";
                    let wordsArray = message.split(' ');
                    let filteredWords = wordsArray.filter(word => word.toLowerCase() !== excludeWord.toLowerCase());
                    let messageGroup = filteredWords.join(' ');
                    async function main() {
                        const result = await run(messageGroup);
                        console.log(result)
                        await sock.sendMessage(senderNumber,
                            { text: result },
                            { quoted: m.messages[0] },
                            2000
                        )
                    }

                    main();
                }

                if (message === "P" || message === "p") {
                    await sock.sendMessage(senderNumber,
                        { text: "Lo sok asik bangsat!" },
                        { quoted: m.messages[0] },
                        2000
                    )
                }
            } catch (error) {
                console.log(error)
            }
        }
    })
}

connectToWhatsapp()
