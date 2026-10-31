import { AlertCircle, Check, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useLang, useT } from "../../context/LanguageContext.jsx";

// SRS §3 "I am not a robot": Google reCAPTCHA v2 (checkbox) or Cloudflare Turnstile — whichever the API's settings name
// (settings.captcha = { provider, site_key }). The API checks the token before it stores anything.
// provider "dummy" draws a static look-alike checkbox instead, with no script.
const ONLOAD = "__durgotsavCaptchaLoaded";
const SCRIPT = {
  recaptcha: (hl) => `https://www.google.com/recaptcha/api.js?onload=${ONLOAD}&render=explicit&hl=${hl}`,
  turnstile: () => `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=${ONLOAD}&render=explicit`,
};

// One script per page; the widget's language is the site language when it first loads
let loading = null;
function loadLibrary(provider, hl) {
  loading ??= new Promise((resolve, reject) => {
    window[ONLOAD] = () => resolve(provider === "turnstile" ? window.turnstile : window.grecaptcha);
    const script = Object.assign(document.createElement("script"), { src: SCRIPT[provider](hl), async: true, defer: true });
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("CAPTCHA script could not be loaded"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

// Google's or Cloudflare's own widget, in its iframe
const ProviderWidget = forwardRef(function ProviderWidget({ config, onChange }, ref) {
  const t = useT();
  const { lang } = useLang();
  const box = useRef(null);
  const widget = useRef(null);
  const lib = useRef(null);
  const changed = useRef(onChange);
  changed.current = onChange;
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);

  useImperativeHandle(ref, () => ({
    reset() {
      if (lib.current && widget.current != null) lib.current.reset(widget.current);
      changed.current(null);
    },
  }), []);

  useEffect(() => {
    let alive = true;
    // A fresh element each time: reCAPTCHA refuses to render twice into one element (StrictMode runs effects twice)
    const el = document.createElement("div");
    box.current.appendChild(el);
    setState("loading");
    loadLibrary(config.provider, lang === "mr" ? "mr" : "en")
      .then((api) => {
        if (!alive) return;
        lib.current = api;
        widget.current = api.render(el, {
          sitekey: config.site_key,
          theme: "light",
          // the normal widget is ~304 px wide: small phones get the compact one instead of a sideways scroll
          size: (box.current?.clientWidth ?? 320) < 304 ? "compact" : "normal",
          callback: (token) => changed.current(token),
          "expired-callback": () => changed.current(null),
          "error-callback": () => changed.current(null),
        });
        setState("ready");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
      if (config.provider === "turnstile" && widget.current != null) {
        try { lib.current?.remove(widget.current); } catch { /* already gone */ }
      }
      widget.current = null;
      el.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.provider, config.site_key, attempt]);

  return (
    <>
      <div ref={box} className="captcha__widget" />
      {state === "loading" && (
        <span className="captcha__status"><Loader2 className="spin" aria-hidden="true" /> {t("Loading the security check…", "सुरक्षा तपासणी लोड होत आहे…")}</span>
      )}
      {state === "error" && (
        <div className="alert alert--error" role="alert">
          <AlertCircle aria-hidden="true" />
          <span>
            {t("The security check could not be loaded. Check your internet connection.", "सुरक्षा तपासणी लोड झाली नाही. आपले इंटरनेट कनेक्शन तपासा.")}{" "}
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setAttempt((n) => n + 1)}>
              <RefreshCw aria-hidden="true" /> {t("Try again", "पुन्हा प्रयत्न करा")}
            </button>
          </span>
        </div>
      )}
    </>
  );
});

// provider "dummy": the same "I'm not a robot" box drawn locally — no script, no "testing purposes only" banner.
// The API accepts any token in this mode (a tick is still required), so it does not stop scripted submissions.
const DummyWidget = forwardRef(function DummyWidget({ onChange }, ref) {
  const t = useT();
  const changed = useRef(onChange);
  changed.current = onChange;
  const timer = useRef(null);
  const [state, setState] = useState("idle"); // idle → checking → checked

  useImperativeHandle(ref, () => ({
    reset() {
      clearTimeout(timer.current);
      setState("idle");
      changed.current(null);
    },
  }), []);
  useEffect(() => () => clearTimeout(timer.current), []);

  function tick() {
    if (state !== "idle") return;
    setState("checking");
    // a short pause like the real check, then a fresh single-use token
    timer.current = setTimeout(() => {
      setState("checked");
      changed.current(`dummy-${Date.now()}`);
    }, 600);
  }

  return (
    <div className="captcha__dummy">
      <button type="button" role="checkbox" className={`captcha__dummy-check is-${state}`}
        aria-checked={state === "checked"} aria-busy={state === "checking"} onClick={tick}>
        <span className="captcha__dummy-box" aria-hidden="true">
          {state === "checking" && <Loader2 className="spin" />}
          {state === "checked" && <Check />}
        </span>
        {t("I'm not a robot", "मी रोबोट नाही")}
      </button>
      <span className="captcha__dummy-badge" aria-hidden="true">
        <ShieldCheck />
        {t("Secure", "सुरक्षित")}
      </span>
    </div>
  );
});

/**
 * config: settings.captcha. onChange(token | null): a fresh token after the tick, null when it expires or fails.
 * ref.reset(): asks for a new tick — tokens are single-use, so after every submit attempt.
 */
export const Captcha = forwardRef(function Captcha({ config, onChange, invalid }, ref) {
  const t = useT();
  if (!config) return null;
  const Widget = config.provider === "dummy" ? DummyWidget : ProviderWidget;
  return (
    <div className={`captcha ${invalid ? "has-error" : ""}`} data-field="captcha">
      <span className="field__label captcha__label">
        <ShieldCheck aria-hidden="true" /> {t("Security check", "सुरक्षा तपासणी")} — {t("tick “I am not a robot”", "“मी रोबोट नाही” वर खूण करा")}
        <span className="req" aria-hidden="true">*</span>
      </span>
      <Widget ref={ref} config={config} onChange={onChange} />
    </div>
  );
});
