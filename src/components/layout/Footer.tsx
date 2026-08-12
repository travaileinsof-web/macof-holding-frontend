import { Link } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE } from '../../lib/utils';

export function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="bg-[#050b14] border-t border-white/10 relative overflow-hidden">
      {/* Background decorative element */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0A4287]/50 to-transparent" />
      <div className="absolute bottom-0 right-0 w-1/3 h-full bg-[#0A4287]/5 blur-[120px] pointer-events-none" />

      {/* Main Footer Content */}
      <div className="max-w-[100rem] mx-auto px-6 lg:px-12 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          
          {/* Column 1: Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <img src={getImageUrl("/logo-macof.png")} alt="MACOF HOLDING" className="h-14 w-auto object-contain" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
            </Link>
            <p className="text-white/60 font-light text-sm leading-relaxed mb-8 max-w-sm">
              Construire, développer et transformer durablement des secteurs stratégiques de l'économie à travers six filiales spécialisées.
            </p>
            <div className="space-y-3 text-sm font-sans">
              {settings.contact_phone && (
                <a href={`tel:${settings.contact_phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <span className="w-8 h-8 rounded-full border border-[#0A4287]/50 flex items-center justify-center text-[#0A4287] text-xs">📞</span>
                  {settings.contact_phone}
                </a>
              )}
              {settings.contact_email && (
                <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <span className="w-8 h-8 rounded-full border border-[#0A4287]/50 flex items-center justify-center text-[#0A4287] text-xs">✉</span>
                  {settings.contact_email}
                </a>
              )}
              {settings.contact_address && (
                <div className="flex items-start gap-3 text-white/70">
                  <span className="w-8 h-8 rounded-full border border-[#0A4287]/50 flex items-center justify-center text-[#0A4287] text-xs flex-shrink-0">📍</span>
                  <span>{settings.contact_address}</span>
                </div>
              )}
              
              <div className="flex gap-4 mt-6 pt-4">
                {settings.social_linkedin && (
                  <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#0A4287] transition-colors">
                    LinkedIn
                  </a>
                )}
                {settings.social_facebook && (
                  <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#0A4287] transition-colors">
                    Facebook
                  </a>
                )}
                {settings.social_twitter && (
                  <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#0A4287] transition-colors">
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Nos Filiales */}
          <div>
            <h4 className="text-xs font-sans tracking-[0.3em] text-[#b8142b] uppercase mb-8">Nos Filiales</h4>
            <ul className="space-y-3">
              <li><Link to="/immobilier" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />MACOF Immobilier</Link></li>
              <li><Link to="/restauration" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />MACOF Restauration</Link></li>
              <li><Link to="/print" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />MACOF Print & Com</Link></li>
              <li><Link to="/mining" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />MACOF Mining</Link></li>
              <li><Link to="/transit" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />MACOF Transit</Link></li>
              <li><Link to="/fishing" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />MACOF Fishing</Link></li>
            </ul>
          </div>

          {/* Column 3: Navigation */}
          <div>
            <h4 className="text-xs font-sans tracking-[0.3em] text-[#b8142b] uppercase mb-8">Navigation</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white/30 rounded-full" />Accueil</Link></li>
              <li><Link to="/about" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white/30 rounded-full" />À propos</Link></li>
              <li><Link to="/domaines" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white/30 rounded-full" />Domaines d'activité</Link></li>
              <li><Link to="/galerie" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white/30 rounded-full" />Galerie</Link></li>
              <li><Link to="/catalogues" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white/30 rounded-full" />Documents</Link></li>
              <li><Link to="/contact" className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white/30 rounded-full" />Contact</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter / CTA */}
          <div>
            <h4 className="text-xs font-sans tracking-[0.3em] text-[#b8142b] uppercase mb-8">Restons en Contact</h4>
            <p className="text-white/60 font-light text-sm leading-relaxed mb-6">
              Vous avez un projet ou une question ? N'hésitez pas à nous contacter directement.
            </p>
            <Link 
              to="/contact" 
              className="inline-flex items-center gap-3 px-6 py-3 bg-[#0A4287] text-white text-sm tracking-widest uppercase font-sans hover:bg-[#0A4287]/80 transition-colors"
            >
              Nous contacter
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <div className="mt-8">
              <p className="text-white/40 text-xs font-light">
                Lun - Ven : 08h00 - 18h00<br />
                Sam : 09h00 - 13h00
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs font-light tracking-wider">
            © {new Date().getFullYear()} MACOF Holding — L'art de façonner l'avenir. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link to="/contact" className="text-white/40 text-xs font-light hover:text-white/70 transition-colors">Mentions légales</Link>
            <Link to="/contact" className="text-white/40 text-xs font-light hover:text-white/70 transition-colors">Politique de confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
