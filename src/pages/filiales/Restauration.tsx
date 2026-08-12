import { useEffect, useRef, useState } from 'react';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageCircle } from 'lucide-react';
import { mergeContent, getImageUrl, DEFAULT_FALLBACK_IMAGE } from '../../lib/utils';
import { api } from '@/lib/api';

gsap.registerPlugin(ScrollTrigger);

const SLUG = 'restauration';

const fallbackContent: Record<string, string> = {
  hero_title: 'MACOF Restauration',
  hero_subtitle: "Domaine d'Excellence 02",
  hero_desc: "L'art culinaire porté à son paroxysme. Service traiteur, restauration collective et l'excellence SEBA International.",
  hero_bg: '/plaquette-resto.jpeg',
  vision_title: 'Notre Philosophie',
  vision_text_1: "MACOF Restauration s'impose comme une référence incontournable de la gastronomie et du service traiteur en Guinée. À travers notre marque phare SEBA International, nous offrons une expérience culinaire raffinée et mémorable.",
  vision_text_2: "Nos chefs élaborent des cartes qui allient les saveurs locales authentiques aux standards de la haute gastronomie internationale, garantissant une prestation sur-mesure pour chaque occasion.",
  stat_1_value: '5K+',
  stat_1_label: 'Repas/Jour',
  stat_2_value: '1er',
  stat_2_label: 'Traiteur B2B',
  contact_email: 'restauration@macofholding.com',
  contact_phone: '+224 621 00 00 00',
};

const fallbackServices = [
  { title: "SEBA International", desc: "Notre fleuron gastronomique. Restauration de luxe, salons VIP et expériences culinaires exclusives.", icon: "" },
  { title: "Traiteur Événementiel", desc: "Buffets, dîners de gala, cocktails d'entreprise et mariages. Une prestation clé en main.", icon: "" },
  { title: "Restauration Collective", desc: "Gestion de cantines d'entreprises, bases-vie minières et institutions avec rigueur et constance.", icon: "" },
];

