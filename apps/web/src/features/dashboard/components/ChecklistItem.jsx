import { Icon } from '../../../components/Icon.jsx';

/**
 * A single onboarding row. The row `div` owns the toggle click; the inner
 * button has no handler of its own (its click, including keyboard
 * Enter/Space, bubbles to the row). The trailing action button
 * `stopPropagation`s so it never toggles the row (FR-017).
 */
export function ChecklistItem({ item, completed, onToggle }) {
  return (
    <div
      onClick={() => onToggle(item.id)}
      className={`flex items-center justify-between p-space-sm rounded-lg transition-all cursor-pointer ${
        completed
          ? 'bg-surface-container-low hover:bg-surface-container'
          : 'bg-surface-container-lowest hover:bg-surface-container-low border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
      }`}
    >
      <button
        type="button"
        aria-pressed={completed}
        className="flex items-center gap-space-sm text-left"
      >
        <Icon
          name={completed ? 'check_circle' : 'radio_button_unchecked'}
          size={22}
          filled={completed}
          className={completed ? 'text-secondary' : 'text-outline'}
        />
        <div className="flex flex-col">
          <span
            className={`text-label-lg text-on-surface ${completed ? 'line-through text-outline' : ''}`}
          >
            {item.title}
          </span>
          <span className="text-body-sm text-on-surface-variant">{item.description}</span>
        </div>
      </button>
      {completed ? (
        <span className="text-label-sm text-secondary bg-secondary-fixed/40 px-2 py-0.5 rounded-xs">
          Completed
        </span>
      ) : (
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-1 text-label-sm text-secondary hover:text-primary px-2.5 py-1 rounded-xs bg-surface-container"
        >
          {item.actionLabel} <Icon name="arrow_forward" size={14} />
        </button>
      )}
    </div>
  );
}
