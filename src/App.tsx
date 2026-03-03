import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Car,
  ChevronRight,
  Compass,
  Coffee,
  Flame,
  Heart,
  Home,
  Map as MapIcon,
  MessageSquare,
  Navigation,
  Phone,
  Radar,
  Send,
  Shield,
  Sparkles,
  Timer,
  User,
  Wifi,
  X,
} from "lucide-react";

/**
 * AT&T Campus Companion (frontend demo)
 * - Mobile-first glass UI
 * - Scenario-driven demo: Home adapts to context
 * - Tabs: Home, Explore, Map, Schedule, Profile, Admin
 * - Virtual Escort: Security Mode + pulsing safety radius on map
 *
 * Dependency:
 *   npm i lucide-react
 */

type TabKey = "home" | "explore" | "map" | "schedule" | "profile" | "admin";
type ScenarioKey = "s1" | "s2" | "s3" | "s4" | "s5" | "s6";
type SheetKey = null | "security" | "issue";
type BuildingCode = "A" | "B" | "C";
type WorkMode = "Focus" | "Collaboration" | "Call" | "Recharge";
type PersonaKey = "exec" | "parent" | "engineer";

type CampusPOI = {
  id: string;
  name: string;
  kind: "workspace" | "food" | "wellness" | "space";
  bldg: BuildingCode;
  x: number;
  y: number;
  buzz: number; // 0..100
  availability: number; // 0..100
  quiet: number; // 0..100
  rating: number; // 1..5
};

type Garage = {
  id: string;
  name: string;
  x: number;
  y: number;
  total: number;
  available: number;
  evAvailable: number;
  accessibleAvailable: number;
  walkTo: Record<BuildingCode, number>; // minutes
};

type CalendarEvent = {
  id: string;
  title: string;
  start: string; // HH:MM
  end: string; // HH:MM
  bldg: BuildingCode;
  room?: string;
};

type Workspace = {
  id: string;
  name: string;
  bldg: BuildingCode;
  modeFit: Array<WorkMode>;
  quiet: number;
  hasWhiteboard: boolean;
  hasDualMonitors: boolean;
  availableUntil: string; // HH:MM
};

type Amenity = {
  id: string;
  name: string;
  kind: "coffee" | "breakfast" | "lunch" | "wellness";
  bldg: BuildingCode;
  waitMins: number;
  open: boolean;
};

type Preferences = {
  persona: PersonaKey;
  needsEV: boolean;
  accessibility: boolean;
  walkingToleranceMins: number;
  lowStimulus: boolean;
  quietPreference: boolean;
  favoriteOrder: string;
};

type ScenarioState = {
  key: ScenarioKey;
  title: string;
  subtitle: string;
  now: string;
  employeeState: "driving" | "parked" | "in-building";
  workMode: WorkMode;
  discoveryMode: boolean;
  accessibleFocus: boolean;
};

const ATTNAVY = "#003366";
const ATTCYAN = "#00A8E0";

const CAMPUS_POIS: CampusPOI[] = [
  { id: "sky", name: "Sky Lounge", kind: "workspace", bldg: "A", x: 22, y: 22, buzz: 18, availability: 82, quiet: 92, rating: 4.8 },
  { id: "focus", name: "Quiet Zones", kind: "workspace", bldg: "A", x: 30, y: 38, buzz: 24, availability: 76, quiet: 88, rating: 4.7 },
  { id: "grove", name: "The Grove", kind: "food", bldg: "B", x: 52, y: 35, buzz: 58, availability: 60, quiet: 55, rating: 4.6 },
  { id: "cafeB", name: "Building B Cafe", kind: "food", bldg: "B", x: 48, y: 58, buzz: 64, availability: 55, quiet: 42, rating: 4.4 },
  { id: "tacos", name: "Legacy Tacos", kind: "food", bldg: "B", x: 64, y: 50, buzz: 72, availability: 44, quiet: 35, rating: 4.9 },
  { id: "trail", name: "Nature Trail", kind: "wellness", bldg: "A", x: 18, y: 74, buzz: 12, availability: 100, quiet: 95, rating: 4.5 },
  { id: "war", name: "War Room", kind: "space", bldg: "C", x: 78, y: 28, buzz: 88, availability: 22, quiet: 22, rating: 4.7 },
];

const GARAGES: Garage[] = [
  { id: "ga", name: "Garage A", x: 20, y: 10, total: 1800, available: 520, evAvailable: 26, accessibleAvailable: 14, walkTo: { A: 3, B: 10, C: 12 } },
  { id: "gb", name: "Garage B", x: 52, y: 18, total: 2200, available: 740, evAvailable: 44, accessibleAvailable: 22, walkTo: { A: 8, B: 3, C: 7 } },
  { id: "gc", name: "Garage C", x: 82, y: 16, total: 2000, available: 410, evAvailable: 18, accessibleAvailable: 16, walkTo: { A: 13, B: 8, C: 3 } },
];

const CALENDAR: CalendarEvent[] = [
  { id: "e1", title: "Daily standup", start: "09:00", end: "09:20", bldg: "C", room: "War Room" },
  { id: "e2", title: "Design review", start: "10:15", end: "11:00", bldg: "B", room: "Studio 2" },
  { id: "e3", title: "Client sync", start: "13:30", end: "13:55", bldg: "B", room: "Briefing pod" },
  { id: "e4", title: "2PM planning", start: "14:00", end: "14:30", bldg: "A", room: "Sky Lounge" },
];

const WORKSPACES: Workspace[] = [
  { id: "w1", name: "Sky Lounge focus pod", bldg: "A", modeFit: ["Focus", "Call"], quiet: 92, hasWhiteboard: false, hasDualMonitors: true, availableUntil: "09:45" },
  { id: "w2", name: "Quiet zone window nook", bldg: "A", modeFit: ["Focus"], quiet: 88, hasWhiteboard: false, hasDualMonitors: false, availableUntil: "10:30" },
  { id: "w3", name: "Huddle room 3", bldg: "B", modeFit: ["Collaboration"], quiet: 55, hasWhiteboard: true, hasDualMonitors: false, availableUntil: "09:30" },
  { id: "w4", name: "Phone booth row 2", bldg: "B", modeFit: ["Call"], quiet: 75, hasWhiteboard: false, hasDualMonitors: false, availableUntil: "11:15" },
  { id: "w5", name: "Focus suite 12", bldg: "C", modeFit: ["Focus", "Collaboration"], quiet: 80, hasWhiteboard: true, hasDualMonitors: true, availableUntil: "09:20" },
  { id: "w6", name: "Recovery lounge", bldg: "C", modeFit: ["Recharge"], quiet: 70, hasWhiteboard: false, hasDualMonitors: false, availableUntil: "12:00" },
];

const AMENITIES: Amenity[] = [
  { id: "a1", name: "Building B Cafe", kind: "coffee", bldg: "B", waitMins: 4, open: true },
  { id: "a2", name: "Sky Lounge espresso", kind: "coffee", bldg: "A", waitMins: 2, open: true },
  { id: "a3", name: "Legacy tacos", kind: "lunch", bldg: "B", waitMins: 7, open: true },
  { id: "a4", name: "Protein bowl bar", kind: "breakfast", bldg: "B", waitMins: 6, open: true },
  { id: "a5", name: "Nature trail", kind: "wellness", bldg: "A", waitMins: 0, open: true },
];

const PERSONAS: Array<{ key: PersonaKey; name: string; line: string; defaults: Partial<Preferences> }> = [
  { key: "exec", name: "Executive early riser", line: "Fast arrival, EV parking, polished spaces.", defaults: { needsEV: true, walkingToleranceMins: 10, quietPreference: false, lowStimulus: false } },
  { key: "parent", name: "Parent commuter", line: "Shortest paths, low walking, quick food.", defaults: { needsEV: false, walkingToleranceMins: 6, quietPreference: false, lowStimulus: false } },
  { key: "engineer", name: "Engineer deep work", line: "Quiet spaces, longer focus windows, healthy lunch.", defaults: { needsEV: false, walkingToleranceMins: 12, quietPreference: true, lowStimulus: true } },
];

