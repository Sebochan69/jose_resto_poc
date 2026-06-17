import { Bot, Send, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { samplePrompts } from "../data/mockRestaurantData";

interface AiConsultantProps {
  responses: Record<string, string>;
}

export function AiConsultant({ responses }: AiConsultantProps) {
  const [input, setInput] = useState(samplePrompts[0]);
  const [activeQuestion, setActiveQuestion] = useState(samplePrompts[0]);

  const activeResponse = useMemo(() => {
    return (
      responses[activeQuestion] ??
      "Mock consultant response: focus on payroll ratio, food-cost drift, inventory coverage, and low-margin high-volume items before making next week's schedule."
    );
  }, [activeQuestion, responses]);

  const askQuestion = (question: string) => {
    setInput(question);
    setActiveQuestion(question);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (trimmed.length > 0) {
      setActiveQuestion(trimmed);
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
            key={prompt}
            onClick={() => askQuestion(prompt)}
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
        <div className="message message--ai">
          <span>
            <Bot aria-hidden="true" size={16} />
            JOSE RESTO POC
          </span>
          <p>{activeResponse}</p>
        </div>

        <form className="chat-input" onSubmit={handleSubmit}>
          <input
            aria-label="Ask AI consultant"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about profit, inventory, menu pricing, or payroll"
            type="text"
            value={input}
          />
          <button className="button button--primary" type="submit">
            <Send aria-hidden="true" size={17} />
            Ask
          </button>
        </form>
      </div>
    </section>
  );
}
