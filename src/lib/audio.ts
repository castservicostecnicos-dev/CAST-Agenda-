// Speech recognition and synthesis wrapper for mobile web and desktop

interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export class AudioService {
  private static recognition: any = null;
  private static isListening: boolean = false;

  public static isSpeechSupported(): boolean {
    const win = window as unknown as IWindow;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public static startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): boolean {
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      onError('Reconhecimento de voz não suportado neste navegador. Utilize digitação ou navegador Chrome no celular.');
      return false;
    }

    try {
      if (this.recognition && this.isListening) {
        this.recognition.stop();
      }

      const rec = new SpeechRec();
      rec.lang = 'pt-BR';
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        this.isListening = true;
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript, true);
        } else if (interimTranscript) {
          onResult(interimTranscript, false);
        }
      };

      rec.onerror = (event: any) => {
        this.isListening = false;
        onError(event.error === 'no-speech' ? 'Nenhuma fala detectada. Tente novamente.' : `Erro no microfone: ${event.error}`);
      };

      rec.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition = rec;
      rec.start();
      return true;
    } catch (e: any) {
      console.error('Error starting speech recognition:', e);
      onError('Não foi possível iniciar o microfone.');
      return false;
    }
  }

  public static stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }

  // Voice synthesis speaking in Portuguese
  public static speak(text: string, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop prior audio
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05; // slightly faster for punchy mobile feedback
      utterance.pitch = 1.0;

      // Select Portuguese voice if available
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      onEnd?.();
    }
  }
}
