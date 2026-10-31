import { CalendarClock, Camera, Leaf, ShieldAlert, Users } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { RegistrationForm } from "../components/participate/RegistrationForm.jsx";
import { Journey } from "../components/home/HomeSections.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { Accordion } from "../components/ui/Accordion.jsx";
import { PageHero } from "../components/ui/PageParts.jsx";
import { Reveal } from "../components/ui/Reveal.jsx";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useRegistrationStatus, useSite } from "../context/SiteContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { useRegistrationNotice } from "../hooks/useRegistrationNotice.js";
import { Markdown, sections } from "../lib/markdown.jsx";
import "./pages.css";

// Shown instead of the form while Admin → Settings → Registration form is off; the dates come from settings
function ClosedNotice() {
  const t = useT();
  const notice = useRegistrationNotice();
  return (
    <div className="card-light closed-notice" role="status">
      <CalendarClock aria-hidden="true" />
      <h2>{notice.heading}</h2>
      <p>{notice.text}</p>
      {notice.note && <p>{notice.note}</p>}
      <div className="cluster" style={{ justifyContent: "center" }}>
        <Link to="/forts" className="btn btn--primary">{t("Choose a Fort", "दुर्ग निवडा")}</Link>
        <Link to="/certificate" className="btn btn--outline">{t("Already registered?", "आधी नोंदणी केली आहे?")}</Link>
      </div>
    </div>
  );
}

export default function Participate() {
  const t = useT();
  const { lang } = useLang();
  const status = useRegistrationStatus();
  const { refresh } = useSite();
  // Registration is opened and closed from Admin → Settings, so check it again every time this page opens
  useEffect(() => {
    refresh();
  }, [refresh]);
  const rules = useApi("/pages/rules").data?.data;
  const rulesTitle    = rules ? (lang === "mr" ? rules.title    : (rules.title_en    || rules.title))    : null;
  const rulesBody     = rules ? (lang === "mr" ? rules.body     : (rules.body_en     || rules.body))     : null;
  const ruleSections  = rulesBody ? sections(rulesBody) : [];

  const HIGHLIGHTS = [
    [Users,       t("Who can participate", "कोण सहभागी होऊ शकते"),
      t("Anyone in the world — individual, family, housing society, organization, group, school or college.", "जगातील कोणतीही व्यक्ती, कुटुंब, गृहसंकुल, संस्था, गट, शाळा किंवा महाविद्यालय.")],
    [Leaf,        t("Eco-friendly materials", "पर्यावरणपूरक साहित्य"),
      t("Prefer safe and eco-friendly materials such as clay, stone, bricks, and paper.", "माती, दगड, विटा, कागद असे सुरक्षित व पर्यावरणपूरक साहित्य वापरण्यास प्राधान्य द्या.")],
    [Camera,      t("Clear photo", "स्पष्ट छायाचित्र"),
      t("One clear photo where your replica stands out — about 75% replica and 25% you or your team.", "प्रतिकृती ठळकपणे दिसेल असा एक स्पष्ट फोटो — सुमारे ७५% प्रतिकृती व २५% आपण किंवा आपली टीम.")],
    [ShieldAlert, t("Public safety", "सार्वजनिक सुरक्षितता"),
      t("Take care not to block roads, pedestrian paths, or fire safety routes.", "रस्ते, पादचारी मार्ग, अग्निसुरक्षा मार्ग यांना अडथळा होणार नाही याची दक्षता घ्या.")],
  ];

  return (
    <>
      <Seo
        title={t("Join Durgotsav — Register", "दुर्गोत्सवात सहभागी व्हा — नोंदणी")}
        description={t(
          "Build a fort replica, upload your photo and receive a digital congratulation certificate. Registration process, rules and conditions.",
          "दुर्गाची प्रतिकृती बनवा, छायाचित्र अपलोड करा आणि डिजिटल अभिनंदन पत्र मिळवा. नोंदणी प्रक्रिया, नियम व अटी."
        )}
      />
      <PageHero
        eyebrow={t("Participation", "सहभाग")}
        title={t("Your Fort, Your Tribute", "आपला दुर्ग, आपली मानवंदना")}
        lead={t(
          "Registration can only be done through this official website. Register once per replica — one mobile number can be used for any number of registrations. The certificate is ready once AMRUT has verified the photo and details.",
          "नोंदणी फक्त या अधिकृत संकेतस्थळावरून करता येते. एका प्रतिकृतीसाठी एक नोंदणी करावी — एका मोबाईल क्रमांकावरून कितीही नोंदणी करता येतात. छायाचित्र व माहितीची पडताळणी झाल्यावर अभिनंदन पत्र मिळते."
        )}
      />
      <Journey />
      <section className="section surface-parchment">
        <div className="container participate-layout">
          <div className="stack participate-aside">
            <Reveal className="grid participate-highlights">
              {HIGHLIGHTS.map(([Icon, title, text]) => (
                <div key={title} className="highlight">
                  <Icon aria-hidden="true" />
                  <div>
                    <h3>{title}</h3>
                    <p className="muted">{text}</p>
                  </div>
                </div>
              ))}
            </Reveal>
            <p className="muted participate-note">
              {t(
                "Participation in Durgotsav is completely voluntary. The digital congratulation letter is a record of participation and does not create any financial, governmental, or other rights.",
                "दुर्गोत्सवात सहभाग पूर्णपणे ऐच्छिक आहे. डिजिटल अभिनंदन पत्र ही सहभागाची नोंद असून त्यातून कोणताही आर्थिक, शासकीय किंवा अन्य हक्क निर्माण होत नाही."
              )}
            </p>
          </div>
          <div id="register" className="participate-form">
            {status.reason === "loading" ? <div className="skeleton" style={{ height: 520 }} /> : status.open ? <RegistrationForm /> : <ClosedNotice />}
          </div>
        </div>
      </section>

      {ruleSections.length > 0 && (
        <section className="section surface-parchment rules-section" aria-labelledby="rules-title">
          <div className="container container--narrow">
            <Reveal className="section-head">
              <span className="eyebrow">{t("Schedule A", "परिशिष्ट-अ")}</span>
              <h2 id="rules-title">{rulesTitle}</h2>
            </Reveal>
            <Accordion
              items={ruleSections.map((s) => ({ key: s.title, title: s.title, body: s.body }))}
              defaultOpen={0}
              renderBody={(item) => <Markdown source={item.body} className="prose prose--compact" />}
            />
          </div>
        </section>
      )}
    </>
  );
}
