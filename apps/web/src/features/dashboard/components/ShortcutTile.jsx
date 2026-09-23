import { Link } from 'react-router';
import { Icon } from '../../../components/Icon.jsx';

const TILE_CLASSES =
  'group p-space-md rounded-lg bg-surface-container-low hover:bg-surface-container transition-all flex flex-col gap-space-xs';

function TileContent({ title, description, icon }) {
  return (
    <>
      <div className="w-8 h-8 rounded-lg bg-secondary/10 group-hover:bg-secondary text-secondary group-hover:text-on-secondary flex items-center justify-center transition-colors">
        <Icon name={icon} size={20} />
      </div>
      <span className="text-label-lg text-on-surface group-hover:text-secondary font-semibold mt-1">
        {title}
      </span>
      <span className="text-body-sm text-outline">{description}</span>
    </>
  );
}

/** A quick-navigation tile: a real link when `to` is given, otherwise inert (FR-019). */
export function ShortcutTile({ title, description, icon, to }) {
  if (to) {
    return (
      <Link to={to} className={TILE_CLASSES}>
        <TileContent title={title} description={description} icon={icon} />
      </Link>
    );
  }

  return (
    <button type="button" className={TILE_CLASSES}>
      <TileContent title={title} description={description} icon={icon} />
    </button>
  );
}
