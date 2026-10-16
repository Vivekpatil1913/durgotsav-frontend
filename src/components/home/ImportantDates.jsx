import { Calendar } from "lucide-react";
import { useT } from "../../context/LanguageContext.jsx";
import { Divider } from "../ui/Ornament.jsx";
import { Reveal } from "../ui/Reveal.jsx";
import "./home.css";

// Other pages can reuse this section:
// `only` picks milestones by id (e.g. ["shiv-pratap-din"]), `overrides` changes a card's fields by id
// (e.g. { "shiv-pratap-din": { num: "01", date: "…" } }), `eyebrow` / `title` / `accent` / `subtitle` replace the
// heading, `watermark={false}` hides the background text and `className` adds a background variant.
export function ImportantDates({ only, overrides, eyebrow, title, accent, subtitle, watermark = true, className = "" }) {
  const t = useT();

  const ALL_MILESTONES = [
    {
      id:    "festival-begins",
      num:   t("01", "०१"),
      title: t("Festival Begins", "दुर्गोत्सवाचा शुभारंभ"),
      desc:  t(
        "Build a fort replica, take a photo and submit the registration form.",
        "दुर्गाची प्रतिकृती उभारा, छायाचित्र काढा आणि नोंदणी अर्ज सादर करा."
      ),
      date:  t("18 October 2026", "१८ ऑक्टोबर २०२६"),
      tag:   "Festival Begins",
      img:   "/images/ml-icon-fort.png",
      alt:   t("Durgotsav — Fort", "दुर्गोत्सव — दुर्ग"),
    },
    {
      id:    "registration-closes",
      num:   t("02", "०२"),
      title: t("Last Day of Registration", "नोंदणीचा अंतिम दिवस"),
      desc:  t(
        "Last day to upload your photo and form. Complete your registration before this date.",
        "छायाचित्र व अर्ज अपलोड करण्याचा शेवटचा दिवस. यापूर्वी नोंदणी पूर्ण करा."
      ),
      date:  t("10 November 2026", "१० नोव्हेंबर २०२६"),
      tag:   "Registration Closes",
      img:   "/images/ml-icon-document.png",
      alt:   t("Registration — Document", "नोंदणी — दस्तऐवज"),
    },
    {
      id:    "shiv-pratap-din",
      num:   t("03", "०३"),
      title: t("Shiv Pratap Din", "शिव प्रताप दिन"),
      desc:  t(
        "Grand ceremony for certificate distribution and the World Record. Jai Shivray!",
        "अभिनंदन पत्र वितरण व जागतिक विश्वविक्रमाचा भव्य सोहळा. जय शिवराय!"
      ),
      date:  t("10 November 2026", "१० नोव्हेंबर २०२६"),
      tag:   "World Record Day",
      img:   "/images/ml-icon-warrior.png",
      alt:   t("Shiv Pratap Din — Shivrai", "शिव प्रताप दिन — शिवराय"),
    },
  ];
  const MILESTONES = (only ? ALL_MILESTONES.filter((m) => only.includes(m.id)) : ALL_MILESTONES)
    .map((m) => ({ ...m, ...overrides?.[m.id] }));
  const single = MILESTONES.length === 1;

  return (
    <section className={`section idates${single ? " idates--single" : ""} ${className}`.trim()} aria-labelledby="idates-title">

      {watermark && <div className="idates__watermark" aria-hidden="true">{t("Durgotsav", "दुर्गोत्सव")}</div>}

      <div className="container">

        <Reveal className="idates__head">
          <span className="eyebrow">{eyebrow ?? t("Planning & Important Dates", "नियोजन व महत्त्वाच्या तारखा")}</span>
          <h2 id="idates-title" className="idates__title">
            {title ?? t("Durgotsav", "दुर्गोत्सव")} <span className="idates__title-accent">{accent ?? "2026"}</span>
          </h2>
          <Divider className="idates__divider" />
          <p className="idates__subtitle">
            {subtitle ?? t(
              "Key milestones and important dates to be part of this grand festival.",
              "या भव्य उत्सवाचा भाग होण्यासाठी प्रमुख टप्पे व महत्त्वाच्या तारखा"
            )}
          </p>
        </Reveal>

        <div className="idates__cols">
          {MILESTONES.map(({ num, title, desc, date, tag, img, alt }, i) => (
            <Reveal key={num} delay={i * 0.12} className="idates__card">
              <img className="idates__arch" src={img} alt={alt} loading="lazy" />
              <div className="idates__num-badge" aria-hidden="true">{num}</div>
              <div className="idates__date-pill">
                <Calendar size={14} aria-hidden="true" />
                <span>{date}</span>
              </div>
              <span className="idates__tag">{tag}</span>
              <h3 className="idates__card-title">{title}</h3>
              <p className="idates__card-desc">{desc}</p>
            </Reveal>
          ))}
        </div>

        {!single && <div className="idates__timeline" aria-hidden="true">
          <div className="idates__timeline-line" />
          <div className="idates__timeline-nodes">
            {MILESTONES.map(({ num }) => (
              <div key={num} className="idates__timeline-node" />
            ))}
          </div>
        </div>}

      </div>
    </section>
  );
}
