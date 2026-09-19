import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE } from '../lib/utils';
import { AnimatedPage } from '../components/layout/AnimatedPage';

interface Partenaire {
  nom: string;
  logo_url: string;
}

export default function Partenaires() {
  const { data: partenaires = [], isLoading } = useQuery({
    queryKey: ['publicPartenaires'],
    queryFn: async () => {
      const response = await api.get('/pages/home');
      const raw = response.data?.success ? response.data.data?.partenaires : null;
      if (!raw) return [];
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed as Partenaire[] : [];
      } catch {
        return [];
      }
    },
  });

  return (
    <AnimatedPage className="bg-[#050505] min-h-screen">
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <header className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-red-500 text-xs uppercase tracking-[0.35em] mb-5 font-semibold">Écosystème MACOF</p>
            <h1 className="text-5xl md:text-7xl font-serif text-white font-light mb-6">
              Nos <span className="italic text-white/50">Partenaires</span>
            </h1>
            <p className="text-white/60 text-lg font-light leading-relaxed">
              Des collaborations durables avec des acteurs qui partagent notre exigence d'excellence.
            </p>
          </header>

          {isLoading ? (
            <div className="py-20 text-center text-white/50">Chargement des partenaires...</div>
          ) : partenaires.length === 0 ? (
            <div className="border border-white/10 bg-white/[0.03] py-20 px-6 text-center text-white/50">
              Aucun partenaire publié pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {partenaires.map((partenaire, index) => (
                <article key={`${partenaire.nom}-${index}`} className="min-h-40 border border-white/10 bg-white/[0.03] p-8 flex flex-col items-center justify-center gap-5">
                  <img
                    src={getImageUrl(partenaire.logo_url)}
                    alt={partenaire.nom}
                    className="max-h-20 max-w-full object-contain grayscale hover:grayscale-0 transition duration-300"
                    onError={(event) => { event.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                  />
                  <h2 className="text-white/75 text-sm text-center tracking-wide">{partenaire.nom}</h2>
                </article>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <Link to="/contact" className="inline-flex px-6 py-3 bg-white text-black text-xs uppercase tracking-[0.2em] hover:bg-red-200 transition-colors">
              Devenir partenaire
            </Link>
          </div>
        </div>
      </main>
    </AnimatedPage>
  );
}