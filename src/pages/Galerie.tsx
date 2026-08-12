import { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/layout/AnimatedPage';
import { X, ZoomIn } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';



// Helper pour gérer les URLs relatives et absolues d'images
const getImageUrl = (path: string | undefined) => {
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return path.startsWith('/') ? path : `/${path}`;
};

const FILTERS = ["Tous", "MACOF Immobilier", "MACOF Restauration", "MACOF Print & Com", "MACOF Mining", "MACOF Transit", "MACOF Fishing"];

const FALLBACK_GALERIE = [
  { id: 1, filiale: "MACOF Immobilier", titre: "Résidence Kaloum", image_path: "https://images.unsplash.com/photo-1778553244173-c5fc6e857120?q=80&w=1000&auto=format&fit=crop", desc: "Projet résidentiel d'envergure, standing international." },
  { id: 2, filiale: "MACOF Immobilier", titre: "Tour Administrative", image_path: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop", desc: "Construction de bureaux modernes." },
  { id: 3, filiale: "MACOF Restauration", titre: "Service Traiteur SEBA", image_path: "https://images.unsplash.com/photo-1750943041213-db8328856b48?q=80&w=1000&auto=format&fit=crop", desc: "Organisation de buffets pour événements corporate." },
  { id: 4, filiale: "MACOF Restauration", titre: "Haute Gastronomie", image_path: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop", desc: "Plats raffinés préparés par nos chefs." },
  { id: 5, filiale: "MACOF Print & Com", titre: "Impression Offset", image_path: "https://images.unsplash.com/photo-1503694978374-8a2fa686963a?q=80&w=1000&auto=format&fit=crop", desc: "Lignes de production haute capacité." },
  { id: 6, filiale: "MACOF Print & Com", titre: "Signalétique", image_path: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1000&auto=format&fit=crop", desc: "Création de panneaux publicitaires." },
  { id: 7, filiale: "MACOF Mining", titre: "Extraction Minière", image_path: "https://images.unsplash.com/photo-1781546441738-b85e43e733e3?q=80&w=1000&auto=format&fit=crop", desc: "Exploitation responsable de carrières." },
  { id: 8, filiale: "MACOF Transit", titre: "Logistique Portuaire", image_path: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop", desc: "Conteneurs en transit au port." },
  { id: 9, filiale: "MACOF Fishing", titre: "Flotte Industrielle", image_path: "https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?q=80&w=1000&auto=format&fit=crop", desc: "Navires de pêche équipés HACCP." },
  { id: 10, filiale: "MACOF Fishing", titre: "Traitement Produits", image_path: "https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?q=80&w=1000&auto=format&fit=crop", desc: "Usines de filetage certifiées." }
];

export default function Galerie() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const { data: images = [] } = useQuery({
    queryKey: ['galerieData'],
    queryFn: async () => {
      try {
        const res = await api.get('/galerie');
        if (res.data.success) {
          const data = res.data.data;
          const items = Array.isArray(data) ? data : (data.items || []);
          if (items.length > 0) return items;
        }
      } catch (err) {
        console.warn("API Error galerie, using fallback");
      }
      return FALLBACK_GALERIE;
    },
    
  });

  const filteredImages = activeFilter === "Tous"
    ? images
    : images.filter((img: any) => (img.filiale_nom || img.filiale) === activeFilter);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage !== null) {
        setSelectedImage(null);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  return (
    <AnimatedPage className="bg-[#050505] min-h-screen">
      <div className="pt-32 pb-24">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          
          <div className="mb-20 text-center">
            <h1 className="text-5xl md:text-7xl font-serif text-white font-light mb-6 tracking-tight">
              Nos <span className="italic text-white/50">Réalisations</span>
            </h1>
            <p className="text-white/60 font-sans font-light max-w-2xl mx-auto leading-relaxed text-lg">
              Une sélection visuelle illustrant l'excellence opérationnelle de MACOF Holding à travers ses six pôles d'expertise.
            </p>
          </div>

          {/* Filtres Interactifs */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-16">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-2.5 text-xs font-sans tracking-[0.2em] uppercase transition-all duration-500 rounded-full border ${
                  activeFilter === f 
                    ? 'border-white bg-white text-black' 
                    : 'border-white/10 text-white/70 hover:border-white/40 hover:text-white bg-white/[0.02]'
                }`}
              >
                {f.replace('MACOF ', '')}
              </button>
            ))}
          </div>

          {/* Grille Asymétrique avec Framer Motion */}
          <motion.div 
            layout
            className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
          >
            <AnimatePresence>
              {filteredImages.map((img: any, index: number) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
                  key={img.id || index} 
                  className="break-inside-avoid relative group overflow-hidden bg-black/50 cursor-pointer rounded-sm"
                  onClick={() => setSelectedImage(img)}
                >
                  <div className="aspect-auto overflow-hidden">
                    <img
                      src={getImageUrl(img.image_path)}
                      alt={img.titre} 
                      className="w-full h-auto object-cover filter grayscale-[30%] group-hover:grayscale-0 transform group-hover:scale-110 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                    <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                      <span className="text-white/70 font-sans text-xs tracking-widest uppercase mb-3 block font-semibold">{img.filiale_nom || img.filiale}</span>
                      <h3 className="text-white font-serif text-2xl mb-2">{img.titre}</h3>
                      <div className="flex items-center gap-2 text-white/50 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        <ZoomIn size={16} /> <span>Agrandir</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Lightbox / Modal (Framer Motion) */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-12"
            onClick={(e) => { if (e.target === e.currentTarget) { setSelectedImage(null); document.body.style.overflow = ''; } }}
          >
            <button 
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-50 p-2 rounded-full hover:bg-white/10"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} strokeWidth={1} />
            </button>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-7xl w-full h-full flex flex-col items-center justify-center relative"
            >
              <img
                src={getImageUrl(selectedImage.image_path)}
                alt={selectedImage.titre}
                className="max-h-[75vh] w-auto object-contain shadow-2xl"
              />
              <div className="mt-8 text-center bg-black/40 px-8 py-6 rounded-lg backdrop-blur-md max-w-2xl w-full border border-white/10">
                <span className="text-white/50 font-sans text-xs tracking-[0.3em] uppercase block mb-3 font-semibold">{selectedImage.filiale_nom || selectedImage.filiale}</span>
                <h3 className="text-3xl font-serif text-white mb-4">{selectedImage.titre}</h3>
                <p className="text-white/80 font-light font-sans text-lg">{selectedImage.description_courte || selectedImage.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
