import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API route for Gemini voice command interpretation
app.post('/api/gemini', async (req, res) => {
  try {
    const { transcript, services, appointmentsSummary, currentDate, currentTime } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const ai = new GoogleGenAI({});
    const systemInstruction = `Você é o assistente inteligente de voz da CAST Serviços Técnicos, integrado ao aplicativo CAST Agenda.
Sua missão é analisar comandos de voz do usuário em português brasileiro e gerar um objeto JSON estrito.
Data de hoje: ${currentDate}. Hora atual: ${currentTime}.
Serviços disponíveis na empresa: ${JSON.stringify(services)}.
Atendimentos na agenda: ${JSON.stringify(appointmentsSummary)}.

Identifique a intenção e retorne SEMPRE e APENAS este formato JSON:
{
  "action": "create_appointment" | "incomplete_command" | "query_agenda" | "unknown",
  "clientName": string ou null,
  "clientAddress": string ou null,
  "serviceTypeName": string ou null,
  "date": "YYYY-MM-DD" ou null,
  "time": "HH:mm" ou null,
  "notes": string ou null,
  "missingFields": string[] ou null,
  "clarificationMessage": string ou null,
  "queryType": "today" | "tomorrow" | "next" | "afternoon" | "address" | "all" | null,
  "responseSpeech": string
}

Regras:
1. Se for para agendar ('create_appointment'):
   - Conecte o tipo de serviço ao mais compatível dos serviços disponíveis.
   - Extraia a data (amanhã -> data calculada correta ${currentDate} + 1).
   - "responseSpeech" deve ser uma confirmação como: "Agendamento criado para [Cliente] [amanhã/hoje/data] às [horário], [serviço], no endereço [endereço]."
2. Se faltar informações essenciais ('incomplete_command'):
   - Obrigatórios: cliente, endereço/local, tipo de serviço e horário.
   - "missingFields": lista dos itens faltantes.
   - "clarificationMessage": peça apenas o que falta. Ex: "Falta informar o horário e o tipo de serviço."
   - "responseSpeech": mesmo texto do clarificationMessage.
3. Se for uma consulta ('query_agenda'):
   - Responda de forma direta e natural os atendimentos encontrados em "responseSpeech".
Não inclua nenhum texto ou markdown fora do JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: transcript,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error('Error handling /api/gemini request:', err);
    res.status(500).json({ error: err.message || 'Error processing Gemini command' });
  }
});

// Serve frontend static build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`CAST Serviços Técnicos server running on port ${port}`);
});
