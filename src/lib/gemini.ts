import { Appointment, ServiceType, VoiceInterpretation } from '../types';

// Helper to format date in YYYY-MM-DD
export const getFormattedDate = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateWord = (text: string): string => {
  const lower = text.toLowerCase();
  if (lower.includes('hoje')) {
    return getFormattedDate(0);
  }
  if (lower.includes('depois de amanhã') || lower.includes('depois de amanha')) {
    return getFormattedDate(2);
  }
  if (lower.includes('amanhã') || lower.includes('amanha')) {
    return getFormattedDate(1);
  }
  if (lower.includes('segunda')) return getNextDayOfWeek(1);
  if (lower.includes('terça') || lower.includes('terca')) return getNextDayOfWeek(2);
  if (lower.includes('quarta')) return getNextDayOfWeek(3);
  if (lower.includes('quinta')) return getNextDayOfWeek(4);
  if (lower.includes('sexta')) return getNextDayOfWeek(5);
  if (lower.includes('sábado') || lower.includes('sabado')) return getNextDayOfWeek(6);
  if (lower.includes('domingo')) return getNextDayOfWeek(0);

  // Check DD/MM or DD/MM/YYYY pattern
  const dateMatch = lower.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3] ? (dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]) : new Date().getFullYear().toString();
    return `${year}-${month}-${day}`;
  }

  // Check "dia 15", "dia 2"
  const dayMatch = lower.match(/dia\s+(\d{1,2})/);
  if (dayMatch) {
    const day = dayMatch[1].padStart(2, '0');
    const current = new Date();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    return `${current.getFullYear()}-${month}-${day}`;
  }

  return getFormattedDate(0); // default to today if not found
};

const getNextDayOfWeek = (dayOfWeek: number): string => {
  const d = new Date();
  const currentDay = d.getDay();
  let distance = dayOfWeek - currentDay;
  if (distance <= 0) distance += 7;
  d.setDate(d.getDate() + distance);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseTimeWord = (text: string): string | undefined => {
  const lower = text.toLowerCase();
  
  // "às 14:30", "as 14h30", "14h", "14 horas", "às 9"
  const timeRegex = /(?:às|as|para\s+as|para\s+às)?\s*(\d{1,2})(?::|h|:\s*)(\d{2})?/i;
  const match = lower.match(timeRegex);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2] ? match[2] : '00';
    
    // Check if afternoon "tarde" or "noite"
    if (lower.includes('tarde') && hour < 12 && hour > 0) {
      hour += 12;
    }
    if (lower.includes('noite') && hour < 12 && hour > 0) {
      hour += 12;
    }
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  const hourOnly = lower.match(/(?:às|as)?\s*(\d{1,2})\s*horas/i);
  if (hourOnly) {
    let hour = parseInt(hourOnly[1], 10);
    if (lower.includes('tarde') && hour < 12) hour += 12;
    return `${String(hour).padStart(2, '0')}:00`;
  }

  return undefined;
};

