import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { useT } from '../lib/i18n.jsx';

export default function NotFound() {
  const t = useT();
  return (
    <div className="space-y-4">
      <h1 className="h1">{t('errors.notFoundTitle')}</h1>
      <p className="text-lg">{t('errors.notFoundText')}</p>
      <Link to="/" className="btn-primary w-full">
        <Icon name="home" size={26} />
        <span>{t('common.home')}</span>
      </Link>
    </div>
  );
}
