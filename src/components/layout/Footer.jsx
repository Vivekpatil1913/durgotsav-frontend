import { Instagram, Mail, MapPin, Phone, Youtube, Facebook, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { Divider } from "../ui/Ornament.jsx";
import "./footer.css";

const SOCIAL_PLATFORMS = [
  { key: "instagram", Icon: Instagram, label: "Instagram" },
  { key: "facebook",  Icon: Facebook,  label: "Facebook"  },
  { key: "youtube",   Icon: Youtube,   label: "YouTube"   },
  { key: "twitter",   Icon: Twitter,   label: "X (Twitter)" },
];

export function Footer() {
  const { settings } = useSite();
  const t = useT();
  const { lang } = useLang();
  const contact = settings.contact ?? {};
  const social = settings.social ?? {};

  const LINKS = [
    [t("Quick Links", "त्वरित दुवे"), [
      ["/about",              t("Campaign Objectives", "मोहिमेचे उद्दिष्ट")],
      ["/participate",        t("How to Participate", "सहभाग कसा घ्यावा")],
      ["/participate#register", t("Register", "नोंदणी")],
      ["/gallery",            t("Gallery", "गॅलरी")],
      ["/faq",                t("FAQ", "प्रश्नोत्तरे")],
      ["/contact",            t("Contact & Help", "संपर्क व मदत")],
    ]],
  ];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <div className="site-footer__brand-header">
              <img src="/brand/emblem-white.webp" alt={t("Government of Maharashtra", "महाराष्ट्र शासन")} loading="lazy" />
              <img src="/brand/amrut-white.webp" alt={t("AMRUT", "अमृत")} loading="lazy" />
              <img src="/brand/durgotsav-logo-320.webp" alt={t("Amrut Durgotsav 2026 Logo", "अमृत दुर्गोत्सव २०२६ बोधचिन्ह")} loading="lazy" />
              <span className="site-footer__brand-title">{t("Durgotsav 2026", "दुर्गोत्सव २०२६")}</span>
            </div>
            <p className="site-footer__tagline">{t("Let's Build a Fort!", "चला, दुर्ग बनवूया!")}</p>
            <p className="site-footer__about">
              {t(
                "Maharashtra Research, Upliftment and Training Academy (AMRUT) — an autonomous institution of the Government of Maharashtra — is the organiser of this people's festival.",
                "महाराष्ट्र संशोधन, उन्नती व प्रशिक्षण प्रबोधिनी (अमृत) — महाराष्ट्र शासनाची स्वायत्त संस्था — यांचा लोकोत्सव."
              )}
            </p>
            <div className="cluster">
              {SOCIAL_PLATFORMS.map(({ key, Icon, label }) => (
                <a key={key} href={social[key] || "#"} target={social[key] ? "_blank" : "_self"} rel="noopener noreferrer" className="social-link" aria-label={label}>
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {LINKS.map(([title, links]) => (
            <nav key={title} aria-label={title} className="site-footer__col">
              <h2>{title}</h2>
              <ul>
                {links.map(([to, label]) => (
                  <li key={to}><Link to={to}>{label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="site-footer__col site-footer__contact">
            <h2>{t("Contact", "संपर्क")}</h2>
            <ul>
              {contact.email && <li><Mail size={16} aria-hidden="true" /><a href={`mailto:${contact.email}`}>{contact.email}</a></li>}
              {contact.phone && <li><Phone size={16} aria-hidden="true" /><a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a></li>}
              {(lang === "mr" ? contact.address : (contact.address_en || contact.address)) && (
                <li><MapPin size={16} aria-hidden="true" /><span>{lang === "mr" ? contact.address : (contact.address_en || contact.address)}</span></li>
              )}
            </ul>
          </div>
        </div>

        <Divider className="site-footer__divider" />
        {(lang === "mr" ? settings.initiative?.gr_reference : (settings.initiative?.gr_reference_en || settings.initiative?.gr_reference)) && (
          <p className="site-footer__gr">{lang === "mr" ? settings.initiative.gr_reference : (settings.initiative.gr_reference_en || settings.initiative.gr_reference)}</p>
        )}

        <div className="site-footer__bottom">
          <p>{t("© 2026 AMRUT, Maharashtra. All rights reserved.", "© २०२६ अमृत, महाराष्ट्र. सर्व हक्क राखीव.")}</p>
          <nav aria-label={t("Legal", "कायदेशीर")} className="cluster">
            <Link to="/privacy">{t("Privacy Policy", "गोपनीयता धोरण")}</Link>
            <Link to="/terms">{t("Terms & Conditions", "अटी व शर्ती")}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
