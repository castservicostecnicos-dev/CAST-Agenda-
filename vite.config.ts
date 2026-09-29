import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function geminiApiPlugin(): Plugin {
  return {
    name: 'gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/gemini' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { transcript, services, appointmentsSummary, currentDate, currentTime } = JSON.parse(body);
              const apiKey = process.env.GEMINI_API_KEY;

              if (!apiKey) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }));
                return;
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

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(response.text || '{}');
            } catch (err: any) {
              console.error('Error handling /api/gemini request:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message || 'Error processing Gemini command' }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
