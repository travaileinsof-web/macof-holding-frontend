import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE } from '../../lib/utils';
import { useCart } from './CartContext';
import type { Product } from './CartContext';


const fallbackProducts: Product[] = [
  { id: -1, nom: 'Boulangerie & Pâtisserie', description: 'Pains artisanaux, viennoiseries et créations fraîches du jour.', categorie: 'boulangerie', prix_gnf: 0, image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop' },
  { id: -2, nom: 'Plats SEBA', description: 'Cuisine généreuse et raffinée, préparée par nos chefs.', categorie: 'plats', prix_gnf: 0, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop' },
  { id: -3, nom: 'Boissons & Cocktails', description: 'Jus pressés, boissons fraîches et cocktails sans alcool.', categorie: 'boissons', prix_gnf: 0, image_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=1000&auto=format&fit=crop' },
];

const formatPrice = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} GNF`;

export default function MenuCommande() {
  const [products, setProducts] = useState<Product[]>([]);
  const { items, add } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/restauration/menu').then((response) => setProducts(response.data?.data?.length ? response.data.data : fallbackProducts)).catch(() => setProducts(fallbackProducts)).finally(() => setLoading(false));
  }, []);


  return (
    <section id="menu-commande" className="py-28 bg-[#0b0b0b] border-y border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-14"><p className="text-xs tracking-[0.3em] uppercase text-red-200 mb-4">SEBA à votre table</p><h2 className="text-4xl md:text-6xl font-serif text-white">Découvrez notre menu</h2><p className="mt-5 text-white/60 max-w-xl">Choisissez vos plats, indiquez votre adresse partout en Guinée et recevez votre commande à l’endroit souhaité.</p></div>
        {loading ? <p className="text-white/60">Chargement du menu...</p> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => <article key={product.id} className="border border-white/10 bg-white/[0.03] overflow-hidden group"><Link to={`/restauration/produit/${product.id}`}><img src={getImageUrl(product.image_url || undefined)} alt={product.nom} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-700" onError={(event) => { event.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} /><div className="p-5"><p className="text-xs uppercase tracking-widest text-red-200 mb-2">{product.categorie}</p><h3 className="text-2xl font-serif text-white">{product.nom}</h3><p className="text-sm text-white/60 mt-2 min-h-10">{product.description}</p></div></Link><div className="px-5 pb-5 flex items-center justify-between"><strong className="text-white">{formatPrice(product.prix_gnf)}</strong><button type="button" aria-label={`Ajouter ${product.nom}`} onClick={() => add(product)} className="inline-flex items-center gap-2 border border-red-300 px-3 py-2 text-xs uppercase tracking-widest text-red-200"><Plus size={15} /> Ajouter</button></div></article>)}
        </div>}
      </div>
    </section>
  );
}