const SCENARIOS: ScenarioState[] = [
  { key: "s1", title: "Driving in", subtitle: "Parking and workday start", now: "08:35", employeeState: "driving", workMode: "Focus", discoveryMode: false, accessibleFocus: false },
  { key: "s2", title: "20 minutes before", subtitle: "Free-time optimization", now: "09:40", employeeState: "in-building", workMode: "Focus", discoveryMode: false, accessibleFocus: false },
  { key: "s3", title: "Right space", subtitle: "Work mode re-ranks spaces", now: "10:05", employeeState: "in-building", workMode: "Focus", discoveryMode: false, accessibleFocus: false },
  { key: "s4", title: "Plan my day", subtitle: "Schedule + transitions", now: "09:05", employeeState: "parked", workMode: "Focus", discoveryMode: false, accessibleFocus: false },
  { key: "s5", title: "New to campus", subtitle: "Discovery mode", now: "11:10", employeeState: "in-building", workMode: "Collaboration", discoveryMode: true, accessibleFocus: false },
  { key: "s6", title: "Accessible", subtitle: "Personalized and accessible", now: "08:35", employeeState: "driving", workMode: "Focus", discoveryMode: false, accessibleFocus: true },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function hhmmToMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suf = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suf}`;
}

function pctColor(p: number) {
  if (p < 35) return "var(--ok)";
  if (p < 70) return "var(--warn)";
  return "var(--bad)";
}

function nextEvent(now: string, events: CalendarEvent[]) {
  const t = hhmmToMin(now);
  return [...events]
    .filter((e) => hhmmToMin(e.end) > t)
    .sort((a, b) => hhmmToMin(a.start) - hhmmToMin(b.start))[0];
}

function diffMins(a: string, b: string) {
  return hhmmToMin(b) - hhmmToMin(a);
}

function rankGarages(args: { garages: Garage[]; nextBldg: BuildingCode; prefs: Preferences }) {
  const { garages, nextBldg, prefs } = args;
  return [...garages]
    .map((g) => {
      const walk = g.walkTo[nextBldg];
      const availPct = (g.available / g.total) * 100;
      const walkScore = 100 - clamp(walk * 9, 0, 95);
      const availabilityScore = clamp(availPct * 4, 0, 100);

      const evPenalty = prefs.needsEV && g.evAvailable <= 0 ? 40 : 0;
      const accPenalty = prefs.accessibility && g.accessibleAvailable <= 0 ? 40 : 0;
      const tolerancePenalty = walk > prefs.walkingToleranceMins ? (walk - prefs.walkingToleranceMins) * 7 : 0;

      const score = walkScore * 0.55 + availabilityScore * 0.35 - evPenalty - accPenalty - tolerancePenalty;

      const why: string[] = [];
      why.push(`${g.available} spots`);
      why.push(`${walk} min walk`);
      if (prefs.needsEV) why.push(`${g.evAvailable} EV`);
      if (prefs.accessibility) why.push(`${g.accessibleAvailable} accessible`);

      return { garage: g, score, walk, why: why.join(" • ") };
    })
    .sort((a, b) => b.score - a.score);
}

function rankWorkspaces(args: {
  workspaces: Workspace[];
  fromGarage: Garage;
  nextMeetingBldg: BuildingCode;
  workMode: WorkMode;
  prefs: Preferences;
  now: string;
}) {
  const { workspaces, fromGarage, nextMeetingBldg, workMode, prefs, now } = args;
  const nowMin = hhmmToMin(now);

  return [...workspaces]
    .filter((w) => hhmmToMin(w.availableUntil) > nowMin)
    .filter((w) => w.modeFit.includes(workMode))
    .map((w) => {
      const walkFromGarage = fromGarage.walkTo[w.bldg];
      const meetingProximity = w.bldg === nextMeetingBldg ? 2 : 7;

      const proximityScore = 100 - clamp(walkFromGarage * 10, 0, 95);
      const meetingScore = 100 - clamp(meetingProximity * 10, 0, 95);

      const quietBoost = (prefs.quietPreference || prefs.lowStimulus) ? (w.quiet / 100) * 26 : 0;
      const monitorBoost = w.hasDualMonitors ? 8 : 0;
      const whiteboardBoost = w.hasWhiteboard ? 6 : 0;
      const tolerancePenalty = walkFromGarage > prefs.walkingToleranceMins ? (walkFromGarage - prefs.walkingToleranceMins) * 8 : 0;

      const score = proximityScore * 0.52 + meetingScore * 0.28 + quietBoost + monitorBoost + whiteboardBoost - tolerancePenalty;

      const why: string[] = [];
      why.push(`${walkFromGarage} min walk`);
      why.push(`until ${formatTime(w.availableUntil)}`);
      if (prefs.quietPreference || prefs.lowStimulus) why.push(`quiet ${w.quiet}/100`);
      if (w.hasWhiteboard) why.push("whiteboard");
      if (w.hasDualMonitors) why.push("dual monitors");

      return { workspace: w, score, walkFromGarage, why: why.join(" • ") };
    })
    .sort((a, b) => b.score - a.score);
}

function bestAmenity(kind: Amenity["kind"], bldg: BuildingCode) {
  const options = AMENITIES.filter((a) => a.kind === kind && a.open);
  const local = options.filter((a) => a.bldg === bldg);
  const pickFrom = local.length ? local : options;
  return [...pickFrom].sort((a, b) => a.waitMins - b.waitMins)[0];
}

function IconBadge({ icon, text, tone = "neutral" }: { icon?: React.ReactNode; text: string; tone?: "neutral" | "cyan" | "navy" | "ok" | "warn" | "bad" }) {
  return (
    <span className={cx("badge", `badge-${tone}`)}>
      {icon ? <span className="badge-ic">{icon}</span> : null}
      <span>{text}</span>
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="card-hd">
      <div>
        <div className="card-title">{title}</div>
        {subtitle ? <div className="card-sub">{subtitle}</div> : null}
      </div>
      {right ? <div className="card-right">{right}</div> : null}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", left }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost"; left?: React.ReactNode }) {
  return (
    <button className={cx("btn", `btn-${variant}`)} onClick={onClick} type="button">
      {left ? <span className="btn-ic">{left}</span> : null}
      <span>{children}</span>
    </button>
  );
}

function BottomSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="sheetOverlay" role="dialog" aria-modal="true" aria-label={title}>
      <button className="sheetBackdrop" onClick={onClose} type="button" aria-label="Close" />
      <div className="sheet">
        <div className="sheetHd">
          <div className="sheetHdLeft">
            <div className="sheetHdTitle">{title}</div>
            <div className="sheetHdSub">Mock workflow for demo</div>
          </div>
          <button className="sheetClose" onClick={onClose} type="button" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange, icon }: { label: string; value: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }) {
  return (
    <button className="toggle" onClick={() => onChange(!value)} type="button">
      <span className="toggle-left">
        {icon ? <span className="toggle-ic">{icon}</span> : null}
        <span className="toggle-label">{label}</span>
      </span>
      <span className={cx("toggle-pill", value && "toggle-on")}>
        <span className={cx("toggle-dot", value && "toggle-dot-on")} />
      </span>
    </button>
  );
}

function MiniStat({ label, value, icon, tone = "cyan" }: { label: string; value: string; icon: React.ReactNode; tone?: "cyan" | "navy" | "ok" | "warn" | "bad" }) {
  return (
    <div className="mini">
      <div className={cx("mini-ic", `mini-${tone}`)}>{icon}</div>
      <div className="mini-txt">
        <div className="mini-val">{value}</div>
        <div className="mini-lbl">{label}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("home");
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("s1");
  const [securityMode, setSecurityMode] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetKey>(null);
  const [issueCategory, setIssueCategory] = useState<"Facilities" | "IT" | "Safety" | "Other">("Facilities");
  const [issueText, setIssueText] = useState("");

  const scenario = useMemo(() => SCENARIOS.find((s) => s.key === scenarioKey)!, [scenarioKey]);

  // Scenario 3: allow live work mode switching (re-ranks workspaces instantly)
  const [workMode, setWorkMode] = useState<WorkMode>(scenario.workMode);
  useEffect(() => {
    setWorkMode(scenario.workMode);
  }, [scenarioKey]);

  const activeWorkMode: WorkMode = scenarioKey === "s3" ? workMode : scenario.workMode;

  const [prefs, setPrefs] = useState<Preferences>({
    persona: "exec",
    needsEV: true,
    accessibility: false,
    walkingToleranceMins: 8,
    lowStimulus: false,
    quietPreference: true,
    favoriteOrder: "Brisket bowl",
  });

  // Apply scenario and persona defaults in a predictable way
  const effectivePrefs = useMemo(() => {
    const p = PERSONAS.find((x) => x.key === prefs.persona);
    const merged: Preferences = { ...prefs, ...p?.defaults } as Preferences;
    if (scenario.accessibleFocus) {
      merged.accessibility = true;
      merged.lowStimulus = true;
      merged.quietPreference = true;
      merged.walkingToleranceMins = Math.min(merged.walkingToleranceMins, 7);
    }
    return merged;
  }, [prefs, scenario.accessibleFocus]);

  const now = scenario.now;
  const upcoming = useMemo(() => nextEvent(now, CALENDAR), [now]);
  const nextBldg: BuildingCode = upcoming?.bldg ?? "B";

  const garageRank = useMemo(() => rankGarages({ garages: GARAGES, nextBldg, prefs: effectivePrefs }), [nextBldg, effectivePrefs]);
  const recommendedGarage = garageRank[0];
  const backupGarage = garageRank[1];

  const workspaceRank = useMemo(() => {
    if (!recommendedGarage) return [] as Array<{ workspace: Workspace; score: number; walkFromGarage: number; why: string }>;
    return rankWorkspaces({
      workspaces: WORKSPACES,
      fromGarage: recommendedGarage.garage,
      nextMeetingBldg: nextBldg,
      workMode: activeWorkMode,
      prefs: effectivePrefs,
      now,
    });
  }, [recommendedGarage, nextBldg, activeWorkMode, effectivePrefs, now]);

  const recommendedWorkspace = workspaceRank[0];

  const coffee = useMemo(() => bestAmenity("coffee", nextBldg), [nextBldg]);
  const breakfast = useMemo(() => bestAmenity("breakfast", nextBldg), [nextBldg]);
  const lunch = useMemo(() => bestAmenity("lunch", nextBldg), [nextBldg]);
  const wellness = useMemo(() => bestAmenity("wellness", nextBldg), [nextBldg]);

  const themeVars = useMemo(() => {
    if (!securityMode) {
      return {
        "--bg":
          "radial-gradient(900px 500px at 20% 0%, rgba(0,168,224,0.18), transparent 55%), radial-gradient(900px 500px at 80% 10%, rgba(0,51,102,0.15), transparent 55%), linear-gradient(180deg, #F6FBFF, #F2F7FB)",
        "--text": "#0B1220",
        "--muted": "rgba(11,18,32,0.65)",
        "--card": "rgba(255,255,255,0.55)",
        "--stroke": "rgba(3,51,102,0.18)",
        "--shadow": "0 18px 55px rgba(0, 51, 102, 0.14)",
        "--navy": ATTNAVY,
        "--cyan": ATTCYAN,
        "--ok": "rgba(16,185,129,0.92)",
        "--warn": "rgba(245,158,11,0.92)",
        "--bad": "rgba(244,63,94,0.92)",
      } as React.CSSProperties;
    }
    return {
      "--bg":
        "radial-gradient(900px 500px at 20% 0%, rgba(0,168,224,0.18), transparent 55%), radial-gradient(900px 500px at 80% 10%, rgba(59,130,246,0.18), transparent 55%), linear-gradient(180deg, #0A1020, #070B14)",
      "--text": "rgba(255,255,255,0.92)",
      "--muted": "rgba(255,255,255,0.68)",
      "--card": "rgba(255,255,255,0.08)",
      "--stroke": "rgba(0,168,224,0.22)",
      "--shadow": "0 18px 55px rgba(0, 168, 224, 0.12)",
      "--navy": ATTNAVY,
      "--cyan": ATTCYAN,
      "--ok": "rgba(52,211,153,0.92)",
      "--warn": "rgba(251,191,36,0.92)",
      "--bad": "rgba(251,113,133,0.92)",
    } as React.CSSProperties;
  }, [securityMode]);

  return (
    <div className="shell" style={themeVars}>
      <Style />

      <header className="top">
        <div className="brand">
          <div className="brand-mark">
            <span className="dot" />
            <span className="dot dot2" />
          </div>
          <div>
            <div className="brand-title">AT&T Campus Companion</div>
            <div className="brand-sub">Executive demo • Future campus</div>
          </div>
        </div>

        <div className="top-right">
          <IconBadge tone="neutral" icon={<Sparkles size={14} />} text={scenario.title} />
          {securityMode ? <IconBadge tone="cyan" icon={<Shield size={14} />} text="Escort" /> : null}
        </div>
      </header>

      <main className="main">
        {tab === "home" ? (
          <HomeTab
            scenario={scenario}
            scenarioKey={scenarioKey}
            onScenario={setScenarioKey}
            onReportIssue={() => setSheet("issue")}
            securityMode={securityMode}
            onEscort={() => setSecurityMode((v) => !v)}
            prefs={effectivePrefs}
            workMode={activeWorkMode}
            onWorkMode={(m) => setWorkMode(m)}
            onGoExplore={() => setTab("explore")}
            onGoMap={() => setTab("map")}
            onGoSchedule={() => setTab("schedule")}
            onGoProfile={() => setTab("profile")}
            upcoming={upcoming}
            now={now}
            recommendedGarage={recommendedGarage}
            backupGarage={backupGarage}
            recommendedWorkspace={recommendedWorkspace}
            coffee={coffee}
            breakfast={breakfast}
            lunch={lunch}
            wellness={wellness}
          />
        ) : null}

        {tab === "explore" ? (
          <ExploreTab
            scenarioKey={scenarioKey}
            onScenario={setScenarioKey}
            prefs={effectivePrefs}
            onGoMap={() => setTab("map")}
          />
        ) : null}

        {tab === "map" ? (
          <MapTab
            securityMode={securityMode}
            selectedPoi={selectedPoi}
            onSelectPoi={setSelectedPoi}
            route={buildRoutePoints({
              garage: recommendedGarage?.garage,
              workspace: recommendedWorkspace?.workspace,
              meetingBldg: nextBldg,
            })}
            scenarioKey={scenarioKey}
            onScenario={setScenarioKey}
          />
        ) : null}

        {tab === "schedule" ? (
          <ScheduleTab
            now={now}
            scenarioKey={scenarioKey}
            onScenario={setScenarioKey}
            events={CALENDAR}
          />
        ) : null}

        {tab === "profile" ? (
          <ProfileTab
            prefs={prefs}
            onPrefs={setPrefs}
            personaKey={prefs.persona}
            onPersona={(k) => {
  const persona = PERSONAS.find((x) => x.key === k);
  setPrefs((p) => ({
    ...p,
    persona: k,
    ...(persona?.defaults ?? {}),
  }));
}}
            scenarioKey={scenarioKey}
            onScenario={setScenarioKey}
          />
        ) : null}

        {tab === "admin" ? <AdminTab scenarioKey={scenarioKey} onScenario={setScenarioKey} /> : null}
      </main>

      <BottomNav tab={tab} onChange={setTab} />

      <button className={cx("fab", securityMode && "fab-on")} onClick={() => setSheet("security")} aria-label="Get security attention" type="button">
        <Shield size={18} />
      </button>

      <BottomSheet open={sheet !== null} title={sheet === "security" ? "Security" : "Report issue"} onClose={() => setSheet(null)}>
        {sheet === "security" ? (
          <div className="sheetBody">
            <div className="sheetRow">
              <div className="sheetLeft">
                <div className="sheetTitle">Request help</div>
                <div className="sheetSub">Notifies on-campus security with your live location (mock).</div>
              </div>
              <Button left={<Send size={16} />} onClick={() => alert("Security notified (mock).")}>Notify</Button>
            </div>
            <div className="sheetRow">
              <div className="sheetLeft">
                <div className="sheetTitle">Call security</div>
                <div className="sheetSub">Connect to campus security desk (mock).</div>
              </div>
              <Button variant="secondary" left={<Phone size={16} />} onClick={() => alert("Calling security (mock).")}>Call</Button>
            </div>
            <div className="sheetRow">
              <div className="sheetLeft">
                <div className="sheetTitle">Virtual escort</div>
                <div className="sheetSub">Toggle escort mode with a safety radius on the map.</div>
              </div>
              <Button variant="secondary" left={<Radar size={16} />} onClick={() => setSecurityMode((v) => !v)}>
                {securityMode ? "On" : "Off"}
              </Button>
            </div>
          </div>
        ) : null}

        {sheet === "issue" ? (
          <div className="sheetBody">
            <div className="field">
              <div className="fieldLbl">Location</div>
              <div className="sheetRow" style={{ padding: 12 }}>
                <div className="sheetLeft">
                  <div className="sheetTitle">You</div>
                  <div className="sheetSub">Map pin: x 46% • y 60% • Building B</div>
                </div>
                <IconBadge tone="cyan" icon={<MapIcon size={14} />} text="Pinned" />
              </div>
            </div>

            <div className="field">
              <div className="fieldLbl">Category</div>
              <select className="select" value={issueCategory} onChange={(e) => setIssueCategory(e.target.value as any)}>
                <option>Facilities</option>
                <option>IT</option>
                <option>Safety</option>
                <option>Other</option>
              </select>
            </div>

            <div className="field">
              <div className="fieldLbl">What happened</div>
              <textarea
                className="textarea"
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                placeholder="Describe the issue. Include building, room, or a landmark."
                rows={5}
              />
            </div>

            <div className="sheetActions">
              <Button variant="secondary" onClick={() => { setIssueText(""); setSheet(null); }} left={<X size={16} />}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!issueText.trim()) {
                    alert("Please enter details.");
                    return;
                  }
                  alert(`Issue submitted (mock) • ${issueCategory} • Building B • x 46 y 60`);
                  setIssueText("");
                  setSheet(null);
                }}
                left={<Send size={16} />}
              >
                Submit
              </Button>
            </div>
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}

function ScenarioPicker({ value, onChange }: { value: ScenarioKey; onChange: (k: ScenarioKey) => void }) {
  return (
    <div className="scenarioCtl">
      <div className="seg" aria-label="scenario picker">
        {SCENARIOS.map((s) => {
          const on = s.key === value;
          return (
            <button
              key={s.key}
              className={cx("segbtn", on && "segon")}
              onClick={() => onChange(s.key)}
              type="button"
            >
              {s.key.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HomeTab(props: {
  scenario: ScenarioState;
  scenarioKey: ScenarioKey;
  onScenario: (k: ScenarioKey) => void;
  onReportIssue: () => void;
  securityMode: boolean;
  onEscort: () => void;
  prefs: Preferences;
  workMode: WorkMode;
  onWorkMode: (m: WorkMode) => void;
  onGoExplore: () => void;
  onGoMap: () => void;
  onGoSchedule: () => void;
  onGoProfile: () => void;
  upcoming?: CalendarEvent;
  now: string;
  recommendedGarage?: { garage: Garage; score: number; walk: number; why: string };
  backupGarage?: { garage: Garage; score: number; walk: number; why: string };
  recommendedWorkspace?: { workspace: Workspace; score: number; walkFromGarage: number; why: string };
  coffee?: Amenity;
  breakfast?: Amenity;
  lunch?: Amenity;
  wellness?: Amenity;
}) {
  const {
    scenario,
    scenarioKey,
    onScenario,
    securityMode,
    onEscort,
    prefs,
    workMode,
    onWorkMode,
    onGoExplore,
    onGoMap,
    onGoSchedule,
    onGoProfile,
    onReportIssue,
    upcoming,
    now,
    recommendedGarage,
    backupGarage,
    recommendedWorkspace,
    coffee,
    breakfast,
    lunch,
    wellness,
  } = props;

  const minutesToMeeting = upcoming ? Math.max(0, diffMins(now, upcoming.start)) : 999;

  const arrivalMode = scenario.employeeState === "driving";
  const freeTimeMode = scenario.key === "s2";
  const dayPlanMode = scenario.key === "s4";
  const discoveryMode = scenario.discoveryMode;

  const foodPick = freeTimeMode ? coffee : arrivalMode ? (breakfast ?? coffee) : lunch ?? coffee;
  const foodLabel = freeTimeMode ? "Coffee" : arrivalMode ? "Breakfast" : "Food";

  return (
    <div className="stack">
      <Card>
        <div className="pad" style={{ paddingTop: 14 }}>
          <div className="home-top">
            <div>
              <div className="hello">Good morning, John.</div>
              <div className="hello-sub">
                {scenario.subtitle}
                {scenario.employeeState === "driving" ? " • arriving" : scenario.employeeState === "parked" ? " • parked" : " • on campus"}
              </div>
            </div>
          </div>

          {/* Scenario 3: Work mode switcher */}
          {scenario.key === "s3" ? (
            <div className="modebar">
              <div className="mode-title">Work mode</div>
              <div className="modechips">
                {(["Focus", "Collaboration", "Call", "Recharge"] as WorkMode[]).map((m) => (
                  <button key={m} className={cx("modechip", m === workMode && "modechip-on")} onClick={() => onWorkMode(m)} type="button">
                    {m}
                  </button>
                ))}
              </div>
              <div className="hint">Workspace ranking updates immediately.</div>
            </div>
          ) : null}

          {/* Scenario 5: Discovery */}
          {discoveryMode ? (
            <div className="glassline" style={{ marginTop: 10 }}>
              <div className="glass-ic">
                <Compass size={16} />
              </div>
              <div className="glass-txt">
                <div className="glass-title">Discovery</div>
                <div className="glass-sub">15-minute mini tours for productivity, wellness, food, and innovation.</div>
                <div className="glass-sub2">Start with one tap.</div>
              </div>
              <Button variant="secondary" left={<ChevronRight size={16} />} onClick={onGoExplore}>
                Start
              </Button>
            </div>
          ) : null}

          {/* Core ordering stays consistent. Logic changes per scenario. */}
          <div className="grid2" style={{ marginTop: 10 }}>
            {/* Parking is only shown when arriving. Once you're on campus, Home prioritizes what’s next. */}
            {arrivalMode ? (
              <>
                <div className="glassline">
                  <div className="glass-ic">
                    <Car size={16} />
                  </div>
                  <div className="glass-txt">
                    <div className="glass-title">Parking</div>
                    <div className="glass-sub">
                      {recommendedGarage && upcoming
                        ? `${recommendedGarage.garage.name} • ${recommendedGarage.garage.available} spots • ${recommendedGarage.walk} min to Building ${upcoming.bldg}`
                        : recommendedGarage
                          ? `${recommendedGarage.garage.name} • ${recommendedGarage.garage.available} spots`
                          : ""}
                    </div>
                    <div className="glass-sub2">{recommendedGarage ? recommendedGarage.why : ""}</div>
                  </div>
                  <Button variant="secondary" left={<Navigation size={16} />} onClick={onGoMap}>
                    Route
                  </Button>
                </div>

                {backupGarage ? (
                  <div className="glassline">
                    <div className="glass-ic">
                      <Shield size={16} />
                    </div>
                    <div className="glass-txt">
                      <div className="glass-title">Alternate</div>
                      <div className="glass-sub">
                        {backupGarage.garage.name} • {backupGarage.garage.available} spots • {backupGarage.walk} min
                      </div>
                      <div className="glass-sub2">{backupGarage.why}</div>
                    </div>
                    <Button variant="secondary" left={<ChevronRight size={16} />} onClick={onGoMap}>
                      Use
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}

            {/* 1) Workspace */}
            <div className="glassline">
              <div className="glass-ic">
                <Building2 size={16} />
              </div>
              <div className="glass-txt">
                <div className="glass-title">Workspace</div>
                <div className="glass-sub">
                  {recommendedWorkspace && recommendedGarage
                    ? `${recommendedWorkspace.workspace.name} • Building ${recommendedWorkspace.workspace.bldg} • ${recommendedWorkspace.walkFromGarage} min walk`
                    : "No workspace available"}
                </div>
                <div className="glass-sub2">{recommendedWorkspace ? recommendedWorkspace.why : ""}</div>
              </div>
              <Button variant="secondary" left={<ChevronRight size={16} />} onClick={() => alert("Reserved (mock).")}>
                Hold
              </Button>
            </div>

            {/* 3) Meeting (calendar) */}
            <div className="glassline">
              <div className="glass-ic">
                <Calendar size={16} />
              </div>
              <div className="glass-txt">
                <div className="glass-title">Next meeting</div>
                <div className="glass-sub">
                  {upcoming
                    ? `${upcoming.title} • ${formatTime(upcoming.start)} • Building ${upcoming.bldg}${upcoming.room ? ` • ${upcoming.room}` : ""}`
                    : "No remaining meetings"}
                </div>
                <div className="glass-sub2">{upcoming ? `Leave in ${Math.max(0, minutesToMeeting - 6)} min` : ""}</div>
              </div>
              <Button variant="secondary" left={<ChevronRight size={16} />} onClick={onGoSchedule}>
                View
              </Button>
            </div>

            {/* 4) Food / coffee / wellness */}
            <div className="glassline">
              <div className="glass-ic">
                {foodLabel === "Coffee" ? <Coffee size={16} /> : foodLabel === "Breakfast" ? <Timer size={16} /> : <Coffee size={16} />}
              </div>
              <div className="glass-txt">
                <div className="glass-title">{foodLabel}</div>
                <div className="glass-sub">
                  {foodPick
                    ? `${foodPick.name} • wait ${foodPick.waitMins} min`
                    : ""}
                </div>
                <div className="glass-sub2">{freeTimeMode ? "Fits your time window." : "Low wait, near next stop."}</div>
              </div>
              <Button variant="secondary" left={<Bell size={16} />} onClick={() => alert("Ordered (mock).")}>
                Order
              </Button>
            </div>

            {/* Scenario 2: short wellness */}
            {freeTimeMode && wellness ? (
              <div className="glassline">
                <div className="glass-ic">
                  <Heart size={16} />
                </div>
                <div className="glass-txt">
                  <div className="glass-title">Wellness</div>
                  <div className="glass-sub">{wellness.name} • 8-minute reset</div>
                  <div className="glass-sub2">Time-optimized.</div>
                </div>
                <Button variant="secondary" left={<ChevronRight size={16} />} onClick={onGoMap}>
                  Go
                </Button>
              </div>
            ) : null}

            {/* Scenario 4: day orchestration */}
            {dayPlanMode ? (
              <div className="glassline">
                <div className="glass-ic">
                  <Briefcase size={16} />
                </div>
                <div className="glass-txt">
                  <div className="glass-title">Day plan</div>
                  <div className="glass-sub">Meetings + free windows + stops.</div>
                  <div className="glass-sub2">One timeline.</div>
                </div>
                <Button variant="secondary" left={<ChevronRight size={16} />} onClick={onGoSchedule}>
                  Open
                </Button>
              </div>
            ) : null}
          </div>

          <div className="scenarioFooter">
            <div className="scenarioLabel">Scenario</div>
            <ScenarioPicker value={scenarioKey} onChange={onScenario} />
          </div>

          <div className="row3" style={{ marginTop: 12 }}>
            <Button variant="secondary" left={<MessageSquare size={16} />} onClick={onReportIssue}>
              Report issue
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ExploreTab({
  scenarioKey,
  onScenario,
  prefs,
  onGoMap,
}: {
  scenarioKey: ScenarioKey;
  onScenario: (k: ScenarioKey) => void;
  prefs: Preferences;
  onGoMap: () => void;
}) {
  type ExploreFilter = "spaces" | "parking" | "coffee" | "food" | "wellness";
  const [filter, setFilter] = useState<ExploreFilter>("spaces");

  const categories: Array<{ k: ExploreFilter; label: string; icon: React.ReactNode }> = [
    { k: "spaces", label: "Spaces", icon: <Building2 size={18} /> },
    { k: "parking", label: "Parking", icon: <Car size={18} /> },
    { k: "coffee", label: "Coffee", icon: <Coffee size={18} /> },
    { k: "food", label: "Food", icon: <Bell size={18} /> },
    { k: "wellness", label: "Wellness", icon: <Heart size={18} /> },
  ];

  const listItems = useMemo(() => {
    // spaces
    if (filter === "spaces") {
      const items = [...CAMPUS_POIS]
        .filter((p) => p.kind === "workspace" || p.kind === "space")
        .sort((a, b) => (prefs.lowStimulus ? b.quiet - a.quiet : b.rating - a.rating))
        .slice(0, 8);
      return items.map((p) => ({
        id: p.id,
        title: p.name,
        sub: `Building ${p.bldg} • ${p.availability}% open • quiet ${p.quiet}/100`,
      }));
    }

    // parking
    if (filter === "parking") {
      const items = [...GARAGES].sort((a, b) => b.available - a.available);
      return items.map((g) => ({
        id: g.id,
        title: g.name,
        sub: `${g.available} spots • EV ${g.evAvailable} • accessible ${g.accessibleAvailable}`,
      }));
    }

    // coffee
    if (filter === "coffee") {
      const items = AMENITIES.filter((a) => a.kind === "coffee" && a.open).sort((a, b) => a.waitMins - b.waitMins);
      return items.map((a) => ({
        id: a.id,
        title: a.name,
        sub: `Building ${a.bldg} • wait ${a.waitMins} min`,
      }));
    }

    // wellness
    if (filter === "wellness") {
      const items = AMENITIES.filter((a) => a.kind === "wellness" && a.open);
      return items.map((a) => ({
        id: a.id,
        title: a.name,
        sub: `Building ${a.bldg} • ready now`,
      }));
    }

    // food
    const items = AMENITIES.filter((a) => (a.kind === "breakfast" || a.kind === "lunch") && a.open).sort((a, b) => a.waitMins - b.waitMins);
    return items.map((a) => ({
      id: a.id,
      title: a.name,
      sub: `Building ${a.bldg} • wait ${a.waitMins} min`,
    }));
  }, [filter, prefs.lowStimulus]);

  return (
    <div className="stack">
      <Card>
        <CardHeader title="Explore" subtitle="Browse spaces, parking, food, wellness" />
        <div className="pad">
          <div className="tiles">
            {categories.map((c) => (
              <button
                key={c.k}
                className={cx("tile2", filter === c.k && "tile2-on")}
                onClick={() => setFilter(c.k)}
                type="button"
              >
                <div className="tile2ic">{c.icon}</div>
                <div className="tile2txt">{c.label}</div>
              </button>
            ))}
          </div>

          <div className="list">
            {listItems.map((it) => (
              <div key={it.id} className="listrow" onClick={onGoMap}>
                <div className="listleft">
                  <div className="listtitle">{it.title}</div>
                  <div className="listsub">{it.sub}</div>
                </div>
                <ChevronRight size={16} className="muted" />
              </div>
            ))}
          </div>

          <div className="scenarioFooter">
            <div className="scenarioLabel">Scenario</div>
            <ScenarioPicker value={scenarioKey} onChange={onScenario} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function buildRoutePoints(args: { garage?: Garage; workspace?: Workspace; meetingBldg: BuildingCode }) {
  const points: Array<{ x: number; y: number; label: string }> = [];
  if (args.garage) points.push({ x: args.garage.x, y: args.garage.y, label: args.garage.name });
  if (args.workspace) {
    const poi = CAMPUS_POIS.find((p) => p.kind === "workspace" && p.bldg === args.workspace!.bldg);
    points.push({ x: poi?.x ?? 54, y: poi?.y ?? 44, label: "Workspace" });
  }
  const meetingAnchor = args.meetingBldg === "A" ? { x: 18, y: 18 } : args.meetingBldg === "B" ? { x: 54, y: 44 } : { x: 82, y: 26 };
  points.push({ ...meetingAnchor, label: `Meeting Bldg ${args.meetingBldg}` });
  return points;
}

function MapTab({
  securityMode,
  selectedPoi,
  onSelectPoi,
  route,
  scenarioKey,
  onScenario,
}: {
  securityMode: boolean;
  selectedPoi: string | null;
  onSelectPoi: (id: string | null) => void;
  route: Array<{ x: number; y: number; label: string }>;
  scenarioKey: ScenarioKey;
  onScenario: (k: ScenarioKey) => void;
}) {
  const poi = selectedPoi ? CAMPUS_POIS.find((p) => p.id === selectedPoi) : null;
  return (
    <div className="stack">
      <Card>
        <CardHeader title="Map" subtitle="Campus view and routes" right={<IconBadge tone="cyan" icon={<MapIcon size={14} />} text="Route" />} />
        <div className="pad">
          <CampusMap securityMode={securityMode} selectedPoi={selectedPoi} onSelectPoi={onSelectPoi} route={route} />

          {poi ? (
            <div className="mapDetail">
              <div className="glassline">
                <div className="glass-ic">
                  {poi.kind === "food" ? <Coffee size={16} /> : poi.kind === "wellness" ? <Heart size={16} /> : <Building2 size={16} />}
                </div>
                <div className="glass-txt">
                  <div className="glass-title">{poi.name}</div>
                  <div className="glass-sub">Building {poi.bldg} • {poi.availability}% open • buzz {poi.buzz}/100</div>
                  <div className="glass-sub2">Tap again to clear.</div>
                </div>
                <Button variant="secondary" left={<Navigation size={16} />} onClick={() => alert("Routing (mock).")}>
                  Go
                </Button>
              </div>
            </div>
          ) : (
            <div className="hint">Tap a pin to see details.</div>
          )}

          <div className="scenarioFooter">
            <div className="scenarioLabel">Scenario</div>
            <ScenarioPicker value={scenarioKey} onChange={onScenario} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function CampusMap({
  securityMode,
  selectedPoi,
  onSelectPoi,
  route,
}: {
  securityMode: boolean;
  selectedPoi: string | null;
  onSelectPoi: (id: string | null) => void;
  route: Array<{ x: number; y: number; label: string }>;
}) {
  const me = { x: 46, y: 60 };
  return (
    <div className="map">
      <div className="map-grid" />

      <div className="map-overlay">
        {CAMPUS_POIS.map((p) => {
          const alpha = clamp(p.buzz / 100, 0.08, 0.40);
          const color = `rgba(0,168,224,${alpha})`;
          return (
            <div
              key={p.id}
              className="heat"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                background: `radial-gradient(circle at 30% 30%, ${color}, rgba(0,0,0,0) 65%)`,
              }}
            />
          );
        })}
      </div>

      {/* garages */}
      {GARAGES.map((g) => {
        const occ = 100 - (g.available / g.total) * 100;
        return (
          <div key={g.id} className="garage" style={{ left: `${g.x}%`, top: `${g.y}%` }}>
            <span className="garage-dot" style={{ background: pctColor(occ) }} />
            <span className="garage-lbl">{g.name}</span>
          </div>
        );
      })}

      {/* route */}
      <svg className="route" viewBox="0 0 100 100" preserveAspectRatio="none">
        {route.length >= 2 ? (
          <polyline
            points={route.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="rgba(0,168,224,0.9)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>

      {/* buildings */}
      <div className="bldg" style={{ left: "18%", top: "18%" }}>
        A
      </div>
      <div className="bldg" style={{ left: "54%", top: "44%" }}>
        B
      </div>
      <div className="bldg" style={{ left: "82%", top: "26%" }}>
        C
      </div>

      {/* pins */}
      {CAMPUS_POIS.filter((p) => p.kind !== "space").map((p) => {
        const on = selectedPoi === p.id;
        return (
          <button
            key={p.id}
            className={cx("pin", on && "pin-on", !on && "pin-mini")}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onClick={() => onSelectPoi(on ? null : p.id)}
            type="button"
            aria-label={p.name}
          >
            <span className={cx("pin-dot", on && "pin-dot-on")} style={{ background: pctColor(p.buzz) }} />
            {on ? <span className="pin-ttl">{p.name}</span> : null}
          </button>
        );
      })}

      {/* user */}
      <div className="me" style={{ left: `${me.x}%`, top: `${me.y}%` }}>
        <div className="me-dot" />
        <div className="me-tag">You</div>
      </div>

      {securityMode ? (
        <div className="escort" style={{ left: `${me.x}%`, top: `${me.y}%` }}>
          <div className="escort-ring" />
          <div className="escort-ring ring2" />
        </div>
      ) : null}

      <div className="map-legend">
        <IconBadge tone="neutral" icon={<Flame size={14} />} text="Buzz heatmap" />
        {securityMode ? <IconBadge tone="cyan" icon={<Shield size={14} />} text="Escort" /> : null}
      </div>
    </div>
  );
}

function ScheduleTab({
  now,
  scenarioKey,
  onScenario,
  events,
}: {
  now: string;
  scenarioKey: ScenarioKey;
  onScenario: (k: ScenarioKey) => void;
  events: CalendarEvent[];
}) {
  const upcoming = nextEvent(now, events);
  const sorted = [...events].sort((a, b) => hhmmToMin(a.start) - hhmmToMin(b.start));
  const nowMin = hhmmToMin(now);

  function statusFor(e: CalendarEvent) {
    const s = hhmmToMin(e.start);
    const en = hhmmToMin(e.end);
    if (nowMin >= en) return { label: "Done", tone: "neutral" as const };
    if (nowMin >= s && nowMin < en) return { label: "Live", tone: "cyan" as const };
    const mins = s - nowMin;
    if (mins <= 10) return { label: `Leave in ${Math.max(0, mins - 6)} min`, tone: "warn" as const };
    return { label: `In ${mins} min`, tone: "neutral" as const };
  }

  return (
    <div className="stack">
      <Card>
        <CardHeader title="Schedule" subtitle="Today" />
        <div className="pad">
          <div className="schedTop">
            <div className="schedNow">
              <div className="schedNowLbl">Now</div>
              <div className="schedNowVal">{formatTime(now)}</div>
              <div className="schedNowSub">{upcoming ? `Next: ${upcoming.title} • ${formatTime(upcoming.start)} • Building ${upcoming.bldg}` : "No remaining meetings"}</div>
            </div>
            <div className="schedPills">
              <IconBadge tone="cyan" icon={<BadgeCheck size={14} />} text="Synced" />
              <IconBadge tone="neutral" icon={<Navigation size={14} />} text="Routing" />
            </div>
          </div>

          <div className="timeline2">
            <div className="tline" />
            {sorted.map((e, i) => {
              const next = sorted[i + 1];
              const gap = next ? diffMins(e.end, next.start) : 0;
              const st = statusFor(e);
              return (
                <React.Fragment key={e.id}>
                  <div className="ev">
                    <div className={cx("dotTime", st.tone === "cyan" && "dotTime-live", st.tone === "warn" && "dotTime-warn")}>
                      <div className="dot" />
                      <div className="timeCol">
                        <div className="timeTop">{formatTime(e.start)}</div>
                        <div className="timeBot">{formatTime(e.end)}</div>
                      </div>
                    </div>

                    <div className="evCard">
                      <div className="evRow">
                        <div className="evTitle">{e.title}</div>
                        <IconBadge tone={st.tone} text={st.label} />
                      </div>
                      <div className="evSub">Building {e.bldg}{e.room ? ` • ${e.room}` : ""}</div>
                      <div className="evMeta">{formatTime(e.start)}–{formatTime(e.end)}</div>
                      <div className="evActions">
                        <Button variant="secondary" left={<Navigation size={16} />} onClick={() => alert("Route (mock).")}>Go</Button>
                        <Button variant="secondary" left={<Coffee size={16} />} onClick={() => alert("Suggested stop (mock).")}>Stops</Button>
                      </div>
                    </div>
                  </div>

                  {gap >= 15 ? (
                    <div className="gapCard">
                      <div className="gapRow">
                        <div className="gapTitle">Free window</div>
                        <IconBadge tone="cyan" text={`${gap} min`} />
                      </div>
                      <div className="gapSub">Suggested: quick coffee, focus pod, or wellness reset near Building {e.bldg}.</div>
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>

          <div className="scenarioFooter">
            <div className="scenarioLabel">Scenario</div>
            <ScenarioPicker value={scenarioKey} onChange={onScenario} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProfileTab({
  prefs,
  onPrefs,
  personaKey,
  onPersona,
  scenarioKey,
  onScenario,
}: {
  prefs: Preferences;
  onPrefs: (p: Preferences) => void;
  personaKey: PersonaKey;
  onPersona: (k: PersonaKey) => void;
  scenarioKey: ScenarioKey;
  onScenario: (k: ScenarioKey) => void;
}) {
  return (
    <div className="stack">
      <Card>
        <CardHeader title="Profile" subtitle="Personas and preferences" />
        <div className="pad">
          <div className="prefblock">
            <div className="prefh">Persona</div>
            <div className="plist">
              {PERSONAS.map((p) => (
                <button
                  key={p.key}
                  className={cx("prow", p.key === personaKey && "prow-on")}
                  onClick={() => onPersona(p.key)}
                  type="button"
                >
                  <div className="prow-left">
                    <div className="prow-title">{p.name}</div>
                    <div className="prow-sub">{p.line}</div>
                  </div>
                  <ChevronRight size={16} className="muted" />
                </button>
              ))}
            </div>
          </div>

          <div className="prefblock">
            <div className="prefh">Preferences</div>
            <Toggle label="EV charging" value={prefs.needsEV} onChange={(v) => onPrefs({ ...prefs, needsEV: v })} icon={<Car size={16} />} />
            <Toggle label="Accessible routing" value={prefs.accessibility} onChange={(v) => onPrefs({ ...prefs, accessibility: v })} icon={<Shield size={16} />} />
            <Toggle label="Low-stimulus" value={prefs.lowStimulus} onChange={(v) => onPrefs({ ...prefs, lowStimulus: v })} icon={<Heart size={16} />} />
            <Toggle label="Prefer quiet" value={prefs.quietPreference} onChange={(v) => onPrefs({ ...prefs, quietPreference: v })} icon={<Activity size={16} />} />

            <div className="slider">
              <div className="slider-top">
                <div className="slider-title">Walk tolerance</div>
                <IconBadge tone="cyan" icon={<Navigation size={14} />} text={`${prefs.walkingToleranceMins} min`} />
              </div>
              <input
                className="range"
                type="range"
                min={2}
                max={15}
                value={prefs.walkingToleranceMins}
                onChange={(e) => onPrefs({ ...prefs, walkingToleranceMins: parseInt(e.target.value, 10) })}
              />
              <div className="slider-sub">Affects parking and workspace.</div>
            </div>

            <div className="slider">
              <div className="slider-top">
                <div className="slider-title">Favorite order</div>
                <IconBadge tone="navy" icon={<Coffee size={14} />} text={prefs.favoriteOrder} />
              </div>
              <select className="select" value={prefs.favoriteOrder} onChange={(e) => onPrefs({ ...prefs, favoriteOrder: e.target.value })}>
                <option>Brisket bowl</option>
                <option>Legacy tacos</option>
                <option>Protein bowl</option>
                <option>Cold brew</option>
              </select>
              <div className="slider-sub">Updates food suggestions.</div>
            </div>
          </div>

          <div className="scenarioFooter">
            <div className="scenarioLabel">Scenario</div>
            <ScenarioPicker value={scenarioKey} onChange={onScenario} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function AdminTab({ scenarioKey, onScenario }: { scenarioKey: ScenarioKey; onScenario: (k: ScenarioKey) => void }) {
  return (
    <div className="stack">
      <Card>
        <CardHeader title="Admin" subtitle="ROI signals" right={<IconBadge tone="cyan" icon={<Shield size={14} />} text="SVP" />} />
        <div className="pad">
          <div className="mini-grid-3">
            <MiniStat label="Energy" value="$4.2k/wk" icon={<Sparkles size={16} />} tone="ok" />
            <MiniStat label="Utilization" value="B: 14%" icon={<Building2 size={16} />} tone="warn" />
            <MiniStat label="5G" value="12ms" icon={<Wifi size={16} />} tone="cyan" />
          </div>

          <div className="admin-card">
            <div className="admin-h">Space health</div>
            <div className="admin-sub">Building B under-utilized.</div>
            <div className="heatmap">
              <HeatTile label="A" value={64} />
              <HeatTile label="B" value={14} />
              <HeatTile label="C" value={78} />
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-h">Network</div>
            <div className="admin-sub">Private 5G latency and reliability.</div>
            <HeatBar label="Latency" value={12} suffix="ms" />
            <HeatBar label="Reliability" value={99} suffix="%" />
          </div>

          <div className="scenarioFooter">
            <div className="scenarioLabel">Scenario</div>
            <ScenarioPicker value={scenarioKey} onChange={onScenario} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function HeatBar({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const pct = clamp(value, 0, 100);
  return (
    <div className="heatrow">
      <div className="heatrow-top">
        <div className="heatrow-lbl">{label}</div>
        <div className="heatrow-val" style={{ color: pctColor(pct) }}>
          {pct}
          {suffix ?? "%"}
        </div>
      </div>
      <div className="heatbar">
        <div className="heatfill" style={{ width: `${pct}%`, background: pctColor(pct) }} />
      </div>
    </div>
  );
}

function HeatTile({ label, value }: { label: string; value: number }) {
  const v = clamp(value, 0, 100);
  return (
    <div className="tile">
      <div className="tile-top">
        <div className="tile-lbl">Bldg {label}</div>
        <IconBadge tone={v < 25 ? "ok" : v < 70 ? "warn" : "bad"} text={`${v}%`} />
      </div>
      <div className="tile-bar">
        <div className="tile-fill" style={{ width: `${v}%`, background: pctColor(v) }} />
      </div>
      <div className="tile-sub">Utilization</div>
    </div>
  );
}

function BottomNav({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  const items: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: "home", label: "Home", icon: <Home size={18} /> },
    { key: "explore", label: "Explore", icon: <Compass size={18} /> },
    { key: "map", label: "Map", icon: <MapIcon size={18} /> },
    { key: "schedule", label: "Schedule", icon: <Calendar size={18} /> },
    { key: "profile", label: "Profile", icon: <User size={18} /> },
    { key: "admin", label: "Admin", icon: <Shield size={18} /> },
  ];

  return (
    <nav className="nav nav6">
      {items.map((it) => {
        const active = it.key === tab;
        return (
          <button key={it.key} className={cx("navbtn", active && "navon")} onClick={() => onChange(it.key)} type="button">
            <span className={cx("navic", active && "navic-on")}>{it.icon}</span>
            <span className="navlbl">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Style() {
  return (
    <style>{`
      :root { --navy: ${ATTNAVY}; --cyan: ${ATTCYAN}; }
      *{ box-sizing:border-box; }
      html,body{ height:100%; }
      body{ margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }

      .shell{
        width: 390px;
        height: 844px;
        border-radius: 38px;
        overflow: hidden;
        background: var(--bg);
        color: var(--text);
        padding: calc(22px + env(safe-area-inset-top)) 14px calc(16px + env(safe-area-inset-bottom));
        display:flex;
        flex-direction:column;
        position: relative;
        box-shadow: 0 35px 90px rgba(2, 6, 23, 0.25);
        border: 1px solid rgba(148,163,184,0.40);
      }
      body{ display:flex; align-items:center; justify-content:center; background: radial-gradient(1200px 700px at 20% 0%, rgba(0,168,224,0.14), transparent 55%),
                    radial-gradient(1200px 700px at 80% 10%, rgba(0,51,102,0.12), transparent 55%),
                    linear-gradient(180deg, #F6FBFF, #EEF5FA); }
      @media (max-width: 430px){ body{ display:block; } .shell{ width:100vw; height:100dvh; min-height:100dvh; border-radius:0; box-shadow:none; border:0; } }

      .top{ width:100%; display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-top:4px; margin-bottom:12px; }
      .brand{ display:flex; align-items:center; gap:10px; }
      .brand-mark{ width:38px; height:38px; border-radius:16px; background: rgba(0,168,224,0.16); border: 1px solid var(--stroke); box-shadow: var(--shadow); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
      .dot{ width:10px; height:10px; border-radius:999px; background: var(--cyan); box-shadow: 0 0 20px rgba(0,168,224,0.45); }
      .dot2{ position:absolute; right:10px; bottom:10px; width:8px; height:8px; background: rgba(0,51,102,0.85); }
      .brand-title{ font-size:14px; font-weight:900; letter-spacing:-0.02em; line-height:1.1; }
      .brand-sub{ font-size:11px; color: var(--muted); margin-top:4px; line-height:1.25; }
      .top-right{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }

      .main{ width:100%; flex:1; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling: touch; padding-bottom: calc(100px + env(safe-area-inset-bottom)); }
      .stack{ display:flex; flex-direction:column; gap:12px; }

      .card{ border-radius: 22px; background: var(--card); border: 1px solid var(--stroke); box-shadow: var(--shadow); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); overflow:hidden; }
      .card-hd{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:14px; }
      .card-title{ font-weight:900; font-size:13px; letter-spacing:-0.01em; }
      .card-sub{ font-size:11px; color: var(--muted); margin-top:3px; }
      .pad{ padding: 0 14px 14px; }

      .badge{ display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:11px; font-weight:800; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); max-width: 100%; }
      .badge-ic{ display:inline-flex; }
      .badge-neutral{ color: var(--text); }
      .badge-cyan{ background: rgba(0,168,224,0.16); color: var(--text); }
      .badge-navy{ background: rgba(0,51,102,0.18); color: var(--text); }
      .badge-ok{ background: rgba(16,185,129,0.16); color: var(--text); }
      .badge-warn{ background: rgba(245,158,11,0.16); color: var(--text); }
      .badge-bad{ background: rgba(244,63,94,0.16); color: var(--text); }

      .hello{ font-size:18px; font-weight:1000; letter-spacing:-0.03em; }
      .hello-sub{ font-size:12px; color: var(--muted); margin-top:4px; }
      .home-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }

      .scenarioFooter{ margin-top: 12px; display:flex; align-items:flex-start; justify-content:space-between; gap:10px; padding:10px; border-radius:18px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); max-width: 100%; }
      .scenarioLabel{ font-weight:1000; font-size:12px; color: var(--muted); flex: 0 0 auto; }
      .scenarioCtl{ flex: 1 1 auto; min-width: 0; display:flex; justify-content:flex-end; }
      .seg{ display:flex; gap:6px; padding:6px; border-radius:16px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); flex-wrap:wrap; justify-content:flex-end; }
      .segbtn{ border:0; background:transparent; color: var(--muted); font-weight:1000; font-size:10px; padding:6px 8px; border-radius:999px; cursor:pointer; white-space: nowrap; }
      .segon{ background: rgba(0,168,224,0.16); color: var(--text); }

      .grid2{ display:flex; flex-direction:column; gap:10px; }
      .glassline{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-radius:18px; border: 1px solid var(--stroke); background: rgba(255,255,255,0.10); }
      .glass-ic{ width:34px; height:34px; border-radius:14px; display:flex; align-items:center; justify-content:center; background: rgba(0,51,102,0.14); border:1px solid rgba(0,168,224,0.18); }
      .glass-txt{ flex:1; min-width:0; }
      .glass-title{ font-size:12px; font-weight:1000; letter-spacing:-0.01em; }
      .glass-sub{ font-size:11px; color: var(--muted); margin-top:2px; }
      .glass-sub2{ font-size:11px; color: rgba(0,168,224,0.95); margin-top:4px; font-weight:800; }

      .btn{ border:0; cursor:pointer; padding:10px 12px; border-radius:16px; font-weight:1000; font-size:12px; display:inline-flex; align-items:center; gap:8px; }
      .btn-ic{ display:inline-flex; }
      .btn-primary{ background: linear-gradient(135deg, rgba(0,168,224,0.95), rgba(0,51,102,0.95)); color:white; box-shadow: 0 10px 30px rgba(0,168,224,0.18); }
      .btn-secondary{ background: rgba(255,255,255,0.12); color: var(--text); border: 1px solid var(--stroke); }
      .btn-ghost{ background: transparent; color: var(--text); border: 1px solid var(--stroke); }

      .row2{ display:flex; gap:10px; margin-top:10px; }
      .row2 .btn{ flex:1; justify-content:center; }
      .row3{ display:flex; gap:10px; margin-top:10px; }
      .row3 .btn{ flex:1; justify-content:center; }
      .hint{ margin-top:10px; font-size:11px; color: var(--muted); }

      .toggle{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-radius:18px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); cursor:pointer; }
      .toggle-left{ display:flex; align-items:center; gap:10px; }
      .toggle-ic{ width:30px; height:30px; border-radius:14px; display:flex; align-items:center; justify-content:center; background: rgba(0,168,224,0.12); border:1px solid rgba(0,168,224,0.20); }
      .toggle-label{ font-weight:1000; font-size:12px; }
      .toggle-pill{ width:54px; height:30px; border-radius:999px; background: rgba(255,255,255,0.14); border:1px solid var(--stroke); padding:3px; position:relative; }
      .toggle-on{ background: rgba(0,168,224,0.18); }
      .toggle-dot{ width:24px; height:24px; border-radius:999px; background: rgba(255,255,255,0.90); transform: translateX(0); transition: transform 200ms ease; }
      .toggle-dot-on{ transform: translateX(24px); background: rgba(0,168,224,0.95); }

      .tiles{ display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; }
      .tile2{ border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; cursor:pointer; display:flex; flex-direction:column; gap:10px; color: var(--text); }
      .tile2-on{ background: rgba(0,168,224,0.14); outline: 2px solid rgba(0,168,224,0.22); }
      .tile2ic{ width:34px; height:34px; border-radius:16px; border:1px solid var(--stroke); display:flex; align-items:center; justify-content:center; background: rgba(0,168,224,0.12); }
      .tile2txt{ font-weight:1000; font-size:12px; }

      .list{ margin-top:10px; display:flex; flex-direction:column; gap:10px; }
      .listrow{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-radius:18px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); cursor:pointer; }
      .listleft{ min-width:0; }
      .listtitle{ font-weight:1000; font-size:12px; }
      .listsub{ margin-top:4px; font-size:11px; color: var(--muted); }

      /* Schedule (timeline) */
      .schedTop{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; padding:12px; border-radius:18px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); }
      .schedNowLbl{ font-weight:1000; font-size:11px; color: var(--muted); }
      .schedNowVal{ font-weight:1000; font-size:16px; letter-spacing:-0.02em; margin-top:4px; }
      .schedNowSub{ margin-top:6px; font-size:11px; color: var(--muted); line-height:1.3; }
      .schedPills{ display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
      .timeline2{ position:relative; margin-top:12px; display:flex; flex-direction:column; gap:12px; }
      .tline{ position:absolute; left: 16px; top: 6px; bottom: 6px; width: 2px; background: rgba(0,168,224,0.18); border-radius:999px; }
      .ev{ display:flex; gap:12px; }
      .dotTime{ width: 100px; display:flex; align-items:flex-start; gap:10px; }
      .dotTime .dot{ width:10px; height:10px; border-radius:999px; background: rgba(0,168,224,0.50); box-shadow: 0 0 0 6px rgba(0,168,224,0.14); margin-top: 8px; }
      .dotTime-live .dot{ background: rgba(0,168,224,0.95); box-shadow: 0 0 0 8px rgba(0,168,224,0.18); }
      .dotTime-warn .dot{ background: rgba(245,158,11,0.95); box-shadow: 0 0 0 8px rgba(245,158,11,0.18); }
      .timeCol{ display:flex; flex-direction:column; }
      .timeTop{ font-weight:1000; font-size:11px; }
      .timeBot{ margin-top:4px; font-weight:900; font-size:11px; color: var(--muted); }
      .evCard{ flex:1; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; }
      .evRow{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
      .evTitle{ font-weight:1000; font-size:12px; }
      .evSub{ margin-top:4px; font-size:11px; color: var(--muted); }
      .evMeta{ margin-top:6px; font-size:11px; color: rgba(0,168,224,0.95); font-weight:800; }
      .evActions{ margin-top:10px; display:flex; gap:10px; }
      .evActions .btn{ flex:1; justify-content:center; }
      .gapCard{ margin-left: 112px; border:1px solid var(--stroke); background: rgba(0,168,224,0.10); border-radius:18px; padding:12px; }
      .gapRow{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .gapTitle{ font-weight:1000; font-size:12px; }
      .gapSub{ margin-top:6px; font-size:11px; color: var(--muted); line-height:1.3; }

      /* Profile */
      .prefblock{ margin-top:12px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; }
      .prefh{ font-weight:1000; font-size:12px; margin-bottom:10px; }
      .plist{ display:flex; flex-direction:column; gap:10px; }
      .prow{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-radius:16px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); cursor:pointer; color: var(--text); }
      .prow-on{ background: rgba(0,168,224,0.14); outline:2px solid rgba(0,168,224,0.22); }
      .prow-left{ min-width:0; }
      .prow-title{ font-weight:1000; font-size:12px; }
      .prow-sub{ margin-top:4px; font-size:11px; color: var(--muted); line-height:1.25; }
      .muted{ color: var(--muted); }

      .slider{ margin-top:12px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; }
      .slider-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .slider-title{ font-weight:1000; font-size:12px; }
      .slider-sub{ margin-top:8px; font-size:11px; color: var(--muted); }
      .range{ width:100%; margin-top:10px; }
      .select{ width:100%; border-radius:14px; padding:10px 12px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); color: var(--text); font-weight:900; }

      /* Admin */
      .mini-grid-3{ display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-top:10px; }
      .mini{ display:flex; align-items:center; gap:10px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; }
      .mini-ic{ width:34px; height:34px; border-radius:16px; display:flex; align-items:center; justify-content:center; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); }
      .mini-cyan{ background: rgba(0,168,224,0.16); }
      .mini-navy{ background: rgba(0,51,102,0.18); }
      .mini-ok{ background: rgba(16,185,129,0.16); }
      .mini-warn{ background: rgba(245,158,11,0.16); }
      .mini-bad{ background: rgba(244,63,94,0.16); }
      .mini-val{ font-weight:1000; font-size:13px; }
      .mini-lbl{ margin-top:3px; font-size:10px; color: var(--muted); font-weight:900; }

      .admin-card{ margin-top:12px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; }
      .admin-h{ font-weight:1000; font-size:12px; }
      .admin-sub{ margin-top:4px; font-size:11px; color: var(--muted); }
      .heatmap{ margin-top:12px; display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; }
      .tile{ border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; }
      .tile-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .tile-lbl{ font-weight:1000; font-size:11px; color: var(--muted); }
      .tile-bar{ margin-top:10px; height:10px; border-radius:999px; background: rgba(255,255,255,0.10); overflow:hidden; border:1px solid var(--stroke); }
      .tile-fill{ height:100%; border-radius:999px; }
      .tile-sub{ margin-top:8px; font-size:10px; color: var(--muted); font-weight:900; }

      .heatrow{ margin-top:12px; }
      .heatrow-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .heatrow-lbl{ font-weight:1000; font-size:11px; color: var(--muted); }
      .heatrow-val{ font-weight:1000; font-size:12px; }
      .heatbar{ margin-top:8px; height:10px; border-radius:999px; background: rgba(255,255,255,0.10); overflow:hidden; border:1px solid var(--stroke); }
      .heatfill{ height:100%; border-radius:999px; }

      /* Work mode bar */
      .modebar{ margin-top:10px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; }
      .mode-title{ font-weight:1000; font-size:12px; }
      .modechips{ display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
      .modechip{ border:1px solid var(--stroke); background: rgba(255,255,255,0.08); color: var(--muted); font-weight:1000; font-size:11px; padding:6px 10px; border-radius:999px; cursor:pointer; }
      .modechip-on{ background: rgba(0,168,224,0.16); color: var(--text); }

      .map{
  position:relative;
  width:100%;
  aspect-ratio: 10/9;
  border-radius:22px;
  overflow:hidden;
  border:1px solid var(--stroke);
  background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
}
.map-grid{ position:absolute; inset:0; opacity:0.55;
        background-image:
          linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px);
        background-size: 26px 26px; }
      .map-overlay{ position:absolute; inset:0; }
      .heat{ position:absolute; width:180px; height:180px; transform: translate(-50%, -50%); pointer-events:none; }
      .route{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
      .garage{ position:absolute; transform: translate(-50%, -50%); display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; border:1px solid var(--stroke);
               background: rgba(0,51,102,0.14); }
      .garage-dot{ width:9px; height:9px; border-radius:999px; }
      .garage-lbl{ font-size:11px; font-weight:1000; }
      .bldg{ position:absolute; transform: translate(-50%, -50%); width:38px; height:38px; border-radius:18px; display:flex; align-items:center; justify-content:center;
             font-weight:1000; border:1px solid var(--stroke); background: rgba(0,51,102,0.18); }
      .pin{ position:absolute; transform: translate(-50%, -50%); display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:999px; border:1px solid var(--stroke);
            background: rgba(255,255,255,0.12); color: var(--text); cursor:pointer; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
      .pin-mini{ padding:6px; gap:0; }
      .pin-on{ outline: 2px solid rgba(0,168,224,0.45); background: rgba(255,255,255,0.16); }
      .pin-dot{ width:10px; height:10px; border-radius:999px; box-shadow: 0 0 18px rgba(0,168,224,0.18); }
      .pin-dot-on{ box-shadow: 0 0 26px rgba(0,168,224,0.28); }
      .pin-ttl{ font-size:11px; font-weight:1000; max-width: 130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .mapDetail{ margin-top: 10px; }
      .me{ position:absolute; transform: translate(-50%, -50%); display:flex; flex-direction:column; align-items:center; gap:6px; }
      .me-dot{ width:12px; height:12px; border-radius:999px; background: rgba(0,168,224,0.95); box-shadow: 0 0 0 8px rgba(0,168,224,0.18); }
      .me-tag{ font-size:10px; font-weight:1000; color: var(--muted); }
      .escort{ position:absolute; transform: translate(-50%, -50%); pointer-events:none; }
      .escort-ring{ width:220px; height:220px; border-radius:999px; border: 2px solid rgba(0,168,224,0.34); box-shadow: 0 0 28px rgba(0,168,224,0.18);
                    animation: pulse 1.6s ease-out infinite; }
      .ring2{ width:320px; height:320px; position:absolute; left:50%; top:50%; transform: translate(-50%, -50%);
              border-color: rgba(0,168,224,0.18); animation-delay: 0.55s; }
      @keyframes pulse{ 0%{ transform: scale(0.88); opacity: 0.75; } 65%{ transform: scale(1.02); opacity: 0.28; } 100%{ transform: scale(1.08); opacity: 0.0; } }
      .map-legend{ position:absolute; left:10px; top:10px; display:flex; gap:8px; flex-wrap:wrap; }

      .nav{ position: absolute; left: 50%; bottom: calc(10px + env(safe-area-inset-bottom)); transform: translateX(-50%); width: calc(100% - 28px); max-width: 100%; display:grid; gap: 8px; padding: 10px;
            border-radius: 22px; background: rgba(255,255,255,0.16); border: 1px solid var(--stroke); box-shadow: var(--shadow); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
      .nav6{ grid-template-columns: repeat(6, 1fr); }
      .navbtn{ border:0; background: transparent; color: var(--muted); cursor:pointer; padding: 10px 6px; border-radius: 18px; display:flex; flex-direction:column; align-items:center; gap:6px; font-weight:1000; font-size:10px; }
      .navon{ color: var(--text); background: rgba(0,168,224,0.14); }
      .navic{ display:flex; align-items:center; justify-content:center; }
      .navic-on{ color: rgba(0,168,224,0.95); }
      .navlbl{ line-height:1; }

      .fab{ position:absolute; right: 18px; bottom: calc(96px + env(safe-area-inset-bottom)); width: 52px; height: 52px; border-radius: 18px; border: 1px solid var(--stroke); background: rgba(0,51,102,0.18); color: var(--text); display:flex; align-items:center; justify-content:center; box-shadow: var(--shadow); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); cursor:pointer; }
      .fab-on{ background: rgba(0,168,224,0.18); outline: 2px solid rgba(0,168,224,0.22); }

      .sheetOverlay{ position:absolute; inset:0; z-index: 50; display:flex; align-items:flex-end; justify-content:center; }
      .sheetBackdrop{ position:absolute; inset:0; background: rgba(2,6,23,0.45); border:0; }
      .sheet{ width: calc(100% - 16px); max-width: 420px; margin: 0 auto 12px; border-radius: 24px; border: 1px solid var(--stroke);
              background: var(--card); box-shadow: var(--shadow); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); overflow:hidden; }
      .sheetHd{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; padding: 14px 14px 10px; }
      .sheetHdTitle{ font-weight:1000; font-size:13px; }
      .sheetHdSub{ margin-top:4px; font-size:11px; color: var(--muted); }
      .sheetClose{ width:38px; height:38px; border-radius: 14px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); color: var(--text); display:flex; align-items:center; justify-content:center; cursor:pointer; }
      .sheetBody{ padding: 0 14px 14px; display:flex; flex-direction:column; gap:10px; }
      .sheetRow{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-radius:18px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); }
      .sheetLeft{ min-width:0; }
      .sheetTitle{ font-weight:1000; font-size:12px; }
      .sheetSub{ margin-top:4px; font-size:11px; color: var(--muted); }
      .sheetActions{ display:flex; gap:10px; }
      .sheetActions .btn{ flex:1; justify-content:center; }
      .field{ display:flex; flex-direction:column; gap:8px; }
      .fieldLbl{ font-weight:1000; font-size:12px; }
      .textarea{ width:100%; border-radius: 14px; padding: 10px 12px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); color: var(--text); font-weight:800; resize:none; }

      @media (prefers-reduced-motion: reduce){ .escort-ring{ animation: none; } }
    `}</style>
  );
}
