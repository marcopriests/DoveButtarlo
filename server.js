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
        Sei un assistente ambientale esperto nella raccolta differenziata in Italia.
        L’utente vive a ${comune} e vuole sapere dove buttare ${oggetto}.
        - Cerca esclusivamente sul sito ufficiale o sulla pagina web dedicata alla raccolta differenziata del comune indicato.
        - Determina in modo certo in quale categoria di rifiuto rientra l’oggetto.
        - Le uniche categorie permesse sono UMIDO, CARTA, PLASTICA, VETRO, INDIFFERENZIATA, RAEE, CENTRO DI RACCOLTA.
        - Rispondi solo ed esclusivamente nel seguente formato:
            "{risposta: [CATEGORIA], fonte: [link fonte]}"

        ⚠️ Regole obbligatorie:

        Non fornire spiegazioni o testo aggiuntivo.
        Se il ${comune} non esiste o non è riconosciuto come comune italiano, rispondi nel seguente modo e formato:
            "{risposta: COMUNE NON TROVATO O ERRATO, fonte: ""}"

        Se il sito comunale non specifica chiaramente la categoria, rispondi nel seguente modo e formato:
            "{risposta: NON SPECIFICATO DAL COMUNE, fonte: ""}"
        `;

        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });

        // Estraggo il testo della risposta (che Gemini restituisce come stringa)
        const text = response.text;
        console.log(text);
        const result = JSON.parse(text);

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore interno del server" });
    }
});

app.listen(port, () => {
    console.log(`Server avviato su http://localhost:${port}`);
});