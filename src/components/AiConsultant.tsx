import { AlertTriangle, Bot, LoaderCircle, Send, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { samplePrompts } from "../data/mockRestaurantData";
import { askAiConsultant } from "../services/n8nApi";

interface AiConsultantProps {
  responses: Record<string, string>;
}

const fallbackWarning =
  "Using demo answer because live automation is unavailable.";

const getFallbackResponse = (question: string, responses: Record<string, string>) =>
  responses[question] ??
  "Mock consultant response: focus on payroll ratio, food-cost drift, inventory coverage, and low-margin high-volume items before making next week's schedule.";

export function AiConsultant({ responses }: AiConsultantProps) {
  const [input, setInput] = useState(samplePrompts[0]);
  const [activeQuestion, setActiveQuestion] = useState(samplePrompts[0]);
  const [activeResponse, setActiveResponse] = useState(() =>
    getFallbackResponse(samplePrompts[0], responses),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const askQuestion = async (question: string) => {
    setInput(question);
    setActiveQuestion(question);
    setWarning(null);
    setIsLoading(true);

    try {
      const liveAnswer = await askAiConsultant(question);
      setActiveResponse(liveAnswer.answer);
    } catch (error) {
      console.warn(error);
      setActiveResponse(getFallbackResponse(question, responses));
      setWarning(fallbackWarning);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (trimmed.length > 0) {
      void askQuestion(trimmed);
    }
  };

  return (
    <section id="ai-consultant" className="consultant-section">
      <div className="consultant-section__heading">
        <p className="eyebrow">Ask AI consultant</p>
        <h2>Restaurant Ops Chat</h2>
      </div>

      <div className="prompt-row">
        {samplePrompts.map((prompt) => (
          <button
            className="button button--chip"
            disabled={isLoading}
            key={prompt}
            onClick={() => void askQuestion(prompt)}
            type="button"
          >
            <Sparkles aria-hidden="true" size={15} />
            {prompt}
          </button>
        ))}
      </div>

      <div className="chat-shell">
        <div className="message message--user">
          <span>You</span>
          <p>{activeQuestion}</p>
        </div>
        {warning ? (
          <div className="report-warning consultant-warning" role="status">
            <AlertTriangle aria-hidden="true" size={16} />
            {warning}
          </div>
        ) : null}
        <div className="message message--ai">
          <span>
            {isLoading ? (
              <LoaderCircle
                aria-hidden="true"
                className="button-icon--spin"
                size={16}
              />
            ) : (
              <Bot aria-hidden="true" size={16} />
            )}
            JOSE RESTO POC
          </span>
          <p>{isLoading ? "Checking live automation..." : activeResponse}</p>
        </div>

        <form className="chat-input" onSubmit={handleSubmit}>
          <input
            aria-label="Ask AI consultant"
            disabled={isLoading}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about profit, inventory, menu pricing, or payroll"
            type="text"
            value={input}
          />
          <button className="button button--primary" disabled={isLoading} type="submit">
            {isLoading ? (
              <LoaderCircle
                aria-hidden="true"
                className="button-icon--spin"
                size={17}
              />
            ) : (
              <Send aria-hidden="true" size={17} />
            )}
            {isLoading ? "Asking..." : "Ask"}
          </button>
        </form>
      </div>
    </section>
  );
}
