import { AlertTriangle, Bot, LoaderCircle, Send, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { askAiConsultant } from "../services/n8nApi";
import type { N8nAskAiResponse } from "../types";
import { MarkdownReport } from "./MarkdownReport";

interface AiActionBoxProps {
  title: string;
  helper?: string;
  placeholder: string;
  defaultQuestion?: string;
  suggestedQuestions?: string[];
  autoQuestion?: string;
  onAutomationContext?: (response: N8nAskAiResponse) => void;
}

const fallbackAnswer =
  "Demo AI helper: prioritize the highest financial risk first, then confirm the operational action with the latest refreshed data.";

export function AiActionBox({
  title,
  helper,
  placeholder,
  defaultQuestion = "",
  suggestedQuestions = [],
  autoQuestion,
  onAutomationContext,
}: AiActionBoxProps) {
  const [input, setInput] = useState(defaultQuestion);
  const [answer, setAnswer] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const lastAutoQuestion = useRef<string | undefined>(undefined);

  const askQuestion = async (question: string) => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    setInput(trimmedQuestion);
    setActiveQuestion(trimmedQuestion);
    setWarning(null);
    setIsLoading(true);

    try {
      const response = await askAiConsultant(trimmedQuestion);
      setAnswer(response.answer);
      onAutomationContext?.(response);
    } catch (error) {
      console.warn(error);
      setAnswer(fallbackAnswer);
      setWarning("Using demo answer because live automation is unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoQuestion && autoQuestion !== lastAutoQuestion.current) {
      lastAutoQuestion.current = autoQuestion;
      void askQuestion(autoQuestion);
    }
  }, [autoQuestion]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void askQuestion(input);
  };

  return (
    <section className="ai-action-box" aria-label={title}>
      <div className="ai-action-box__header">
        <span>
          <Sparkles aria-hidden="true" size={16} />
          AI action
        </span>
        <strong>{title}</strong>
        {helper ? <p>{helper}</p> : null}
      </div>

      {suggestedQuestions.length > 0 ? (
        <div className="ai-action-box__suggestions">
          {suggestedQuestions.map((question) => (
            <button
              className="button button--chip"
              disabled={isLoading}
              key={question}
              onClick={() => void askQuestion(question)}
              type="button"
            >
              <Sparkles aria-hidden="true" size={14} />
              {question}
            </button>
          ))}
        </div>
      ) : null}

      <form className="ai-action-box__form" onSubmit={handleSubmit}>
        <input
          aria-label={title}
          disabled={isLoading}
          onChange={(event) => setInput(event.target.value)}
          placeholder={placeholder}
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

      {warning ? (
        <div className="report-warning ai-action-box__warning" role="status">
          <AlertTriangle aria-hidden="true" size={16} />
          {warning}
        </div>
      ) : null}

      {activeQuestion || answer || isLoading ? (
        <div className="ai-action-box__answer">
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
            {activeQuestion ?? "AI insight"}
          </span>
          {isLoading ? <p>Checking live automation...</p> : null}
          {!isLoading && answer ? <MarkdownReport content={answer} /> : null}
        </div>
      ) : null}
    </section>
  );
}
