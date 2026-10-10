import { CalendarClock, Camera, Leaf, ShieldAlert, Users } from "lucide-react";
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
import { enDate, mrDate } from "../lib/format.js";
import { Markdown, sections } from "../lib/markdown.jsx";
import "./pages.css";

function ClosedNotice({ status }) {
  const { settings } = useSite();
  const { lang } = useLang();
  const t = useT();
  const notStarted = status.reason === "not_started";
  const fmtDate = (v) => lang === "mr" ? mrDate(v) : enDate(v);
  return (
    <div className="card-light closed-notice" role="status">
      <CalendarClock aria-hidden="true" />
      <h2>
        {notStarted
          ? t("Online registration will begin soon", "ऑनलाइन नोंदणी लवकरच सुरू होईल")
          : t("Registration is currently closed", "नोंदणी सध्या बंद आहे")}
      </h2>
      <p>
        {notStarted
          ? t(
              `Online registration for Durgotsav will begin from ${fmtDate(status.opensAt)}. Meanwhile, start preparing your fort and read the guidelines below.`,
              `दुर्गोत्सवासाठी ऑनलाइन नोंदणी ${fmtDate(status.opensAt)} पासून सुरू होईल. तोपर्यंत दुर्गाची तयारी सुरू करा आणि खालील संहिता वाचा.`
            )
          : settings.registration?.note || t("Check the Updates page for registration updates.", "नोंदणीबाबतच्या अद्यतनांसाठी अपडेट्स पान पाहा.")}
      </p>
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
      t("A photo where both you and your fort replica are clearly visible.", "आपण व आपली प्रतिकृती दोन्ही स्पष्ट दिसतील असे स्वतःचे छायाचित्र.")],
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
          "Registration can only be done through this official website. One person/family should register once per replica.",
          "नोंदणी फक्त या अधिकृत संकेतस्थळावरून करता येते. एका व्यक्तीने/कुटुंबाने एका प्रतिकृतीच्या आधारे एक नोंदणी करावी."
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
            {status.reason === "loading" ? <div className="skeleton" style={{ height: 520 }} /> : status.open ? <RegistrationForm /> : <ClosedNotice status={status} />}
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
