export const suggestedQuestions = ["How is our pipeline looking this quarter?", "Which work orders are delayed?", "Compare performance by sector", "Generate a leadership update"];

export function Suggestions({ onSelect, disabled }: { onSelect: (question: string) => void; disabled: boolean }) {
  return <div className="suggestions" aria-label="Suggested questions">{suggestedQuestions.map((question, index) => <button type="button" key={question} onClick={() => onSelect(question)} disabled={disabled}><span className="suggestion-number" aria-hidden="true">0{index + 1}</span><span>{question}</span></button>)}</div>;
}