// Local offline Portuguese parser fallback
export const parseOfflineVoiceCommand = (
  rawText: string,
  availableServices: ServiceType[],
  appointments: Appointment[]
): VoiceInterpretation => {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Agenda queries
  if (
    lower.includes('quais') ||
    lower.includes('qual é') ||
    lower.includes('qual o') ||
    lower.includes('que serviços') ||
    lower.includes('que servicos') ||
    lower.includes('tenho algum serviço') ||
    lower.includes('tenho algum servico') ||
    lower.includes('próximo atendimento') ||
    lower.includes('proximo atendimento') ||
    lower.includes('próximo cliente') ||
    lower.includes('proximo cliente') ||
    lower.includes('endereço do próximo') ||
    lower.includes('endereco do proximo')
  ) {
    const today = getFormattedDate(0);
    const tomorrow = getFormattedDate(1);

    if (lower.includes('endereço') || lower.includes('endereco') || lower.includes('onde')) {
      const sorted = [...appointments]
        .filter(a => a.date >= today && a.status !== 'completed' && a.status !== 'cancelled')
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      
      const nextApt = sorted[0];
      if (nextApt) {
        return {
          action: 'query_agenda',
          queryType: 'address',
          responseSpeech: `O endereço do próximo atendimento é ${nextApt.clientAddress}, cliente ${nextApt.clientName}, agendado para ${nextApt.time}.`,
        };
      } else {
        return {
          action: 'query_agenda',
          queryType: 'address',
          responseSpeech: 'Você não possui atendimentos pendentes na agenda.',
        };
      }
    }

    if (lower.includes('próximo') || lower.includes('proximo')) {
      const sorted = [...appointments]
        .filter(a => a.date >= today && a.status !== 'completed' && a.status !== 'cancelled')
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      
      const nextApt = sorted[0];
      if (nextApt) {
        return {
          action: 'query_agenda',
          queryType: 'next',
          responseSpeech: `Seu próximo atendimento é às ${nextApt.time} com ${nextApt.clientName} para ${nextApt.serviceTypeName}, em ${nextApt.clientAddress}.`,
        };
      } else {
        return {
          action: 'query_agenda',
          queryType: 'next',
          responseSpeech: 'Nenhum próximo atendimento agendado.',
        };
      }
    }

    if (lower.includes('amanhã') || lower.includes('amanha')) {
      const tomorrowApts = appointments.filter(a => a.date === tomorrow && a.status !== 'cancelled');
      if (tomorrowApts.length === 0) {
        return {
          action: 'query_agenda',
          queryType: 'tomorrow',
          responseSpeech: 'Você não tem atendimentos agendados para amanhã.',
        };
      }
      const list = tomorrowApts.map(a => `às ${a.time}, ${a.serviceTypeName} para ${a.clientName}`).join('; ');
      return {
        action: 'query_agenda',
        queryType: 'tomorrow',
        responseSpeech: `Amanhã você tem ${tomorrowApts.length} atendimento(s): ${list}.`,
      };
    }

    if (lower.includes('tarde')) {
      const afternoonApts = appointments.filter(a => a.date === today && a.time >= '12:00' && a.status !== 'cancelled');
      if (afternoonApts.length === 0) {
        return {
          action: 'query_agenda',
          queryType: 'afternoon',
          responseSpeech: 'Você não tem atendimentos marcados para hoje à tarde.',
        };
      }
      const list = afternoonApts.map(a => `às ${a.time}, ${a.serviceTypeName} com ${a.clientName}`).join('; ');
      return {
        action: 'query_agenda',
        queryType: 'afternoon',
        responseSpeech: `Hoje à tarde você tem: ${list}.`,
      };
    }

    // Default today query
    const todayApts = appointments.filter(a => a.date === today && a.status !== 'cancelled');
    if (todayApts.length === 0) {
      return {
        action: 'query_agenda',
        queryType: 'today',
        responseSpeech: 'Você não possui nenhum atendimento agendado para hoje.',
      };
    }
    const list = todayApts.map(a => `às ${a.time}, ${a.serviceTypeName} para ${a.clientName} em ${a.clientAddress}`).join('. ');
    return {
      action: 'query_agenda',
      queryType: 'today',
      responseSpeech: `Hoje você tem ${todayApts.length} atendimento(s): ${list}.`,
    };
  }

  // 2. Schedule appointment intent
  // Try to match registered service types
  let matchedService: ServiceType | undefined;
  for (const s of availableServices) {
    const sName = s.name.toLowerCase();
    if (lower.includes(sName)) {
      matchedService = s;
      break;
    }
  }

  // Partial matches (e.g. "câmeras", "câmera", "elétrica", "fechadura", "cerca")
  if (!matchedService) {
    if (lower.includes('câmera') || lower.includes('camera') || lower.includes('cftv')) {
      matchedService = availableServices.find(s => s.name.toLowerCase().includes('câmeras')) || availableServices[0];
    } else if (lower.includes('elétrica') || lower.includes('eletrica') || lower.includes('disjuntor')) {
      matchedService = availableServices.find(s => s.name.toLowerCase().includes('elétrica')) || availableServices[2];
    } else if (lower.includes('rede') || lower.includes('cabo de rede') || lower.includes('internet')) {
      matchedService = availableServices.find(s => s.name.toLowerCase().includes('rede')) || availableServices[4];
    } else if (lower.includes('fechadura') || lower.includes('biometria')) {
      matchedService = availableServices.find(s => s.name.toLowerCase().includes('fechadura')) || availableServices[5];
    } else if (lower.includes('cerca') || lower.includes('choque')) {
      matchedService = availableServices.find(s => s.name.toLowerCase().includes('cerca')) || availableServices[7];
    } else if (lower.includes('hidráulica') || lower.includes('hidraulica') || lower.includes('vazamento')) {
      matchedService = availableServices.find(s => s.name.toLowerCase().includes('hidráulica')) || availableServices[8];
    }
  }

  // Extract client name: "para [Nome]" or "cliente [Nome]"
  let clientName: string | undefined;
  const clientMatch = text.match(/(?:para|cliente|com)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç\s]+?)(?:,|\sna\s|\sno\s|\sem\s|\spara\s|\sàs\s|\sas\s|\samanhã|\shoje|$)/i);
  if (clientMatch && clientMatch[1]) {
    const candidate = clientMatch[1].trim();
    if (!['cast', 'agenda', 'amanhã', 'hoje', 'um serviço', 'serviço'].includes(candidate.toLowerCase())) {
      clientName = candidate;
    }
  }

  // Extract address: "na Rua X", "em Rua X", "no Centro", "no endereço X"
  let clientAddress: string | undefined;
  const addressMatch = text.match(/(?:na|no|em|endereço|local)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç0-9\s,\.\-]+?)(?:,|\spara\s|\sàs\s|\sas\s|\scom\s|\samanhã|\shoje|$)/i);
  if (addressMatch && addressMatch[1]) {
    const cand = addressMatch[1].trim();
    if (!cand.toLowerCase().startsWith('cast') && cand.length > 3) {
      clientAddress = cand;
    }
  }

  // Extract Date & Time
  const date = parseDateWord(text);
  const time = parseTimeWord(text);

  // Check missing mandatory fields
  const missing: string[] = [];
  if (!clientName) missing.push('o nome do cliente');
  if (!clientAddress) missing.push('o local/endereço do atendimento');
  if (!matchedService) missing.push('o tipo de serviço');
  if (!time) missing.push('o horário');

  if (missing.length > 0) {
    const clarification = `Falta informar ${missing.join(', e ')}.`;
    return {
      action: 'incomplete_command',
      clientName,
      clientAddress,
      serviceTypeName: matchedService?.name,
      date,
      time,
      missingFields: missing,
      clarificationMessage: clarification,
      responseSpeech: clarification,
    };
  }

  const dateLabel = date === getFormattedDate(1) ? 'amanhã' : (date === getFormattedDate(0) ? 'hoje' : `no dia ${date.split('-').reverse().join('/')}`);
  const confirmation = `Agendamento criado para ${clientName} ${dateLabel} às ${time}, ${matchedService!.name}, no endereço ${clientAddress}.`;

  return {
    action: 'create_appointment',
    clientName,
    clientAddress,
    serviceTypeName: matchedService!.name,
    date,
    time,
    notes: `Agendado via comando de voz Gemini: "${text}"`,
    responseSpeech: confirmation,
  };
};

