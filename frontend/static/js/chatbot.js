(() => {
  const chatbox = document.getElementById("chatbox");
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");
  const promptChips = document.querySelectorAll(".prompt-chip");
  const micButton = document.getElementById("micButton");
  const voiceToggle = document.getElementById("voiceOutputToggle");
  const voiceStatus = document.getElementById("voiceStatus");

  if (!chatbox || !chatForm || !userInput || !sendButton) {
    return;
  }

  const MAX_HISTORY = 8;
  const analyticsConsent = () => {
    try { return window.localStorage.getItem("sameer-analytics-consent") === "accepted"; }
    catch { return false; }
  };
  const FALLBACK_ERROR = "Laddu couldn't answer right now. Please try again in a moment.";
  const history = [];
  let isPending = false;
  let micAvailable = false;

  const setStatus = (text, tone = "") => {
    if (!voiceStatus) {
      return;
    }
    voiceStatus.textContent = text;
    voiceStatus.dataset.tone = tone;
  };

  /* ---------------------------------------------------------------- */
  /* Voice output (speech synthesis)                                   */
  /* ---------------------------------------------------------------- */

  const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  const VOICE_PREF_KEY = "laddu-voice-replies";
  let voiceEnabled = true;
  let preferredVoice = null;

  const readPreference = () => {
    try {
      return window.localStorage.getItem(VOICE_PREF_KEY);
    } catch {
      return null;
    }
  };

  const writePreference = (value) => {
    try {
      window.localStorage.setItem(VOICE_PREF_KEY, value);
    } catch {
      // Storage can be blocked (private mode); the toggle still works for this visit.
    }
  };

  const pickVoice = () => {
    if (!synth) {
      return;
    }
    const voices = synth.getVoices();
    const english = voices.filter((voice) => /^en[-_]/i.test(voice.lang));
    const indian = english.filter((voice) => /en[-_]IN/i.test(voice.lang));
    const female = (voice) => /female|woman|girl|sophia|neerja|priya|kavya|heera|raveena|veena/i.test(voice.name);
    preferredVoice =
      indian.find((voice) => female(voice) && /natural|online|neural/i.test(voice.name)) ||
      indian.find(female) ||
      indian.find((voice) => /natural|online|neural/i.test(voice.name)) ||
      indian[0] ||
      english.find((voice) => female(voice) && /natural|online|neural/i.test(voice.name)) ||
      english.find(female) ||
      english.find((voice) => /natural|online|neural/i.test(voice.name) && /en[-_](US|GB)/i.test(voice.lang)) ||
      english.find((voice) => /en[-_]US/i.test(voice.lang) && voice.localService === false) ||
      english.find((voice) => voice.default) ||
      english[0] ||
      null;
  };

  // Long utterances get cut off in Chrome after ~15 seconds, so speak sentence-sized chunks.
  const toSpeechChunks = (text) => {
    const cleaned = text
      .replace(/https?:\/\/\S+/g, "link")
      .replace(/[*_#`|>]+/g, " ")
      .replace(/^\s*1[.)]\s+/gm, "First, ")
      .replace(/^\s*2[.)]\s+/gm, "Second, ")
      .replace(/^\s*3[.)]\s+/gm, "Third, ")
      .replace(/\bROC[- ]AUC\b/gi, "rock A U C")
      .replace(/\bHRMS\b/g, "H R M S")
      .replace(/\bLLM\b/g, "large language model")
      .replace(/\bAI\b/g, "A I")
      .replace(/\bAPI\b/g, "A P I")
      .replace(/\bFastAPI\b/g, "Fast A P I")
      .replace(/\bCI\/CD\b/g, "continuous integration and delivery")
      .replace(/\s*→\s*/g, ", then ")
      .replace(/\s*[·•]\s*/g, ", ")
      .replace(/\s*[–—]\s*/g, ", ")
      .replace(/\s+/g, " ")
      .trim();

    const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
    const chunks = [];
    let current = "";
    sentences.forEach((sentence) => {
      if ((current + sentence).length > 200 && current) {
        chunks.push(current.trim());
        current = "";
      }
      current += sentence;
    });
    if (current.trim()) {
      chunks.push(current.trim());
    }
    return chunks;
  };

  const stopSpeaking = () => {
    if (synth && (synth.speaking || synth.pending)) {
      synth.cancel();
    }
    chatbox.querySelectorAll(".chat-message.is-speaking").forEach((node) => node.classList.remove("is-speaking"));
  };

  const speak = (text, messageNode) => {
    if (!synth || !voiceEnabled || !text) {
      return;
    }

    stopSpeaking();
    const chunks = toSpeechChunks(text);
    if (!chunks.length) {
      return;
    }

    messageNode?.classList.add("is-speaking");
    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
      } else {
        utterance.lang = "en-US";
      }
      utterance.rate = 0.92;
      utterance.pitch = 1.06;
      if (index === chunks.length - 1) {
        utterance.onend = () => messageNode?.classList.remove("is-speaking");
      }
      utterance.onerror = () => messageNode?.classList.remove("is-speaking");
      synth.speak(utterance);
    });
  };

  // iOS Safari only allows speech that starts inside a user gesture; speaking an
  // empty utterance on send unlocks the reply that arrives after the network call.
  let speechUnlocked = false;
  const unlockSpeech = () => {
    if (!synth || speechUnlocked || !voiceEnabled) {
      return;
    }
    const primer = new SpeechSynthesisUtterance(" ");
    primer.volume = 0;
    synth.speak(primer);
    speechUnlocked = true;
  };

  const renderVoiceToggle = () => {
    if (!voiceToggle) {
      return;
    }
    voiceToggle.setAttribute("aria-pressed", String(voiceEnabled));
    voiceToggle.classList.toggle("is-off", !voiceEnabled);
    const label = voiceToggle.querySelector(".voice-toggle-label");
    if (label) {
      label.textContent = voiceEnabled ? "Voice replies on" : "Voice replies off";
    }
  };

  if (synth && voiceToggle) {
    voiceEnabled = readPreference() !== "off";
    pickVoice();
    synth.addEventListener?.("voiceschanged", pickVoice);
    voiceToggle.hidden = false;
    renderVoiceToggle();

    voiceToggle.addEventListener("click", () => {
      voiceEnabled = !voiceEnabled;
      writePreference(voiceEnabled ? "on" : "off");
      if (!voiceEnabled) {
        stopSpeaking();
      }
      renderVoiceToggle();
      setStatus(voiceEnabled ? "Laddu will read replies aloud." : "Voice replies turned off.");
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopSpeaking();
      }
    });
    window.addEventListener("pagehide", stopSpeaking);
  }

  /* ---------------------------------------------------------------- */
  /* Chat                                                              */
  /* ---------------------------------------------------------------- */

  const appendMessage = (role, text) => {
    const message = document.createElement("div");
    message.className = `chat-message ${role}`;
    message.textContent = text;
    chatbox.appendChild(message);
    chatbox.scrollTop = chatbox.scrollHeight;
    return message;
  };

  const setPending = (pending) => {
    isPending = pending;
    sendButton.disabled = pending;
    promptChips.forEach((chip) => {
      chip.disabled = pending;
    });
    if (micButton) {
      micButton.disabled = pending || !micAvailable;
    }
    chatbox.setAttribute("aria-busy", String(pending));
  };

  const sendMessage = async (rawQuestion) => {
    const question = rawQuestion.trim();
    if (!question || isPending) {
      return;
    }

    stopListening();
    stopSpeaking();
    unlockSpeech();
    appendMessage("user", question);
    userInput.value = "";
    setPending(true);
    setStatus("");
    const thinking = appendMessage("bot is-thinking", "Laddu is thinking…");

    try {
      const response = await fetch(`${window.PORTFOLIO_API_BASE || ""}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question, history: history.slice(-MAX_HISTORY), analyticsConsent: analyticsConsent() }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || !data.reply) {
        throw new Error(data.error || FALLBACK_ERROR);
      }

      thinking.remove();
      const replyNode = appendMessage("bot", data.reply);
      history.push({ role: "user", content: question }, { role: "assistant", content: data.reply });
      speak(data.spokenReply || data.reply, replyNode);
    } catch (error) {
      thinking.remove();
      const text = error instanceof TypeError ? FALLBACK_ERROR : error.message || FALLBACK_ERROR;
      appendMessage("bot is-error", text);
    } finally {
      setPending(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Voice input (speech recognition)                                  */
  /* ---------------------------------------------------------------- */

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;
  let finalTranscript = "";

  const RECOGNITION_ERRORS = {
    "not-allowed": "Microphone access is blocked. Allow it in your browser's site settings and try again.",
    "service-not-allowed": "Voice input isn't allowed in this browser. You can still type your question.",
    "no-speech": "Didn't catch that. Tap the mic and try again.",
    "audio-capture": "No microphone was found on this device.",
    network: "Voice input needs an internet connection to the browser's speech service.",
    "language-not-supported": "Voice input doesn't support this language here.",
  };

  const renderMic = () => {
    if (!micButton) {
      return;
    }
    micButton.classList.toggle("is-listening", isListening);
    micButton.setAttribute("aria-pressed", String(isListening));
    micButton.setAttribute("aria-label", isListening ? "Stop listening" : "Speak your question");
  };

  function stopListening() {
    if (recognition && isListening) {
      recognition.stop();
    }
  }

  if (micButton && Recognition) {
    micButton.hidden = false;

    if (!window.isSecureContext) {
      micButton.disabled = true;
      micButton.title = "Voice input needs HTTPS or localhost";
    } else {
      recognition = new Recognition();
      micAvailable = true;
      recognition.lang = navigator.language && navigator.language.startsWith("en") ? navigator.language : "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.addEventListener("start", () => {
        isListening = true;
        finalTranscript = "";
        renderMic();
        setStatus("Listening… ask your question.", "listening");
      });

      recognition.addEventListener("result", (event) => {
        let interim = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = event.results[index][0].transcript;
          if (event.results[index].isFinal) {
            finalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }
        userInput.value = (finalTranscript + interim).trim();
      });

      recognition.addEventListener("error", (event) => {
        if (event.error === "aborted") {
          return;
        }
        setStatus(RECOGNITION_ERRORS[event.error] || "Voice input stopped unexpectedly. Please try again.", "error");
      });

      recognition.addEventListener("end", () => {
        isListening = false;
        renderMic();
        const spoken = finalTranscript.trim();
        if (spoken) {
          setStatus("");
          sendMessage(spoken);
        } else if (voiceStatus?.dataset.tone === "listening") {
          setStatus("");
        }
      });

      micButton.addEventListener("click", () => {
        if (isListening) {
          stopListening();
          return;
        }
        if (isPending) {
          return;
        }
        stopSpeaking();
        unlockSpeech();
        userInput.value = "";
        try {
          recognition.start();
        } catch {
          // start() throws if a previous session hasn't fully ended yet.
          setStatus("The microphone is still busy. Try again in a second.", "error");
        }
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Wiring                                                            */
  /* ---------------------------------------------------------------- */

  const canUseMic = Boolean(micButton && !micButton.hidden && micAvailable);
  appendMessage(
    "bot",
    `Hello! I'm Laddu, Sameer's AI assistant. Ask me about his projects, skills, internships, experience, or the kind of work he enjoys.${canUseMic ? " You can type or tap the mic to speak." : ""}`
  );

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(userInput.value);
  });

  promptChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      sendMessage(chip.dataset.question || "");
    });
  });
})();
