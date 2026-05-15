import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = "AIzaSyDuDbI6ohJuNT06swLhpgc6ADkKe03sYYY"
const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  tools: [{ googleSearch: {} }]
})

async function test() {
  try {
    const address = "1600 Pennsylvania Avenue NW, Washington, DC"
    const prompt = `Search for public property records and real estate listings for the address: ${address}. Extract the following: City, State, ZIP Code, Year Built, Number of Stories, Square Footage. Format the response strictly as a single line, comma-separated string like: "City: Seattle, State: WA, ZIP: 98101, Year Built: 1990, Stories: 2, SqFt: 2500". If a piece of data is missing, write "Unknown" for that field.`
    const result = await model.generateContent(prompt)
    console.log(result.response.text())
  } catch (err) {
    console.error("ERROR:", err)
  }
}

test()