// Call server-side Gemini API or direct client key with offline NLP fallback
export const interpretVoiceCommandWithGemini = async (
  rawText: string,
  availableServices: ServiceType[],
  appointments: Appointment[]
): Promise<VoiceInterpretation> => {
  const appointmentsSummary = appointments.map(a => ({
    date: a.date,
    time: a.time,
    client: a.clientName,
    address: a.clientAddress,
    service: a.serviceTypeName,
    status: a.status
  }));

  // 1. Try backend endpoint first (if running as Web Service)
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: rawText,
        services: availableServices.map(s => s.name),
        appointmentsSummary,
        currentDate: getFormattedDate(0),
        currentTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.action) {
        return data as VoiceInterpretation;
      }
    }
  } catch (e) {
    // Backend unavailable, continue to next options
  }

  // 2. If static site has VITE_GEMINI_API_KEY configured in environment
  const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (clientApiKey) {
    try {
      const systemInstruction = `Você é o assistente inteligente da CAST Serviços Técnicos.
Data atual: ${getFormattedDate(0)}.
Serviços disponíveis: ${availableServices.map(s => s.name).join(', ')}.
Atendimentos cadastrados: ${JSON.stringify(appointmentsSummary)}.

Analise a mensagem falada e responda estritamente em formato JSON:
Para novo agendamento completo:
{ "action": "create_appointment", "clientName": "...", "clientAddress": "...", "serviceTypeName": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "responseSpeech": "..." }

Para comando incompleto:
{ "action": "incomplete_command", "missingFields": ["..."], "clarificationMessage": "...", "responseSpeech": "..." }

Para consulta da agenda:
{ "action": "query_agenda", "queryAnswer": "...", "responseSpeech": "..." }`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: rawText }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const parsed = JSON.parse(candidateText);
          if (parsed && parsed.action) {
            return parsed as VoiceInterpretation;
          }
        }
      }
    } catch (err) {
      console.warn('Direct Gemini API error, falling back to local NLP:', err);
    }
  }

  // 3. Graceful offline local Portuguese NLP engine
  return parseOfflineVoiceCommand(rawText, availableServices, appointments);
};
