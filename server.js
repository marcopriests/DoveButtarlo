import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

app.post("/api/dovebuttarlo", async (req, res) => {
    const { comune, oggetto } = req.body;

    if (!comune || !oggetto) {
        return res.status(400).json({ error: "Comune e oggetto sono obbligatori" });
    }

    try {
        const prompt = `
            Sei un assistente ambientale esperto nelle regole della raccolta differenziata in Italia.

            L'utente vuole sapere dove buttare ${oggetto} seguendo correttamente le regole della differenziata relative al ${comune}.

            Il tuo compito è:
            1. Cercare esclusivamente informazioni aggiornate sul sito ufficiale o sulla pagina dedicata alla raccolta differenziata del comune indicato (es. portale comunale o azienda locale di igiene urbana).
            2. Identificare il corretto contenitore in cui smaltire l'oggetto e scegliere una sola CATEGORIA tra le seguenti:
            ["CARTA", "PLASTICA", "VETRO", "ORGANICO", "INDIFFERENZIATO", "RAEE", "CENTRO DI RACCOLTA"]
            3. Rispondi con [CATEGORIA], [link fonte].

            Regole aggiuntive:
            1. Se ${oggetto} deve essere conferito in un centro di raccolta specifico, rispondi solo con "CENTRO DI RACCOLTA".
            2. Se il ${comune} non esiste o non è trovato, rispondi con [COMUNE NON TROVATO].
            3. Se il ${comune} non ha un sito dedicato alla raccolta rifiuti oppure non hai certezza di cosa sia ${oggetto} e quindi di come vada smaltito, rispondi con "INFORMAZIONE NON TROVATA".
            4. Prima di inviare il link della fonte assicurati che esso sia effettivamente esistente e che non porti ad un errore 404 not found.
        `;

        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });

        // Estraggo il testo della risposta (che Gemini restituisce come stringa)
        const text = response.text;

        const arrayRisposta = text.split(",").map(item => item.trim());

        const result = {
            categoria: arrayRisposta[0] || "",
            fonte: arrayRisposta[1] || ""
        };
        console.log(result);

        if (typeof result !== "object") {
            throw new Error("Risposta non valida dal modello AI");
        }

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore interno del server" });
    }
});

app.listen(port, () => {
    console.log(`Server avviato su http://localhost:${port}`);
});