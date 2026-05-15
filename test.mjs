import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = "AIzaSyDuDbI6ohJuNT06swLhpgc6ADkKe03sYYY"
const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  tools: [{ googleSearch: {} }]
})

async function test() {
  try {
    const result = await model.generateContent("What is the weather in Seattle?")
    console.log(result.response.text())
  } catch (err) {
    console.error("ERROR:", err)
  }
}

test()
