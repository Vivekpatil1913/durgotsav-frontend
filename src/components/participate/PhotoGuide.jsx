import { Camera, Castle, CircleCheck, User, Users } from "lucide-react";
import { useT } from "../../context/LanguageContext.jsx";
import { mr } from "../../lib/format.js";

// The campaign's photo rule: an individual stands beside the replica, a team poses around it.
// `share` is how much of the frame the replica vs. the builder(s) should fill; `example` is a model
// photo (public/images/photo-guide) and its width/height ratio, used to line the two up at equal height.
export const PHOTO_GUIDES = {
  individual: {
    title: ["Individual photo", "वैयक्तिक फोटो"],
    body: [
      "The fort replica must stand out clearly in the photo. We expect a photo of the person who built it standing beside the replica.",
      "दुर्ग प्रतिकृतीचा वैयक्तिक फोटो अपलोड करताना प्रतिकृती ठळकपणे दिसणे महत्त्वाचे आहे. प्रतिकृती घडवणारी व्यक्ती प्रतिकृतीच्या बाजूला उभी आहे, असा फोटो अपेक्षित आहे.",
    ],
    share: { replica: 70, people: 30 },
    people: ["Builder", "घडवणारी व्यक्ती"],
    PeopleIcon: User,
    example: { src: "individual-example", widths: [400, 720], ratio: 960 / 1080, alt: ["A participant standing beside her fort replica", "आपल्या दुर्ग प्रतिकृतीच्या बाजूला उभी सहभागी"] },
  },
  group: {
    title: ["Group photo", "ग्रुप फोटो"],
    body: [
      "In a group photo too, the fort replica must be clearly visible. The team that built it should stand beside the replica for the photo.",
      "दुर्ग प्रतिकृतीचा ग्रुप फोटो अपलोड करतानाही प्रतिकृती अगदी स्पष्ट दिसणे महत्त्वाचे आहे. प्रतिकृती घडवणाऱ्या टीमने दुर्ग प्रतिकृतीच्या बाजूला उभे राहून फोटो काढावा.",
    ],
    share: { replica: 70, people: 30 },
    people: ["Team", "टीम"],
    PeopleIcon: Users,
    example: { src: "group-example", widths: [560, 960], ratio: 1460 / 1200, alt: ["A team of four posing around their fort replica", "आपल्या दुर्ग प्रतिकृतीभोवती उभी चार जणांची टीम"] },
  },
};

const pct = (t, n) => t(`${n}%`, `${mr(n)}%`);

// Bar showing how much of the frame the replica vs. the people should fill.
export function FrameShare({ guide }) {
  const t = useT();
  const { replica, people } = guide.share;
  const { PeopleIcon } = guide;
  return (
    <div
      className="frame-share"
      role="img"
      aria-label={t(
        `The photo should be about ${replica}% fort replica and ${people}% ${guide.people[0].toLowerCase()}.`,
        `फोटोत सुमारे ${mr(replica)}% दुर्ग प्रतिकृती आणि ${mr(people)}% ${guide.people[1]} असावी.`,
      )}
    >
      <div className="frame-share__bar">
        <span className="frame-share__part frame-share__part--replica" style={{ flexBasis: `${replica}%` }}>
          <Castle aria-hidden="true" />
          <strong>{pct(t, replica)}</strong>
          <small>{t("Fort replica", "दुर्ग प्रतिकृती")}</small>
        </span>
        <span className="frame-share__part frame-share__part--people" style={{ flexBasis: `${people}%` }}>
          <PeopleIcon aria-hidden="true" />
          <strong>{pct(t, people)}</strong>
          <small>{t(...guide.people)}</small>
        </span>
      </div>
    </div>
  );
}

// Shown above the registration form: the two model photos, each with its rule underneath.
export function PhotoExamples() {
  const t = useT();
  return (
    <section className="photo-examples card-light" aria-labelledby="photo-examples-title">
      <header className="photo-examples__head">
        <span className="photo-examples__icon"><Camera aria-hidden="true" /></span>
        <div>
          <span className="photo-examples__kicker">{t("Read before you register", "नोंदणीपूर्वी नक्की वाचा")}</span>
          <h2 id="photo-examples-title">{t("Care to take while uploading your fort replica photo", "दुर्ग प्रतिकृतीचा फोटो अपलोड करताना घ्यावयाची काळजी")}</h2>
        </div>
      </header>
      <div className="photo-examples__grid">
        {Object.entries(PHOTO_GUIDES).map(([key, guide]) => {
          const { src, widths, ratio, alt } = guide.example;
          return (
            <figure key={key} className="photo-example" style={{ "--ratio": ratio }}>
              <div className="photo-example__media">
                <img
                  src={`/images/photo-guide/${src}-${widths[1]}.webp`}
                  srcSet={widths.map((w) => `/images/photo-guide/${src}-${w}.webp ${w}w`).join(", ")}
                  sizes="(min-width: 1024px) 26vw, (min-width: 640px) 45vw, 92vw"
                  alt={t(...alt)}
                  loading="lazy"
                  decoding="async"
                  style={{ aspectRatio: ratio }}
                />
                <span className="photo-example__badge"><CircleCheck aria-hidden="true" /> {t("Ideal photo", "आदर्श फोटो")}</span>
              </div>
              <figcaption>
                <h3><guide.PeopleIcon aria-hidden="true" /> {t(...guide.title)}</h3>
                <FrameShare guide={guide} />
                <p>{t(...guide.body)}</p>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
