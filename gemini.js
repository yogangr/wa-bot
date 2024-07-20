const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI("AIzaSyD8NaDlqtOlwGY2Sl9jFTb2hO8PFiy57oY");

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function run(pesan) {
    const prompt = pesan

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
}

async function main() {
    const result = await run("apa itu gemini?");
    console.log(result)
}

main();