export default function Restauration() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<Record<string, string> | null>(null);
  const [filialeData, setFilialeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ nom_complet: '', email: '', telephone: '', objet: '', message: '' });
  const [reference, setReference] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  // Fetch page content and filiale data
  useEffect(() => {
    Promise.all([
      api.get(`/pages/${SLUG}`).catch(() => null),
      api.get(`/filiales/${SLUG}`).catch(() => null)
    ]).then(([pagesRes, filialesRes]) => {
      if (pagesRes?.data?.success) setContent(mergeContent(fallbackContent, pagesRes.data.data));
      else setContent(fallbackContent);
      if (filialesRes?.data?.success) setFilialeData(filialesRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  // Polling every 30s
  useEffect(() => {
    const poll = setInterval(() => {
      Promise.all([
        api.get(`/pages/${SLUG}`).catch(() => null),
        api.get(`/filiales/${SLUG}`).catch(() => null)
      ]).then(([pagesRes, filialesRes]) => {
        if (pagesRes?.data?.success) setContent(mergeContent(fallbackContent, pagesRes.data.data));
        if (filialesRes?.data?.success) setFilialeData(filialesRes.data.data);
      });
    }, 30000);
    return () => clearInterval(poll);
  }, []);


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      const response = await api.post('/demandes', { ...formData, filiale: 'MACOF Restauration', type_demande: 'devis' });
      if (response.data.success) {
        setReference(response.data.data?.reference || '');
        setWhatsappUrl(response.data.data?.whatsapp_url || '');
      }
      setFormStatus('success');
      setFormData({ nom_complet: '', email: '', telephone: '', objet: '', message: '' });
    } catch (err) {
      console.error('Erreur formulaire:', err);
      setFormStatus('error');
    }
  };

  // Force fallbackServices to display the rich text if DB items lack descriptions
  let services = fallbackServices;
  if (content?.services) {
    try {
      const parsed = JSON.parse(content.services);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].desc) {
        services = parsed;
      }
    } catch(e) {}
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".header-img", {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: ".header-section",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
      gsap.utils.toArray(".reveal-up").forEach((el: any) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <AnimatedPage className="bg-background">
      <div ref={containerRef}>
        {/* Header Filiale */}
        <section className="header-section relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-blue-900/40 to-background z-10" />
            <img
              src={getImageUrl(content?.hero_bg || fallbackContent.hero_bg)}
              alt="Restaurant gastronomique de luxe"
              className="header-img w-full h-[120%] object-cover -top-[10%] absolute opacity-80"
              onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
            />
          </div>
          <div className="relative z-20 text-center px-4 max-w-5xl mt-20">
            <p className="text-white text-xs uppercase tracking-[0.4em] font-sans mb-6 reveal-up">{content?.hero_subtitle || fallbackContent.hero_subtitle}</p>
            <h1 className="text-7xl md:text-9xl font-serif text-white mb-8 font-light leading-none reveal-up">
              {content?.hero_title || fallbackContent.hero_title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-light font-sans max-w-3xl mx-auto leading-relaxed reveal-up">
              {content?.hero_desc || fallbackContent.hero_desc}
            </p>
            <div className="mt-12 reveal-up">
              <Button variant="luxury" size="lg" className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white hover:text-black transition-all duration-500 text-sm tracking-widest uppercase">
                Explorer nos Menus
              </Button>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
             <div className="w-[1px] h-16 bg-gradient-to-b from-white/50 to-transparent"></div>
          </div>
        </section>

        {/* Philosophie & SEBA International */}
        <section className="content-section py-32 bg-background relative border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="order-2 lg:order-1 relative reveal-up">
                <div className="aspect-[4/5] overflow-hidden">
                  <img 
                    src={getImageUrl("https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop")}
                    alt="Plat gastronomique" 
                    className="w-full h-full object-cover filter grayscale-[10%]"
                    onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                  />
                </div>
                <div className="absolute -bottom-10 -right-10 bg-card p-8 border border-white/5 max-w-xs hidden md:block">
                  <p className="text-sm font-sans text-foreground leading-relaxed">
                    "L'excellence de la table au service de vos événements les plus prestigieux."
                  </p>
                </div>
              </div>

              <div className="order-1 lg:order-2 reveal-up">
                <h2 className="text-sm font-sans tracking-[0.3em] text-red-200 uppercase mb-6">{content?.vision_title || fallbackContent.vision_title}</h2>
                <h3 className="text-4xl md:text-5xl font-serif text-white mb-8 leading-tight">Éveiller <br/><span className="italic text-blue-200">les Sens.</span></h3>
                <div className="space-y-6 text-white font-light leading-relaxed font-sans text-lg">
                  <p>
                    {content?.vision_text_1 || fallbackContent.vision_text_1}
                  </p>
                  <p>
                    {content?.vision_text_2 || fallbackContent.vision_text_2}
                  </p>
                </div>

                <div className="mt-16 grid grid-cols-2 gap-12 border-t border-white/10 pt-12">
                  <div>
                    <h4 className="text-5xl font-serif text-white mb-2">{content?.stat_1_value || fallbackContent.stat_1_value}</h4>
                    <p className="text-xs text-blue-200 uppercase tracking-widest font-sans">{content?.stat_1_label || fallbackContent.stat_1_label}</p>
                  </div>
                  <div>
                    <h4 className="text-5xl font-serif text-white mb-2">{content?.stat_2_value || fallbackContent.stat_2_value}</h4>
                    <p className="text-xs text-blue-200 uppercase tracking-widest font-sans">{content?.stat_2_label || fallbackContent.stat_2_label}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* L'Expérience Gastronomique (Nouveau contenu) */}
        <section className="py-32 bg-background border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-20 reveal-up">
              <h2 className="text-sm font-sans tracking-[0.3em] text-red-200 uppercase mb-4">Notre Signature</h2>
              <h3 className="text-4xl font-serif text-white">L'Engagement Qualité MACOF</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { n: "01", t: "Ingrédients d'Exception", d: "Une sélection rigoureuse de produits locaux de saison et d'ingrédients nobles importés pour garantir une fraîcheur et des saveurs incomparables." },
                { n: "02", t: "Savoir-Faire Artisanal", d: "Nos chefs maîtrisent aussi bien les techniques traditionnelles africaines que la haute gastronomie française, créant ainsi une fusion parfaite." },
                { n: "03", t: "Service Sur-Mesure", d: "Chaque événement est orchestré avec une précision d'orfèvre : décoration, arts de la table, et un personnel de salle formé aux standards internationaux." }
              ].map((step, i) => (
                <div key={i} className="relative p-10 border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-primary/50 transition-all duration-500 reveal-up group text-center md:text-left">
                  <span className="absolute -top-6 right-6 md:-left-6 text-7xl font-serif text-white/5 group-hover:text-primary/20 transition-colors duration-500">{step.n}</span>
                  <h4 className="text-2xl font-serif text-white mb-4 relative z-10">{step.t}</h4>
                  <p className="text-white/60 font-light leading-relaxed relative z-10">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nos Domaines d'Intervention */}
        <section className="py-32 bg-secondary border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center reveal-up">
             <h2 className="text-sm font-sans tracking-[0.3em] text-red-200 uppercase mb-6">Expertise Culinaire</h2>
             <h3 className="text-4xl md:text-5xl font-serif text-white mb-20">Nos Solutions</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {services.map((serv, i) => (
                 <div key={i} className="p-10 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left group">
                   <h3 className="text-2xl font-serif text-white mb-4 group-hover:text-primary transition-colors">{serv.title}</h3>
                   <p className="text-blue-100 font-light leading-relaxed">{serv.desc}</p>
                 </div>
               ))}
             </div>
          </div>
        </section>

        {/* Nos Menus & HSE */}
        <section className="py-32 bg-background relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div className="reveal-up">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-serif text-white">Aperçu de nos menus</h2>
                  <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-black transition-colors">
                    <span className="mr-2">📄</span> Télécharger PDF
                  </Button>
                </div>
                <div className="space-y-4">
                  {[
                    { nom: "Boulangerie & Pâtisserie", desc: "Croissants purs beurre, pains artisanaux, et entremets créatifs.", prix: "Sur devis" },
                    { nom: "Plats Chauds & Traiteur", desc: "Dégustation en 5 services, fusion terre-mer et spécialités africaines.", prix: "Sur devis" },
                    { nom: "Boissons & Cocktails", desc: "Jus pressés à froid, sélection de vins et cocktails sans alcool premium.", prix: "Sur devis" }
                  ].map((menu, i) => (
                    <div key={i} className="p-6 border border-white/10 bg-white/[0.02] flex justify-between items-center group cursor-pointer hover:bg-white/[0.05]">
                      <div>
                        <h4 className="text-lg font-serif text-white mb-1 group-hover:text-primary transition-colors">{menu.nom}</h4>
                        <p className="text-sm font-light text-blue-200">{menu.desc}</p>
                      </div>
                      <div className="text-right whitespace-nowrap pl-4">
                        <span className="text-sm font-serif text-white">{menu.prix}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="reveal-up bg-red-900/10 p-10 border border-red-500/20">
                <h2 className="text-3xl font-serif text-white mb-8">Sécurité Alimentaire & HSE</h2>
                <p className="text-white font-light leading-relaxed mb-8">
                  La santé de nos convives est notre priorité absolue. Nos protocoles d'hygiène surpassent les standards locaux pour s'aligner sur les normes internationales (HACCP).
                </p>
                <ul className="space-y-4 text-white font-light">
                  <li className="flex gap-4"><span className="text-red-400">✓</span> Traçabilité complète des denrées (du producteur à l'assiette).</li>
                  <li className="flex gap-4"><span className="text-red-400">✓</span> Contrôles sanitaires rigoureux et réguliers.</li>
                  <li className="flex gap-4"><span className="text-red-400">✓</span> Formation continue de nos équipes aux normes HSE.</li>
                  <li className="flex gap-4"><span className="text-red-400">✓</span> Gestion stricte de la chaîne du froid.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Galerie */}
        <section className="py-32 bg-card border-t border-white/5">
          <div className="max-w-[100rem] mx-auto px-6 lg:px-12 text-center reveal-up">
            <h2 className="text-sm font-sans tracking-[0.3em] text-red-200 uppercase mb-6">Aperçu</h2>
            <h3 className="text-4xl md:text-5xl font-serif text-white mb-16">Galerie Réalisations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <img src={getImageUrl("https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1000&auto=format&fit=crop")} alt="Restaurant 1" className="w-full h-80 object-cover hover:opacity-80 transition-opacity" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
              <img src={getImageUrl("https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000&auto=format&fit=crop")} alt="Restaurant 2" className="w-full h-80 object-cover hover:opacity-80 transition-opacity" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
              <img src={getImageUrl("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop")} alt="Restaurant 3" className="w-full h-80 object-cover hover:opacity-80 transition-opacity" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
            </div>
          </div>
        </section>

        {/* Formulaire Spécifique */}
        <section className="py-32 bg-background relative overflow-hidden">
          <div className="absolute -left-1/4 top-1/2 -translate-y-1/2 w-1/2 h-[800px] bg-red-900/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start reveal-up">
              <div>
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Organisons votre <br/>Événement.</h2>
                <p className="text-white font-light max-w-md mb-12">
                  Sollicitez SEBA International pour une prestation sur-mesure. Décrivez-nous vos besoins, nous créerons un menu d'exception.
                </p>
                <div className="bg-white/5 p-8 border border-white/10">
                  <h4 className="text-xl font-serif text-white mb-4">Contact Direct Restauration</h4>
                  <p className="text-blue-200 font-light text-sm mb-2">Email: {filialeData?.email || content?.contact_email || fallbackContent.contact_email}</p>
                  <p className="text-blue-200 font-light text-sm">Téléphone: {filialeData?.telephone || content?.contact_phone || fallbackContent.contact_phone}</p>
                </div>
              </div>
              
              <div>
                {formStatus === 'success' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-800 font-medium">Votre demande a été envoyée !</p>
                    <p className="text-green-600 text-sm">Référence: {reference}</p>
                    <p className="text-green-700 text-sm mt-1">Notre équipe traiteur vous recontactera très rapidement pour affiner votre besoin.</p>
                    {whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        <MessageCircle size={18} />
                        Envoyer via WhatsApp
                      </a>
                    )}
                    <div className="mt-4">
                      <Button variant="outline" className="text-green-700 border-green-300 hover:bg-green-100" onClick={() => { setFormStatus('idle'); setReference(''); setWhatsappUrl(''); }}>Nouvelle demande</Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="bg-white p-8 border border-white/10 shadow-2xl">
                    <h3 className="text-2xl font-serif text-black mb-8">Demande de Devis Traiteur</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Nom / Entreprise</label>
                        <Input required placeholder="Votre nom" className="border-gray-200" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Téléphone</label>
                        <Input required placeholder="+224 ..." className="border-gray-200" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Type d'Événement</label>
                        <select className="flex h-10 w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:border-primary">
                          <option>Dîner de Gala</option>
                          <option>Cocktail d'Entreprise</option>
                          <option>Mariage / Réception</option>
                          <option>Restauration Collective (Contrat)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Date Prévue</label>
                        <Input type="date" required className="border-gray-200" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Lieu de l'événement</label>
                        <Input placeholder="Ex: Conakry, Hôtel X..." className="border-gray-200" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Nombre de convives</label>
                        <Input type="number" min="1" placeholder="Ex: 150" className="border-gray-200" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Budget Estimé par personne (GNF)</label>
                        <Input placeholder="Ex: 500,000 GNF" className="border-gray-200" />
                      </div>
                    </div>

                    <div className="space-y-2 mb-8">
                      <label className="text-xs uppercase tracking-widest text-gray-500">Détails de la demande</label>
                      <textarea
                        required
                        rows={4}
                        className="flex w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:border-primary"
                        placeholder="Allergies, type de cuisine, besoins spécifiques..."
                      />
                    </div>
                    <Button variant="luxury" size="lg" className="w-full bg-primary text-white hover:bg-primary/90" disabled={formStatus === 'loading'}>
                      {formStatus === 'loading' ? 'Envoi en cours...' : 'Envoyer la demande'}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
    </AnimatedPage>
  );
}
