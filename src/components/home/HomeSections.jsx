import { motion, useScroll, useTransform } from "framer-motion";
import { Award, Camera, ChevronLeft, ChevronRight, Hammer, Megaphone, ScrollText, ShieldCheck, Upload, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Autoplay, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { assetUrl, enDate, mrDate } from "../../lib/format.js";
import { Counter } from "../ui/Counter.jsx";
import { Img } from "../ui/Img.jsx";
import { Lightbox } from "../ui/Lightbox.jsx";
import { Divider } from "../ui/Ornament.jsx";
import { Reveal, staggerChild, staggerParent } from "../ui/Reveal.jsx";
import "./home.css";

// ---------------------------------------------------------------- story
export function Story() {
  const { settings } = useSite();
  const t = useT();

  const pillars = [
    [ShieldCheck,
      t("UNESCO Recognition", "युनेस्को मान्यता"),
      t(
        `"${settings.initiative?.unesco_title || "Maratha Military Landscapes of India"}" — Shivaji's 12 forts were granted World Heritage Site status in 2025.`,
        `"${settings.initiative?.unesco_title || "Maratha Military Landscapes of India"}" — शिवछत्रपतींच्या १२ दुर्गांना २०२५ मध्ये जागतिक वारसा स्थळांचा दर्जा.`
      )],
    [Hammer,
      t("Heritage Preservation", "परंपरा संवर्धन"),
      t(
        "Encouraging the folk tradition of building fort replicas during Diwali holidays and raising public awareness about fort conservation.",
        "दिवाळी सुट्ट्यांमध्ये गड-दुर्गांच्या प्रतिकृती तयार करण्याच्या लोकपरंपरेस प्रोत्साहन आणि दुर्गसंवर्धनाविषयी जनजागृती."
      )],
    [Users,
      t("Public Participation", "लोकसहभाग"),
      t(
        "Anyone in the world — individual, family, housing society, organization, school or college — can participate.",
        "जगातील कोणतीही व्यक्ती, कुटुंब, गृहसंकुल, संस्था, शाळा किंवा महाविद्यालय सहभागी होऊ शकते."
      )],
  ];

  return (
    <section id="story" className="section story" aria-labelledby="story-title">
      <div className="container story__content split">
        <Reveal className="stack story__text">
          <div className="story__eyebrow-row" aria-hidden="true">
            <span className="story__eyebrow-line" />
            <span className="story__eyebrow-gem">❖</span>
            <span className="story__eyebrow-label">
              {t("The ", "दुर्गोत्सवाची ")}<span className="story__eyebrow-accent">{t("Concept", "संकल्पना")}</span>{t(" of Durgotsav", "")}
            </span>
            <span className="story__eyebrow-line" />
          </div>

          <h2 id="story-title" className="story__title">
            <span className="story__title-accent">{t("Diwali's", "दिवाळीतला")}</span>{" "}
            {t("Clay Fort — Maharashtra's Unique Folk Tradition", "मातीचा किल्ला — महाराष्ट्राची अनोखी लोकपरंपरा")}
          </h2>
          <Divider className="story__divider" />
          <p className="story__lead">
            {t(
              "During Diwali, the tradition of building small and large replicas of forts collectively — according to the available space — is deeply connected to Maharashtra's cultural and historical heritage.",
              "दीपावलीच्या कालावधीत उपलब्ध जागेनुसार लहान-मोठ्यांनी एकत्रितपणे दुर्गांच्या प्रतिकृती तयार करण्याची प्रथा ही महाराष्ट्राच्या सांस्कृतिक व ऐतिहासिक परंपरेशी निगडित आहे."
            )}
          </p>
          <p className="muted">
            {t(
              "Children, youth, families and various sections of society together create replicas of Chhatrapati Shivaji Maharaj's forts — spreading knowledge of their history and bravery to the new generation. This is the core concept behind Durgotsav.",
              "बालगोपाळ, युवक, कुटुंबे आणि समाजातील विविध घटकांच्या सहभागातून छत्रपती शिवाजी महाराजांच्या गड-दुर्गांच्या प्रतिकृती तयार करून त्यांच्या इतिहासाची व शौर्यपरंपरेची ओळख नव्या पिढीपर्यंत पोहोचविणे, ही दुर्गोत्सवामागील प्रमुख संकल्पना आहे."
            )}
          </p>
          <Link to="/about" className="link-arrow story__cta">{t("Read campaign objectives →", "मोहिमेचे उद्दिष्ट वाचा →")}</Link>

          <div className="story__bottom-deco" aria-hidden="true">
            <svg className="story__fort-sketch" viewBox="0 0 72 96" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="36" y1="4" x2="36" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M36 6 L54 11 L36 17Z" fill="currentColor" opacity="0.55"/>
              <rect x="22" y="22" width="28" height="22" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="22" y="16" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="33" y="16" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="44" y="16" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M30 30 L30 38 Q36 34 42 38 L42 30" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              <rect x="8" y="44" width="56" height="52" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="8" y="38" width="9" height="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="22" y="38" width="9" height="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="36" y="38" width="9" height="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="50" y="38" width="9" height="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="12" y="54" width="12" height="16" rx="6" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              <rect x="48" y="54" width="12" height="16" rx="6" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              <path d="M27 96 L27 74 Q36 66 45 74 L45 96" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M29 74 Q36 68 43 74" stroke="currentColor" strokeWidth="1" fill="none"/>
            </svg>
            <p className="story__region">{t("Jai Maharashtra", "जय महाराष्ट्र")}</p>
          </div>
        </Reveal>

        <motion.ul className="pillars" variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-10%" }}>
          {pillars.map(([Icon, title, text]) => (
            <motion.li key={title} variants={staggerChild} className="pillar">
              <span className="pillar__icon"><Icon aria-hidden="true" /></span>
              <div className="pillar__body">
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- mission
export function Mission() {
  const { settings } = useSite();
  const t = useT();

  return (
    <section id="mission" className="section mission" aria-labelledby="mission-title">
      <div className="mission__bg-watermark" aria-hidden="true">
        <svg viewBox="0 0 480 360" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M240 10v50M240 10c28 6 46-8 70 8-28 10-46-6-70 8" />
          <path d="M200 68h80v50h-12v18h-56v-18h-12z" />
          <path d="M200 60h14v10h-14zM225 60h14v10h-14zM252 60h14v10h-14zM278 60h14v10h-14z" />
          <path d="M174 118h132v20h-12v24h-108v-24h-12z" />
          <path d="M174 110h20v10h-20zM206 110h20v10h-20zM238 110v-6h6v6M262 110h20v10h-20zM294 110h20v10h-20z" />
          <path d="M120 162h240v158H120z" />
          <path d="M120 150h28v14h-28zM164 150h28v14h-28zM208 150h28v14h-28zM252 150h28v14h-28zM296 150h28v14h-28zM340 150h20v14h-20z" />
          <path d="M136 200h48v58h-12v-42h-24v42h-12zM296 200h48v58h-12v-42h-24v42h-12z" />
          <path d="M198 320V240c0-22 14-36 42-36s42 14 42 36v80" />
          <path d="M50 320c40-20 80-40 120-40h160c40 0 80 18 100 40" />
        </svg>
      </div>

      <div className="container split">
        <Reveal className="stack mission__content">
          <div className="story__eyebrow-row">
            <span className="story__eyebrow-line" />
            <span className="story__eyebrow-gem">❖</span>
            <span className="story__eyebrow-label mission__eyebrow-label">
              {t("Campaign ", "मोहिमेचे ")}<span className="story__eyebrow-accent">{t("Objectives", "उद्दिष्ट")}</span>
            </span>
            <span className="story__eyebrow-line" />
          </div>

          <h2 id="mission-title" className="mission__title">
            <span className="mission__title-accent">{t("Durgotsav's", "दुर्गोत्सवाची")}</span>{" "}
            {t("Need & Concept", "आवश्यकता व संकल्पना")}
          </h2>

          <Divider className="mission__divider" />

          <p className="mission__lead">
            {t(
              "The main purpose of this initiative is to encourage the folk tradition of building fort replicas during Diwali holidays and to raise public awareness about fort conservation.",
              "दिवाळी सुट्ट्यांमध्ये गड-दुर्गांच्या प्रतिकृती तयार करण्याच्या लोकपरंपरेस प्रोत्साहन देणे आणि दुर्गसंवर्धनाविषयी जनजागृती करणे हा या उपक्रमाचा मुख्य हेतू आहे."
            )}
          </p>

          <blockquote className="mission__quote">
            {t(
              <>Such a tradition <strong>cannot be found anywhere else in the world.</strong></>,
              <>अशी परंपरा जगात दुसरीकडे{" "}<strong>कुठेही पाहायला मिळत नाही.</strong></>
            )}
          </blockquote>

          <div className="mission__facts">
            <div className="mission__fact">
              <span className="mission__fact-icon"><ShieldCheck aria-hidden="true" /></span>
              <div>
                <strong>{t("UNESCO World Heritage (2025)", "युनेस्को जागतिक वारसा (२०२५)")}</strong>
                <p>
                  "{settings.initiative?.unesco_title || "Maratha Military Landscapes of India"}" —{" "}
                  {t(
                    "Shivaji's 12 forts were granted World Heritage Site status.",
                    "शिवछत्रपतींच्या १२ दुर्गांना जागतिक वारसा स्थळांचा दर्जा."
                  )}
                </p>
              </div>
            </div>
            {settings.initiative?.gr_reference && (
              <div className="mission__fact">
                <span className="mission__fact-icon"><ScrollText aria-hidden="true" /></span>
                <div>
                  <strong>{t("Government Resolution", "शासन निर्णय")}</strong>
                  <p>{settings.initiative.gr_reference}</p>
                </div>
              </div>
            )}
          </div>

          <Link to="/about" className="link-arrow">{t("Read full campaign objectives →", "मोहिमेचे संपूर्ण उद्दिष्ट →")}</Link>
        </Reveal>

        <Reveal className="mission__media" delay={0.12}>
          <div className="img-frame mission__img">
            <Img
              src="/images/rajgad-900.webp"
              srcSet="/images/rajgad.webp 1200w, /images/rajgad-900.webp 900w"
              sizes="(min-width: 960px) 45vw, 100vw"
              alt={t("Rajgad — Capital of Chhatrapati Shivaji's Swarajya", "राजगड — शिवछत्रपतींच्या स्वराज्याची राजधानी")}
              width="900"
              height="599"
            />
          </div>
          <div className="mission__logos">
            <div className="mission__logo-item">
              <img src="/brand/emblem-white.webp" alt={t("Government of Maharashtra", "महाराष्ट्र शासन")} loading="lazy" height="52" />
              <span>{t("Government of Maharashtra", "महाराष्ट्र शासन")}</span>
            </div>
            <span className="mission__logo-sep" aria-hidden="true" />
            <div className="mission__logo-item">
              <img src="/brand/amrut-white.webp" alt="AMRUT — Academy of Maharashtra Research, Upliftment and Training" loading="lazy" height="36" />
              <span>{t("AMRUT Maharashtra", "अमृत महाराष्ट्र")}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- numbers
export function StatsBand({ stats }) {
  const t = useT();
  const live = stats && stats.participants > 0;
  const items = live
    ? [
        [stats.participants, t("Durgotsav Registrations", "दुर्गवीरांची नोंदणी")],
        [stats.verified,     t("Certificates Issued", "अभिनंदन पत्रे प्रदान")],
        [stats.districts,    t("Districts Participating", "जिल्ह्यांतून सहभाग")],
        [stats.forts,        t("UNESCO World Heritage Forts", "युनेस्को जागतिक वारसा दुर्ग")],
      ]
    : [
        [12, t("UNESCO World Heritage Forts", "युनेस्को जागतिक वारसा दुर्ग")],
        [36, t("Districts of Maharashtra", "महाराष्ट्रातील जिल्हे")],
        [5,  t("Steps to Participate", "सोप्या टप्प्यांत सहभाग")],
        [24, t("Hours to Certificate (after verification)", "तासांत अभिनंदन पत्र (पडताळणीनंतर, शक्यतो)")],
      ];
  return (
    <section className="stats-band" aria-label={t("Durgotsav Statistics", "दुर्गोत्सव आकडेवारी")}>
      <div className="container stats-band__grid">
        {items.map(([value, label], i) => (
          <Reveal key={label} delay={i * 0.08} className="stat">
            <strong><Counter value={value} /></strong>
            <span>{label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- how to take part
export function Journey() {
  const t = useT();
  const { lang } = useLang();

  const STEPS = [
    [Users,  t("Come Together", "एकत्र या"),
      t("Choose a safe spot in your courtyard, housing complex, garden or balcony with your family, children and friends.", "कुटुंब, बालगोपाळ व मित्रपरिवारासोबत अंगणात, गृहसंकुलात, बागेत किंवा बाल्कनीत सुरक्षित जागा निवडा.")],
    [Hammer, t("Build a Fort", "दुर्ग उभारा"),
      t("Use eco-friendly materials and your creativity to build a replica of a fort.", "पर्यावरणपूरक साहित्याचा वापर करून आपल्या कल्पकतेने एका दुर्गाची प्रतिकृती तयार करा.")],
    [Camera, t("Take a Photo", "छायाचित्र काढा"),
      t("Take a photo (Selfie/Photograph) where both you and your fort replica are clearly visible.", "आपण व आपली प्रतिकृती स्पष्ट दिसतील असे स्वतःचे छायाचित्र (Selfie/Photograph) काढा.")],
    [Upload, t("Register & Upload", "नोंदणी व अपलोड"),
      t("Fill the registration form on the website and upload your photo. You will receive a registration number.", "संकेतस्थळावर नोंदणी अर्ज भरा आणि छायाचित्र अपलोड करा. आपल्याला नोंदणी क्रमांक मिळेल.")],
    [Award,  t("Get the Certificate", "अभिनंदन पत्र मिळवा"),
      t("After verification, download the digital congratulation letter with the signatures of dignitaries.", "पडताळणी पूर्ण झाल्यावर मान्यवरांच्या स्वाक्षरीचे डिजिटल अभिनंदन पत्र डाउनलोड करा.")],
  ];

  const stepNums = lang === "mr"
    ? ["१", "२", "३", "४", "५"]
    : ["1", "2", "3", "4", "5"];

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="section surface-night-raised journey" aria-labelledby="journey-title" ref={ref}>
      <div className="container split">
        <Reveal className="stack journey__intro">
          <span className="eyebrow">{t("How to Participate", "सहभाग कसा घ्यावा")}</span>
          <h2 id="journey-title" className="sr-only">{t("Five Steps. One Fort. One Proud Moment.", "पाच टप्पे. एक दुर्ग. एक अभिमानाचा क्षण.")}</h2>
          <p className="journey__lead">
            {t(
              "Participation in Durgotsav is completely voluntary and free. Registration can only be done through this official website.",
              "दुर्गोत्सवात सहभागी होणे पूर्णपणे ऐच्छिक आणि विनामूल्य आहे. नोंदणी फक्त या अधिकृत संकेतस्थळावरून करता येते."
            )}
          </p>
          <div className="img-frame journey__art">
            <Img
              src="/images/chala-durg-banavuya-2026.png"
              alt={t("Children building a fort replica — Let's Build a Fort! Amrut Durgotsav 2026", "दुर्गाची प्रतिकृती बनवणारी मुले — चला दुर्ग बनवूयात! अमृत दुर्गोत्सव २०२६")}
              width="1280"
              height="853"
            />
          </div>
          <div className="cluster">
            <Link to="/participate#register" className="btn btn--primary">{t("Register Now", "नोंदणी करा")}</Link>
            <Link to="/rules" className="btn btn--ghost">{t("Full Guidelines", "संपूर्ण संहिता")}</Link>
          </div>
        </Reveal>
        <ol className="steps">
          <motion.span className="steps__line" style={{ scaleY }} aria-hidden="true" />
          {STEPS.map(([Icon, title, text], i) => (
            <Reveal as="li" key={title} delay={i * 0.06} className="step">
              <span className="step__icon"><Icon aria-hidden="true" /></span>
              <div>
                <span className="step__num">{t("Step", "टप्पा")} {stepNums[i]}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- festival banner
export function FestivalBanner() {
  const t = useT();
  return (
    <section className="section surface-parchment festival-banner" aria-label={t("Let's Build a Fort — Amrut Durgotsav 2026", "चला दुर्ग बनवूया — अमृत दुर्गोत्सव २०२६")}>
      <div className="container split">
        <Reveal className="festival-banner__media">
          <div className="img-frame">
            <Img
              src="/images/chala-durg-banavuya-2026.png"
              alt={t("Children building a fort replica — Let's Build a Fort!", "दुर्गाची प्रतिकृती बनवणारी मुले — चला दुर्ग बनवूयात!")}
              width="1366"
              height="768"
            />
          </div>
        </Reveal>

        <Reveal className="festival-banner__card stack" delay={0.12}>
          <svg className="festival-banner__card-icon" viewBox="0 0 48 52" fill="none" aria-hidden="true">
            <line x1="24" y1="2" x2="24" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M24 3 L34 7 L24 11Z" fill="currentColor" opacity="0.7" />
            <rect x="14" y="12" width="20" height="14" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <rect x="14" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <rect x="22" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <rect x="30" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <rect x="4" y="26" width="40" height="26" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <rect x="4" y="22" width="7" height="5" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <rect x="15" y="22" width="7" height="5" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <rect x="27" y="22" width="7" height="5" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <rect x="38" y="22" width="7" height="5" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <path d="M19 52 L19 40 Q24 35 29 40 L29 52" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>

          <div className="festival-banner__rule" />

          <blockquote className="festival-banner__quote">
            {t(
              <>There is no other tradition in the world that pays such tribute to{" "}<strong>the glorious history of a nation.</strong></>,
              <>जगात असी कोणतीही परंपरा नाही जी अशा प्रकारे{" "}<strong>देशाच्या गौरवशाली इतिहासाला श्रद्धांजली वाहते.</strong></>
            )}
          </blockquote>

          <div className="festival-banner__rule" />

          <p className="festival-banner__sub">{t("So let's celebrate this festival!", "तर चला, हा उत्सव साजरा करूया!")}</p>

          <div className="cluster" style={{ justifyContent: "center" }}>
            <Link to="/participate" className="btn btn--primary">{t("Join Durgotsav", "दुर्गोत्सवात सहभागी व्हा")}</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- 2025 world record
export function WorldRecord() {
  const { settings } = useSite();
  const t = useT();
  const wr = settings.world_record;
  if (!wr?.enabled) return null;
  return (
    <section id="world-record" className="section surface-night world-record" aria-labelledby="wr-title">
      <div className="container split">
        <Reveal className="world-record__media">
          <div className="img-frame">
            <Img
              src={wr.image}
              alt={t("Durgotsav 2025 — Guinness World Records certificate acceptance ceremony", "दुर्गोत्सव २०२५ — Guinness World Records प्रमाणपत्र स्वीकृती सोहळा")}
              width="1400"
              height="1093"
            />
          </div>
          <span className="world-record__seal" aria-hidden="true">GUINNESS<br />WORLD<br />RECORDS™<br /><small>2025</small></span>
        </Reveal>
        <Reveal className="stack" delay={0.1}>
          <span className="eyebrow">{wr.eyebrow}</span>
          <h2 id="wr-title" className="world-record__title">{wr.title}</h2>
          <blockquote className="world-record__quote">
            "The largest online photo album of handmade sculptures was achieved by The Academy of Maharashtra Research, Upliftment and Training (AMRUT), The Government of Maharashtra (India), in Pune, Maharashtra, India, on 10 November 2025."
          </blockquote>
          <p className="world-record__body">{wr.body}</p>
          <div className="cluster">
            <Link to="/album" className="btn btn--gold">{t("World Record Photo Album", "विश्वविक्रमी फोटो अल्बम")}</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- dignitaries
function Quote({ text }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const long = text.length > 420;
  return (
    <div>
      <blockquote className={long && !open ? "is-clamped" : undefined}>{text}</blockquote>
      {long && (
        <button type="button" className="voice__more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? t("Show less", "कमी दाखवा") : t("Read more", "अधिक वाचा")}
        </button>
      )}
    </div>
  );
}

function TempleIcon() {
  return (
    <svg viewBox="0 0 32 28" width="30" height="26" aria-hidden="true">
      <path fill="currentColor" d="M16 0l1.2 3.2h-2.4zM14.6 4h2.8l3 6h-8.8zM10.5 11h11l2.5 5h-16zM6 17h20v2H6zM7.5 20h17v6h-5v-4h-7v4h-5zM3 27h26v1H3z" />
    </svg>
  );
}
function Lotus({ size = 22 }) {
  return (
    <svg viewBox="0 0 32 24" width={size} height={(size * 3) / 4} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M16 3c3 3.5 3 9.5 0 14-3-4.5-3-10.5 0-14z" />
      <path d="M16 17c-2.5-4-7-6.5-11-6.5 .5 4.5 5 7 11 6.5zM16 17c2.5-4 7-6.5 11-6.5-.5 4.5-5 7-11 6.5z" />
      <path d="M16 17c-5 0-10-2-13.5-5M16 17c5 0 10-2 13.5-5M10 21h12" />
    </svg>
  );
}
function FortSketch() {
  return (
    <svg className="voice__watermark" viewBox="0 0 160 120" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M96 8v34M96 8c8 2 14-2 22 2-8 3-14-1-22 2" />
      <path d="M70 42h52v8h-4v6h-44v-6h-4zM74 42v-6h6v6M88 42v-6h6v6M102 42v-6h6v6M116 42v-6h6v6" />
      <path d="M74 56v40M118 56v40M88 96V76a8 8 0 0116 0v20" />
      <path d="M40 96V70h34M118 70h28v26M44 70v-6h6v6M58 70v-6h6v6M126 70v-6h6v6M140 70v-6h6v6" />
      <path d="M10 120c20-10 30-24 50-24h60c18 0 28 12 40 24" />
    </svg>
  );
}

export function Voices({ testimonials = [] }) {
  const t = useT();
  const [swiper, setSwiper] = useState(null);
  const [nav, setNav] = useState({ active: 0, snaps: 1 });
  if (!testimonials.length) return null;
  const sync = (s) => setNav({ active: s.snapIndex, snaps: s.snapGrid.length });
  return (
    <section id="voices" className="section voices" aria-labelledby="voices-title">
      <div className="container">
        <Reveal className="voices__head">
          <span className="voices__temple"><TempleIcon /></span>
          <span className="voices__eyebrow">
            <span className="voices__eyebrow-line" aria-hidden="true" />
            {t("Message from Dignitaries", "मान्यवरांचे आवाहन")}
            <span className="voices__eyebrow-line" aria-hidden="true" />
          </span>
          <h2 id="voices-title">
            {t("Tribute to Shivaji's ", "शिवरायांच्या ")}<span className="voices__accent">{t("Forts", "गडदुर्गांना")}</span>{t("", " मानवंदना")}
          </h2>
          <span className="voices__flourish" aria-hidden="true"><span /><Lotus size={20} /><span /></span>
          <p className="voices__lead">
            {t(
              "Thoughts of dignitaries about this unique initiative that is spreading Maharashtra's glorious heritage across the world.",
              "महाराष्ट्राचा गौरवशाली वारसा जगभर पोहोचवणाऱ्या या अनोख्या उपक्रमाविषयी मान्यवरांचे विचार"
            )}
          </p>
        </Reveal>
        <Swiper
          modules={[A11y, Autoplay]}
          spaceBetween={40}
          slidesPerView={1}
          breakpoints={{ 900: { slidesPerView: 2 } }}
          autoplay={{ delay: 9000, pauseOnMouseEnter: true, disableOnInteraction: true }}
          a11y={{ prevSlideMessage: t("Previous", "मागील"), nextSlideMessage: t("Next", "पुढील") }}
          onSwiper={(s) => { setSwiper(s); sync(s); }}
          onSlideChange={sync}
          onBreakpoint={sync}
          className="voices__swiper"
        >
          {testimonials.map((t_item) => (
            <SwiperSlide key={t_item.id}>
              <figure className="voice">
                <span className="voice__mark" aria-hidden="true">"</span>
                <Quote text={t_item.message} />
                <span className="voice__divider" aria-hidden="true"><span /><Lotus /><span /></span>
                <figcaption>
                  {t_item.photo && <img src={assetUrl(t_item.photo)} alt="" width="96" height="96" loading="lazy" />}
                  <span>
                    <strong>{t_item.name}</strong>
                    <small>{t_item.designation}</small>
                  </span>
                </figcaption>
                <FortSketch />
              </figure>
            </SwiperSlide>
          ))}
        </Swiper>
        {nav.snaps > 1 && (
          <div className="voices__nav">
            <button type="button" className="voices__arrow" aria-label={t("Previous", "मागील")} onClick={() => swiper?.slidePrev()} disabled={nav.active === 0}>
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <div className="voices__dots">
              {Array.from({ length: nav.snaps }, (_, i) => (
                <button
                  type="button"
                  key={i}
                  className={i === nav.active ? "is-active" : undefined}
                  aria-label={`${t("Slide", "स्लाइड")} ${i + 1}`}
                  aria-current={i === nav.active || undefined}
                  onClick={() => swiper?.slideTo(i)}
                />
              ))}
            </div>
            <button type="button" className="voices__arrow" aria-label={t("Next", "पुढील")} onClick={() => swiper?.slideNext()} disabled={nav.active === nav.snaps - 1}>
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- cinematic carousel engine
const GP_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const GP_DUR  = 2800;
const GP_HOLD = 2200;

function gpDist(i, active, n) {
  let d = (i - active + n) % n;
  if (d > n / 2) d -= n;
  return d;
}

function gpStyle(dist, reduced) {
  const abs = Math.abs(dist);
  const s   = dist < 0 ? -1 : 1;
  const dur = reduced ? 250 : GP_DUR;
  const ease = reduced ? 'ease' : GP_EASE;

  let tx, ty, sc, ry, op, z, blur;
  if (dist === 0)  { [tx, ty, sc, ry, op, z, blur] = [0,      0,  1.00,     0, 1.00, 10, 0  ]; }
  else if (abs === 1) { [tx, ty, sc, ry, op, z, blur] = [s*82,   8, 0.84, -s*10, 0.90,  6, 0  ]; }
  else if (abs === 2) { [tx, ty, sc, ry, op, z, blur] = [s*155, 18, 0.68, -s*18, 0.55,  3, 1.5]; }
  else               { [tx, ty, sc, ry, op, z, blur] = [s*230, 28, 0.52, -s*26, 0.00,  0, 3  ]; }

  return {
    transform: `translateX(${tx}%) translateY(${ty}px) scale(${sc}) rotateY(${ry}deg)`,
    opacity: op,
    zIndex: z,
    filter: blur ? `blur(${blur}px)` : 'none',
    pointerEvents: abs <= 2 ? 'auto' : 'none',
    transition: [
      `transform ${dur}ms ${ease}`,
      `opacity ${dur}ms ${ease}`,
      `filter ${dur}ms ${ease}`,
    ].join(', '),
    willChange: 'transform, opacity',
  };
}

function GpCarousel({ displayed, items, onOpen }) {
  const t = useT();
  const { lang } = useLang();
  const pName = (p) => (lang === "mr" ? p.name : (p.name_en || p.name));
  const pFort = (p) => (lang === "mr" ? p.fort : (p.fort_en || p.fort));
  const pDistrict = (p) => (lang === "mr" ? p.district : (p.district_en || p.district));
  const n = displayed.length;
  const [active,  setActive]  = useState(0);
  const [shown,   setShown]   = useState(0);
  const paused = false;
  const drag = useRef({ x: 0, moved: false });
  const reduced = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  ).current;

  const advance = useCallback((dir) => {
    setActive(prev => {
      const next = (prev + dir + n) % n;
      setShown(null);
      setTimeout(() => setShown(next), reduced ? 0 : GP_DUR - 150);
      return next;
    });
  }, [n, reduced]);

  useEffect(() => {
    if (paused || reduced) return;
    const id = setTimeout(() => advance(1), GP_DUR + GP_HOLD);
    return () => clearTimeout(id);
  }, [active, paused, reduced, advance]);

  const onDown   = (e) => { drag.current = { x: e.clientX, moved: false }; };
  const onMove   = (e) => { if (Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true; };
  const onUp     = (e) => { const d = e.clientX - drag.current.x; if (Math.abs(d) > 44) advance(d < 0 ? 1 : -1); };
  const onCancel = ()  => { drag.current = { x: 0, moved: false }; };

  return (
    <div
      className="gp-stage"
      role="region"
      aria-label={t("Fort sculpture photos", "दुर्ग प्रतिकृती छायाचित्रे")}
      aria-roledescription="carousel"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onCancel}
    >
      {displayed.map((p, i) => {
        const dist     = gpDist(i, active, n);
        const isCenter = dist === 0;
        const showDetail = isCenter && shown === i;
        return (
          <div
            key={p.id}
            className="gp-slide"
            style={gpStyle(dist, reduced)}
            aria-hidden={Math.abs(dist) > 2 || undefined}
            aria-roledescription="slide"
          >
            <button
              type="button"
              className={`gp-card${showDetail ? ' gp-card--active' : ''}`}
              onClick={() => { if (!drag.current.moved) onOpen(i); }}
              aria-label={items[i].caption}
              tabIndex={isCenter ? 0 : -1}
            >
              <div className="gp-card__img">
                <Img src={p.thumb_path} alt={items[i].alt} />
                <div className="gp-peek" aria-hidden="true">
                  <strong>{pName(p)}</strong>
                  <span>{[pFort(p), pDistrict(p)].filter(Boolean).join(' · ')}</span>
                </div>
              </div>
              <div className="gp-detail">
                <div className="gp-detail-inner">
                  <div className="gp-detail-row">
                    <span className="gp-name">{pName(p)}</span>
                    <span className="gp-counter">{i + 1} / {n}</span>
                  </div>
                  {[pFort(p), pDistrict(p)].filter(Boolean).length > 0 && (
                    <p className="gp-sub">{[pFort(p), pDistrict(p)].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- gallery preview
export function GalleryPreview({ photos = [] }) {
  const t = useT();
  const { lang } = useLang();
  const [index, setIndex] = useState(null);
  if (!photos.length) return null;
  const displayed = photos.slice(0, 20);
  const pName = (p) => (lang === "mr" ? p.name : (p.name_en || p.name));
  const pFort = (p) => (lang === "mr" ? p.fort : (p.fort_en || p.fort));
  const pDistrict = (p) => (lang === "mr" ? p.district : (p.district_en || p.district));
  const items = displayed.map((p) => ({
    src: p.image_path,
    alt: t(
      `Fort replica by ${pName(p)}`,
      `${pName(p)} यांनी बनवलेली दुर्गाची प्रतिकृती`
    ),
    caption: [pName(p), pFort(p), pDistrict(p)].filter(Boolean).join(" · "),
  }));

  return (
    <section className="section surface-night" style={{ paddingBottom: 0 }} aria-labelledby="gp-title">
      <div className="container">
        <div className="section-head__row">
          <Reveal className="section-head">
            <span className="eyebrow">{t("Memories of Fort Heroes", "दुर्गवीरांच्या आठवणी")}</span>
            <h2 id="gp-title">{t("Forts Built in Every Home", "घराघरात उभे राहिलेले दुर्ग")}</h2>
          </Reveal>
          <div className="cluster">
            <Link to="/gallery" className="btn btn--ghost btn--sm">{t("Gallery", "गॅलरी")}</Link>
            <Link to="/album" className="btn btn--ghost btn--sm">{t("Full Album", "संपूर्ण अल्बम")}</Link>
          </div>
        </div>
      </div>

      <div className="gp-track">
        <GpCarousel displayed={displayed} items={items} onOpen={setIndex} />
      </div>

      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </section>
  );
}

// ---------------------------------------------------------------- announcements
export function Updates({ announcements = [] }) {
  const t = useT();
  const { lang } = useLang();
  if (!announcements.length) return null;
  const fmtDate = (v) => lang === "mr" ? mrDate(v) : enDate(v);
  return (
    <section className="section section--tight surface-night-raised" aria-labelledby="updates-title">
      <div className="container">
        <div className="section-head__row">
          <Reveal className="section-head">
            <span className="eyebrow">{t("Announcements", "घोषणा")}</span>
            <h2 id="updates-title">{t("Latest Updates", "ताज्या घडामोडी")}</h2>
          </Reveal>
          <Link to="/updates" className="link-arrow">{t("All Updates →", "सर्व अपडेट्स →")}</Link>
        </div>
        <div className="grid grid--3">
          {announcements.slice(0, 3).map((a, i) => (
            <Reveal key={a.id} delay={i * 0.06} className="card update-card">
              <p className="update-card__date"><Megaphone size={14} aria-hidden="true" /> {fmtDate(a.published_at)}</p>
              <h3>{a.title}</h3>
              {a.body && <p className="muted-night">{a.body}</p>}
              {a.link_url && <Link to={a.link_url} className="link-arrow">{a.link_label || t("More Info", "अधिक माहिती")} →</Link>}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
