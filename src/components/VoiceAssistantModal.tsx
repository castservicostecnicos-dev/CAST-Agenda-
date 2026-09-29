import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Volume2,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  MapPin,
  User,
  Wrench
} from 'lucide-react';
import { AudioService } from '../lib/audio';
import { interpretVoiceCommandWithGemini } from '../lib/gemini';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { VoiceInterpretation, Appointment } from '../types';
import { appLogo } from '../assets/logo';

interface VoiceAssistantModalProps {
  onClose: () => void;
  onAppointmentCreated: (apt: Appointment) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  onClose,
  onAppointmentCreated,
}) => {
  const { user } = useAuth();
  const { services, appointments, createAppointment } = useData();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [lastResult, setLastResult] = useState<VoiceInterpretation | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Partial collected state for incomplete commands follow-up
  const [accumulatedData, setAccumulatedData] = useState<{
    clientName?: string;
    clientAddress?: string;
    serviceTypeName?: string;
    date?: string;
    time?: string;
  }>({});

  const isSpeechSupported = AudioService.isSpeechSupported();

  useEffect(() => {
    // Start listening on mount for instant mobile command
    if (isSpeechSupported) {
      handleToggleListening();
    }

    return () => {
      AudioService.stopListening();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      AudioService.stopListening();
      setIsListening(false);
    } else {
      setErrorMessage('');
      const started = AudioService.startListening(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            handleProcessCommand(text);
          }
        },
        (err) => {
          setErrorMessage(err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
      if (started) {
        setIsListening(true);
      }
    }
  };

  const handleProcessCommand = async (commandText: string) => {
    if (!commandText.trim()) return;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Merge previously missing fields if this is a follow-up
      let textToSend = commandText;
      if (accumulatedData.clientName && !textToSend.toLowerCase().includes(accumulatedData.clientName.toLowerCase())) {
        textToSend = `Cliente: ${accumulatedData.clientName}. Endereço: ${accumulatedData.clientAddress || ''}. ` + textToSend;
      }

      const interpretation = await interpretVoiceCommandWithGemini(
        textToSend,
        services,
        appointments
      );

      setLastResult(interpretation);

      // Speak response
      if (interpretation.responseSpeech) {
        setLastResponse(interpretation.responseSpeech);
        setIsSpeaking(true);
        AudioService.speak(interpretation.responseSpeech, () => {
          setIsSpeaking(false);
        });
      }

      // Handle Action
      if (interpretation.action === 'create_appointment') {
        // Find matching service
        const matchedSrv = services.find(
          s => s.name.toLowerCase() === interpretation.serviceTypeName?.toLowerCase()
        ) || services[0];

        const created = await createAppointment({
          clientName: interpretation.clientName || 'Cliente',
          clientAddress: interpretation.clientAddress || 'Endereço informado',
          serviceTypeId: matchedSrv.id,
          serviceTypeName: matchedSrv.name,
          date: interpretation.date || new Date().toISOString().split('T')[0],
          time: interpretation.time || '08:00',
          status: 'scheduled',
          notes: interpretation.notes || `Agendado via Gemini`,
          tools: matchedSrv.tools,
          reminderMinutes: 30,
          createdBy: user?.id || 'master',
        });

        // Clear partial
        setAccumulatedData({});
        onAppointmentCreated(created);
      } else if (interpretation.action === 'incomplete_command') {
        // Store what we have so the user can just answer the missing piece
        setAccumulatedData(prev => ({
          ...prev,
          clientName: interpretation.clientName || prev.clientName,
          clientAddress: interpretation.clientAddress || prev.clientAddress,
          serviceTypeName: interpretation.serviceTypeName || prev.serviceTypeName,
          date: interpretation.date || prev.date,
          time: interpretation.time || prev.time,
        }));
      }
    } catch (err: any) {
      console.error('Error in voice command:', err);
      setErrorMessage('Não foi possível processar o comando. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickQueries = [
    'Quais são meus serviços de hoje?',
    'Qual é o próximo atendimento?',
    'Que serviços tenho amanhã?',
    'Qual é o endereço do próximo cliente?',
    'Tenho algum serviço hoje à tarde?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700/80 shrink-0 shadow-md shadow-cyan-950/40 bg-slate-900">
              <img src={appLogo} alt="CAST Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">
                Assistente de Voz Gemini
              </h2>
              <span className="text-[10px] text-cyan-400 font-medium">
                CAST Serviços Técnicos
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col items-center">
          {/* Main Pulsing Mic Button */}
          <div className="my-3 flex flex-col items-center">
            <div className="relative">
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
              )}
              {isSpeaking && (
                <div className="absolute -inset-2 rounded-full border-2 border-cyan-400/40 animate-pulse" />
              )}
              <button
                type="button"
                onClick={handleToggleListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-rose-600/30 ring-4 ring-rose-500/20'
                    : isProcessing
                    ? 'bg-cyan-700 text-white animate-spin'
                    : 'bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30'
                }`}
                title={isListening ? 'Parar gravação' : 'Toque para falar'}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <div className="mt-3 text-xs font-semibold text-center">
              {isListening ? (
                <span className="text-cyan-400 animate-pulse flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Ouvindo... Fale seu comando
                </span>
              ) : isProcessing ? (
                <span className="text-cyan-400">Processando com Gemini...</span>
              ) : isSpeaking ? (
                <span className="text-emerald-400 flex items-center gap-1.5 justify-center">
                  <Volume2 className="w-3.5 h-3.5" />
                  Falando resposta...
                </span>
              ) : (
                <span className="text-slate-400">Toque no microfone para falar</span>
              )}
            </div>
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="w-full my-2 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Comando falado
              </span>
              <p className="text-xs text-white font-medium italic">
                "{transcript}"
              </p>
            </div>
          )}

          {/* Error notice */}
          {errorMessage && (
            <div className="w-full my-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Assistant Response Box */}
          {lastResponse && (
            <div
              className={`w-full my-2 p-3.5 rounded-xl border text-xs leading-relaxed ${
                lastResult?.action === 'create_appointment'
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                  : lastResult?.action === 'incomplete_command'
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                  : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1.5">
                {lastResult?.action === 'create_appointment' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Atendimento Agendado com Sucesso!</span>
                  </>
                )}
                {lastResult?.action === 'incomplete_command' && (
                  <>
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Informações Pendentes</span>
                  </>
                )}
                {lastResult?.action === 'query_agenda' && (
                  <>
                    <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Consulta da Agenda</span>
                  </>
                )}
              </div>
              <p>{lastResponse}</p>
            </div>
          )}

          {/* Quick Voice Suggestions */}
          <div className="w-full mt-3 pt-3 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Exemplos de comandos rápidos:
            </span>
            <div className="flex flex-col gap-1.5">
              {quickQueries.map((query, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTranscript(query);
                    handleProcessCommand(query);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-xs text-slate-300 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{query}</span>
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text fallback input */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessCommand(transcript);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Ou digite o comando aqui..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isProcessing || !transcript.trim()}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
