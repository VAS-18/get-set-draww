import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyCO-rfZob9TyOQtpPulKk6zeP3mA-goHwo";

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI WORD KEY NOT FOUND");
}

const words = async (theme) => {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Build a prompt for a quirky drawing challenge. The Theme will be ${theme}. Keep in mind the person has to draw it in 30 seconds so it should not be too complex please keep it simple. make sure its only one sentance`;

  const gameWords = await model.generateContent(prompt);

  // console.log(gameWords.response.text());

  const challenge = gameWords.response.text();

  return challenge;
};

export default words;

