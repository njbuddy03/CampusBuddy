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
  BarChart3,
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

type ToastState = null | { title: string; body: string };
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
  socialInsights: boolean;
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
  { id: "w7", name: "AI Viz bench", bldg: "B", modeFit: ["Focus", "Collaboration"], quiet: 66, hasWhiteboard: true, hasDualMonitors: true, availableUntil: "10:10" },
  { id: "w8", name: "Library pods", bldg: "A", modeFit: ["Focus"], quiet: 95, hasWhiteboard: false, hasDualMonitors: true, availableUntil: "11:00" },
  { id: "w9", name: "Huddle ring", bldg: "C", modeFit: ["Collaboration"], quiet: 48, hasWhiteboard: true, hasDualMonitors: false, availableUntil: "10:45" },
  { id: "w10", name: "Low-stimulus nook", bldg: "A", modeFit: ["Recharge", "Call"], quiet: 90, hasWhiteboard: false, hasDualMonitors: false, availableUntil: "12:30" },
];

const AMENITIES: Amenity[] = [
  { id: "a1", name: "Building B Cafe", kind: "coffee", bldg: "B", waitMins: 4, open: true },
  { id: "a2", name: "Sky Lounge espresso", kind: "coffee", bldg: "A", waitMins: 2, open: true },
  { id: "a3", name: "Legacy tacos", kind: "lunch", bldg: "B", waitMins: 7, open: true },
  { id: "a4", name: "Protein bowl bar", kind: "breakfast", bldg: "B", waitMins: 6, open: true },
  { id: "a5", name: "Nature trail", kind: "wellness", bldg: "A", waitMins: 0, open: true },
  { id: "a6", name: "Hydration bar", kind: "wellness", bldg: "B", waitMins: 1, open: true },
  { id: "a7", name: "Smart salad lab", kind: "lunch", bldg: "A", waitMins: 5, open: true },
  { id: "a8", name: "Protein espresso", kind: "coffee", bldg: "C", waitMins: 3, open: true },
  { id: "a9", name: "Grab-and-go breakfast", kind: "breakfast", bldg: "A", waitMins: 2, open: true },
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
      const availabilityPct = (g.available / g.total) * 100;
      const evBoost = prefs.needsEV ? g.evAvailable * 1.2 : 0;
      const accBoost = prefs.accessibility ? g.accessibleAvailable * 1.6 : 0;
      const score = availabilityPct * 0.7 + evBoost + accBoost - walk * 8;
      const whyParts = [
        `Closest to Building ${nextBldg} (${walk} min)`,
        `${g.available} spots`,
        prefs.needsEV ? `EV ${g.evAvailable}` : null,
        prefs.accessibility ? `Accessible ${g.accessibleAvailable}` : null,
      ].filter(Boolean);
      return { garage: g, score, walk, why: whyParts.join(" • ") };
    })
    .sort((a, b) => b.score - a.score);
}

function rankWorkspaces(args: { workspaces: Workspace[]; mode: WorkMode; prefs: Preferences; nextBldg: BuildingCode }) {
  const { workspaces, mode, prefs, nextBldg } = args;
  return [...workspaces]
    .map((w) => {
      const modeFit = w.modeFit.includes(mode) ? 1 : 0;
      const quietBoost = (prefs.quietPreference || prefs.lowStimulus) ? w.quiet * 0.6 : w.quiet * 0.25;
      const nearBoost = w.bldg === nextBldg ? 18 : 0;
      const featuresBoost = (w.hasDualMonitors ? 6 : 0) + (w.hasWhiteboard && mode === "Collaboration" ? 8 : 0);
      const score = modeFit * 40 + quietBoost + nearBoost + featuresBoost;
      const whyParts = [
        modeFit ? `${mode} match` : "Alternate",
        w.bldg === nextBldg ? "Near meeting" : null,
        (prefs.quietPreference || prefs.lowStimulus) ? `Quiet ${w.quiet}/100` : null,
        w.hasDualMonitors ? "Dual monitors" : null,
        w.hasWhiteboard ? "Whiteboard" : null,
      ].filter(Boolean);
      return { workspace: w, score, why: whyParts.join(" • ") };
    })
    .sort((a, b) => b.score - a.score);
}

function pickAmenity(kind: Amenity["kind"], preferredBldg?: BuildingCode) {
  return [...AMENITIES]
    .filter((a) => a.kind === kind && a.open)
    .sort((a, b) => {
      const aNear = preferredBldg && a.bldg === preferredBldg ? -1 : 0;
      const bNear = preferredBldg && b.bldg === preferredBldg ? -1 : 0;
      if (aNear !== bNear) return aNear - bNear;
      return a.waitMins - b.waitMins;
    })[0];
}

function HomeTab(props: {
  scenario: ScenarioState;
  scenarioKey: ScenarioKey;
  onScenario: (k: ScenarioKey) => void;
  onReportIssue: () => void;
  onAction: (title: string, body: string) => void;
  socialOn: boolean;
  arrivalStaged: boolean;
  onStartArrival: () => void;
  workMode: WorkMode;
  onWorkMode: (m: WorkMode) => void;
  onGoExplore: () => void;
  onGoMap: () => void;
  onGoSchedule: () => void;
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
    onReportIssue,
    onAction,
    socialOn,
    arrivalStaged,
    onStartArrival,
    workMode,
    onWorkMode,
    onGoExplore,
    onGoMap,
    onGoSchedule,
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

  const [showWhy, setShowWhy] = useState(false);

  const arrivalMode = scenario.employeeState === "driving";
  const onCampusMode = scenario.employeeState === "in-building";
  const freeTimeMode = scenario.key === "s2";
  const dayPlanMode = scenario.key === "s4";
  const discoveryMode = scenario.discoveryMode;

  const minutesToMeeting = upcoming ? Math.max(0, diffMins(now, upcoming.start)) : 999;
  const foodPick = freeTimeMode ? coffee : arrivalMode ? (breakfast ?? coffee) : lunch ?? coffee;
  const foodLabel = freeTimeMode ? "Coffee" : arrivalMode ? "Breakfast" : "Food";

  return (
    <div className="stack">
      <Card>
        <div className="pad" style={{ paddingTop: 14 }}>
          <div className="home-top">
            <div>
              <div className="hello">Good morning, John.</div>
              <div className="hello-sub">{scenario.subtitle}</div>
              <div className="statePills">
                <IconBadge tone={scenario.employeeState === "driving" ? "cyan" : "neutral"} text="Driving" />
                <IconBadge tone={scenario.employeeState === "parked" ? "cyan" : "neutral"} text="Parked" />
                <IconBadge tone={scenario.employeeState === "in-building" ? "cyan" : "neutral"} text="On campus" />
              </div>
            </div>
          </div>

          {scenario.key === "s1" && arrivalMode ? (
            <div className="glassline" style={{ marginTop: 10 }}>
              <div className="glass-ic"><Sparkles size={16} /></div>
              <div className="glass-txt">
                <div className="glass-title">One-tap day start</div>
                <div className="glass-sub">Confirm parking, hold a workspace, set the route, and queue coffee.</div>
                <div className="glass-sub2">{arrivalStaged ? "Staged. You’re ready to step out of the car." : "Ready when you are."}</div>
              </div>
              <Button
                variant={arrivalStaged ? "secondary" : "primary"}
                left={<ChevronRight size={16} />}
                onClick={() => {
                  onStartArrival();
                  onAction(
                    "Arrival staged",
                    "Mock: parking confirmed, workspace held, route queued, and coffee added. Future: reservations + badge + payment."
                  );
                }}
              >
                {arrivalStaged ? "Staged" : "Start"}
              </Button>
            </div>
          ) : null}

          {socialOn && (freeTimeMode || onCampusMode) ? (
            <div className="glassline" style={{ marginTop: 10 }}>
              <div className="glass-ic"><User size={16} /></div>
              <div className="glass-txt">
                <div className="glass-title">Social insight</div>
                <div className="glass-sub">Sarah (Mentor) is at The Grove.</div>
                <div className="glass-sub2">15-minute coffee catch-up fits your window.</div>
              </div>
              <Button
                variant="secondary"
                left={<Coffee size={16} />}
                onClick={() => onAction("Invite sent", "Mock: invite sent. Future: availability + auto-booking.")}
              >
                Invite
              </Button>
            </div>
          ) : null}

          {scenario.key === "s3" ? (
            <div className="modebar">
              <div className="mode-title">Work mode</div>
              <div className="modechips">
                {(["Focus", "Collaboration", "Call", "Recharge"] as WorkMode[]).map((m) => (
                  <button
                    key={m}
                    className={cx("modechip", m === workMode && "modechip-on")}
                    onClick={() => {
                      onWorkMode(m);
                      onAction("Work mode", `Mock: switching to ${m} and re-ranking workspaces.`);
                    }}
                    type="button"
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="hint">Workspace ranking updates immediately.</div>
            </div>
          ) : null}

          {discoveryMode ? (
            <>
              <div className="glassline" style={{ marginTop: 10 }}>
                <div className="glass-ic"><Compass size={16} /></div>
                <div className="glass-txt">
                  <div className="glass-title">Discovery</div>
                  <div className="glass-sub">15-minute mini tours for productivity, wellness, food, and innovation.</div>
                  <div className="glass-sub2">Start with one tap.</div>
                </div>
                <Button
                  variant="secondary"
                  left={<ChevronRight size={16} />}
                  onClick={() => {
                    onGoExplore();
                    onAction("Discovery", "Mock: starting a guided campus tour. Future: indoor wayfinding + narration.");
                  }}
                >
                  Start
                </Button>
              </div>

              <div className="checklist">
                <div className="check-h">First week checklist</div>
                <div className="check-item"><span className="check-dot" />Set preferences</div>
                <div className="check-item"><span className="check-dot" />Find 3 quiet focus spaces</div>
                <div className="check-item"><span className="check-dot" />Pick a go-to coffee spot</div>
                <div className="check-item"><span className="check-dot" />Take a 10-minute campus loop</div>
              </div>
            </>
          ) : null}

          <div className="grid2" style={{ marginTop: 10 }}>
            {arrivalMode ? (
              <>
                <div className="glassline">
                  <div className="glass-ic"><Car size={16} /></div>
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
                  <Button
                    variant="secondary"
                    left={<Navigation size={16} />}
                    onClick={() => {
                      onGoMap();
                      onAction("Route prepared", "Mock: routing to next stop. Future: turn-by-turn + accessibility.");
                    }}
                  >
                    Route
                  </Button>
                </div>

                {backupGarage ? (
                  <div className="glassline">
                    <div className="glass-ic"><Shield size={16} /></div>
                    <div className="glass-txt">
                      <div className="glass-title">Alternate</div>
                      <div className="glass-sub">{backupGarage.garage.name} • {backupGarage.garage.available} spots • {backupGarage.walk} min</div>
                      <div className="glass-sub2">{backupGarage.why}</div>
                    </div>
                    <Button
                      variant="secondary"
                      left={<ChevronRight size={16} />}
                      onClick={() => {
                        onGoMap();
                        onAction("Alternate selected", "Mock: switched to backup garage. Future: auto-reserve EV/accessible bay.");
                      }}
                    >
                      Use
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="glassline">
              <div className="glass-ic"><Building2 size={16} /></div>
              <div className="glass-txt">
                <div className="glass-title">Workspace</div>
                <div className="glass-sub">
                  {recommendedWorkspace && recommendedGarage
                    ? `${recommendedWorkspace.workspace.name} • Building ${recommendedWorkspace.workspace.bldg} • ${recommendedWorkspace.walkFromGarage} min walk • air good`
                    : "No workspace available"}
                </div>
                <div className="glass-sub2">{recommendedWorkspace ? recommendedWorkspace.why : ""}</div>
              </div>
              <Button
                variant="secondary"
                left={<ChevronRight size={16} />}
                onClick={() => onAction("Workspace held", "Mock: workspace held. Future: reservations + badge access.")}
              >
                Hold
              </Button>
            </div>

            <div className="glassline">
              <div className="glass-ic"><Calendar size={16} /></div>
              <div className="glass-txt">
                <div className="glass-title">Next meeting</div>
                <div className="glass-sub">
                  {upcoming
                    ? `${upcoming.title} • ${formatTime(upcoming.start)} • Building ${upcoming.bldg}${upcoming.room ? ` • ${upcoming.room}` : ""}`
                    : "No remaining meetings"}
                </div>
                <div className="glass-sub2">{upcoming ? `Leave in ${Math.max(0, minutesToMeeting - 6)} min` : ""}</div>
              </div>
              <Button
                variant="secondary"
                left={<ChevronRight size={16} />}
                onClick={() => {
                  onGoSchedule();
                  onAction("Schedule", "Mock: opening timeline with leave-time nudges.");
                }}
              >
                View
              </Button>
            </div>

            <div className="glassline">
              <div className="glass-ic">{foodLabel === "Coffee" ? <Coffee size={16} /> : foodLabel === "Breakfast" ? <Timer size={16} /> : <Coffee size={16} />}</div>
              <div className="glass-txt">
                <div className="glass-title">{foodLabel}</div>
                <div className="glass-sub">{foodPick ? `${foodPick.name} • wait ${foodPick.waitMins} min` : ""}</div>
                <div className="glass-sub2">
                  {freeTimeMode ? "Fits your time window." : foodPick && foodPick.waitMins >= 6 ? "Forecast: wait may spike soon." : "Low wait, near next stop."}
                </div>
              </div>
              <Button
                variant="secondary"
                left={<Bell size={16} />}
                onClick={() => onAction("Order placed", "Mock: order queued. Future: payment + pickup QR.")}
              >
                Order
              </Button>
            </div>

            {freeTimeMode && wellness ? (
              <div className="glassline">
                <div className="glass-ic"><Heart size={16} /></div>
                <div className="glass-txt">
                  <div className="glass-title">Wellness</div>
                  <div className="glass-sub">{wellness.name} • 8-minute reset</div>
                  <div className="glass-sub2">Time-optimized.</div>
                </div>
                <Button
                  variant="secondary"
                  left={<ChevronRight size={16} />}
                  onClick={() => {
                    onGoMap();
                    onAction("Wellness route", "Mock: routing to wellness. Future: occupancy + coach mode.");
                  }}
                >
                  Go
                </Button>
              </div>
            ) : null}

            {dayPlanMode ? (
              <div className="glassline">
                <div className="glass-ic"><Briefcase size={16} /></div>
                <div className="glass-txt">
                  <div className="glass-title">Day plan</div>
                  <div className="glass-sub">Meetings + free windows + stops.</div>
                  <div className="glass-sub2">One timeline.</div>
                </div>
                <Button
                  variant="secondary"
                  left={<ChevronRight size={16} />}
                  onClick={() => {
                    onGoSchedule();
                    onAction("Day plan", "Mock: opening day orchestration view.");
                  }}
                >
                  Open
                </Button>
              </div>
            ) : null}
          </div>

          <div className="whyBlock">
            <button className="whyBtn" onClick={() => setShowWhy((v) => !v)} type="button">
              <span className="whyTitle">Why these recommendations</span>
              <ChevronRight size={16} className={cx("whyArrow", showWhy && "whyArrowOn")} />
            </button>
            {showWhy ? (
              <div className="whyPanel">
                <div className="whyLine"><span className="whyKey">Inputs</span> Calendar • Occupancy • Preferences • Walking tolerance</div>
                <div className="whyLine"><span className="whyKey">Context</span> {scenario.employeeState} • {formatTime(now)}</div>
                <div className="whyLine"><span className="whyKey">Priority</span> {arrivalMode ? "Parking → Workspace → Meeting → Food" : freeTimeMode ? "Time-fit suggestions" : "Next best actions"}</div>
              </div>
            ) : null}
          </div>

          <div className="scenarioFooter">
            <div className="scenarioLabel">Scenario</div>
            <ScenarioPicker value={scenarioKey} onChange={onScenario} />
          </div>

          <div className="row3" style={{ marginTop: 12 }}>
            <Button variant="secondary" left={<MessageSquare size={16} />} onClick={() => {
              onReportIssue();
              onAction("Report issue", "Mock: issue form opens. Future: auto-location + photo + routing to facilities/security.");
            }}>Report issue</Button>
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
  accessibleOn,
  selectedPoi,
  onSelectPoi,
  route,
  scenarioKey,
  onScenario,
}: {
  securityMode: boolean;
  accessibleOn: boolean;
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
          <CampusMap securityMode={securityMode} accessibleOn={accessibleOn} selectedPoi={selectedPoi} onSelectPoi={onSelectPoi} route={route} />

          {poi ? (
            <div className="mapDetail">
              <div className="glassline">
                <div className="glass-ic">
                  {poi.kind === "food" ? <Coffee size={16} /> : poi.kind === "wellness" ? <Heart size={16} /> : <Building2 size={16} />}
                </div>
                <div className="glass-txt">
                  <div className="glass-title">{poi.name}</div>
                  <div className="glass-sub">Building {poi.bldg} • {poi.availability}% open • buzz {poi.buzz}/100</div>
                  <div className="glass-sub2">Indoor routing planned • Tap again to clear.</div>
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
  accessibleOn,
  selectedPoi,
  onSelectPoi,
  route,
}: {
  securityMode: boolean;
  accessibleOn: boolean;
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
        {accessibleOn ? <IconBadge tone="neutral" icon={<BadgeCheck size={14} />} text="Accessible route" /> : null}
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
            <Toggle label="Social insights" value={prefs.socialInsights} onChange={(v) => onPrefs({ ...prefs, socialInsights: v })} icon={<User size={16} />} />

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
  type AdminView = "overview" | "experience" | "space" | "network";
  type ExpSub = "friction" | "engagement" | "brand";
  const [view, setView] = useState<AdminView>("overview");
  const [expSub, setExpSub] = useState<ExpSub>("friction");

  const metrics = {
    energySavingsWk: 4200,
    minutesSavedDay: 18,
    employeesOnsite: 6200,

    parkingSearchDown: 70,
    waitDown: 35,
    onTimeStarts: 87,
    wayfinding: 92,
    routeSuccess: 92,
    noiseMatch: 88,
    workspaceMatch: 84,
    reservationAdoption: 68,
    badgeSuccess: 97,
    supportDeflection: 24,

    returnToCampus: 76,
    tourCompletion: 62,
    amenityNps: 48,
    wellnessOptIn: 64,
    eventsAttendance: 41,
    communityMoments: 3.8,

    recruitingLift: 12,
    offerAccept: 6.5,
    retentionLift: 3.2,
    visitorBriefings: 22,

    utilA: 64,
    utilB: 14,
    utilC: 78,
    roomAvailability: 74,
    deskMatch: 86,
    hvacEff: 12,
    incidentsWk: 2,

    latencyMs: 12,
    reliability: 99,
    sensorCoverage: 96,
    inferenceMs: 38,
    forecastAcc: 89,
    failureRate: 0.3,

    carbonAvoidedT: 410,
  };

  const annualizedEnergy = metrics.energySavingsWk * 52;
  const timeRecapturedWk = Math.round((metrics.minutesSavedDay * metrics.employeesOnsite * 5) / 60);
  const wowIndex = clamp(
    Math.round(
      metrics.returnToCampus * 0.35 +
        metrics.tourCompletion * 0.25 +
        (metrics.amenityNps + 100) * 0.2 +
        metrics.wellnessOptIn * 0.2
    ),
    0,
    100
  );

  const Metric = ({ label, value, note, tone, icon }: { label: string; value: string; note?: string; tone?: "cyan" | "navy" | "ok" | "warn" | "bad"; icon?: React.ReactNode }) => (
    <div className={cx("metric", tone && `metric-${tone}`)}>
      <div className="metricTop">
        {icon ? <div className="metricIc">{icon}</div> : null}
        <div className="metricVal">{value}</div>
      </div>
      <div className="metricLbl">{label}</div>
      {note ? <div className="metricNote">{note}</div> : null}
    </div>
  );

  const Section = ({ title, sub, right, children }: { title: string; sub: string; right?: React.ReactNode; children: React.ReactNode }) => (
    <div className="admin-card">
      <div className="admin-head">
        <div>
          <div className="admin-h">{title}</div>
          <div className="admin-sub">{sub}</div>
        </div>
        {right ? right : null}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );

  return (
    <div className="stack">
      <Card>
        <CardHeader title="Admin" subtitle="SVP dashboard" right={<IconBadge tone="cyan" icon={<BarChart3 size={14} />} text="ROI" />} />
        <div className="pad">
          <div className="adminSeg" role="tablist" aria-label="Admin views">
            <button type="button" className={cx("adminSegBtn", view === "overview" && "adminSegOn")} onClick={() => setView("overview")}>Overview</button>
            <button type="button" className={cx("adminSegBtn", view === "experience" && "adminSegOn")} onClick={() => setView("experience")}>Experience</button>
            <button type="button" className={cx("adminSegBtn", view === "space" && "adminSegOn")} onClick={() => setView("space")}>Space</button>
            <button type="button" className={cx("adminSegBtn", view === "network" && "adminSegOn")} onClick={() => setView("network")}>Network</button>
          </div>

          {view === "overview" ? (
            <>
              <div className="heroGrid">
                <div className="hero">
                  <div className="heroRow">
                    <div className="heroTitle">Annualized value</div>
                    <IconBadge tone="ok" icon={<Sparkles size={14} />} text="Mock" />
                  </div>
                  <div className="heroVal">${Math.round(annualizedEnergy / 1000)}M</div>
                  <div className="heroSub">Modeled energy optimization savings at ${metrics.energySavingsWk.toLocaleString()}/week.</div>
                </div>
                <div className="hero">
                  <div className="heroRow">
                    <div className="heroTitle">Time recaptured</div>
                    <IconBadge tone="cyan" icon={<Timer size={14} />} text="Hours" />
                  </div>
                  <div className="heroVal">{timeRecapturedWk.toLocaleString()}</div>
                  <div className="heroSub">Estimated hours/week saved across on-site employees.</div>
                </div>
              </div>

              <Section
                title="Campus wow factor"
                sub="Adoption signals that show the campus is working as an experience, not just a building (mock)."
                right={<IconBadge tone="navy" icon={<Sparkles size={14} />} text={`Wow ${wowIndex}`} />}
              >
                <div className="metricGrid">
                  <Metric label="Return-to-campus" value={`${metrics.returnToCampus}%`} note="Hybrid engagement" tone="cyan" icon={<User size={16} />} />
                  <Metric label="Tour completion" value={`${metrics.tourCompletion}%`} note="New hire flow" tone="navy" icon={<Compass size={16} />} />
                  <Metric label="Amenity NPS" value={`+${metrics.amenityNps}`} note="Daily delight" tone="ok" icon={<Coffee size={16} />} />
                  <Metric label="Wellness opt-in" value={`${metrics.wellnessOptIn}%`} note="Habit forming" tone="ok" icon={<Heart size={16} />} />
                  <Metric label="Community events" value={`${metrics.eventsAttendance}%`} note="Participation" tone="cyan" icon={<MessageSquare size={16} />} />
                  <Metric label="Moments shared" value={`${metrics.communityMoments}/wk`} note="Brand halo" tone="navy" icon={<Send size={16} />} />
                </div>
                <div className="admin-note">These signals correlate to higher on-site engagement and smoother hybrid days.</div>
              </Section>

              <Section
                title="Experience health"
                sub="Signals across arrival, navigation, and space matching (mock)."
                right={<IconBadge tone="cyan" icon={<BadgeCheck size={14} />} text="Stable" />}
              >
                <div className="metricGrid">
                  <Metric label="Parking search" value={`-${metrics.parkingSearchDown}%`} note="Less roaming" tone="cyan" icon={<Car size={16} />} />
                  <Metric label="Wait-time" value={`-${metrics.waitDown}%`} note="Forecasting" tone="navy" icon={<Coffee size={16} />} />
                  <Metric label="On-time starts" value={`${metrics.onTimeStarts}%`} note="Leave prompts" tone="cyan" icon={<Calendar size={16} />} />
                  <Metric label="Wayfinding" value={`${metrics.wayfinding}%`} note="Fewer wrong turns" tone="cyan" icon={<Navigation size={16} />} />
                  <Metric label="Workspace match" value={`${metrics.workspaceMatch}%`} note="Mode fit" tone="ok" icon={<Building2 size={16} />} />
                  <Metric label="Reservations" value={`${metrics.reservationAdoption}%`} note="Adoption" tone="navy" icon={<BadgeCheck size={16} />} />
                </div>
              </Section>

              <Section
                title="Space health"
                sub="Utilization snapshot by building to target activation and investments (mock)."
                right={<IconBadge tone="neutral" icon={<Building2 size={14} />} text="Utilization" />}
              >
                <div className="heatmap" style={{ marginTop: 0 }}>
                  <HeatTile label="A" value={metrics.utilA} />
                  <HeatTile label="B" value={metrics.utilB} />
                  <HeatTile label="C" value={metrics.utilC} />
                </div>
              </Section>
            </>
          ) : null}

          {view === "experience" ? (
            <>
              <div className="subSeg" role="tablist" aria-label="Experience views">
                <button type="button" className={cx("subSegBtn", expSub === "friction" && "subSegOn")} onClick={() => setExpSub("friction")}>Friction</button>
                <button type="button" className={cx("subSegBtn", expSub === "engagement" && "subSegOn")} onClick={() => setExpSub("engagement")}>Engagement</button>
                <button type="button" className={cx("subSegBtn", expSub === "brand" && "subSegOn")} onClick={() => setExpSub("brand")}>Brand</button>
              </div>

              {expSub === "friction" ? (
                <>
                  <Section
                    title="Arrival + transitions"
                    sub="Outcome metrics tied to parking guidance, routing, and space matching (mock)."
                    right={<IconBadge tone="cyan" icon={<Sparkles size={14} />} text="Live" />}
                  >
                    <div className="metricGrid">
                      <Metric label="Parking search" value={`-${metrics.parkingSearchDown}%`} note="Reduced roaming" tone="cyan" icon={<Car size={16} />} />
                      <Metric label="Wait-time" value={`-${metrics.waitDown}%`} note="Forecasting" tone="navy" icon={<Coffee size={16} />} />
                      <Metric label="Route success" value={`${metrics.routeSuccess}%`} note="Correct arrival" tone="ok" icon={<Navigation size={16} />} />
                      <Metric label="Badge success" value={`${metrics.badgeSuccess}%`} note="Faster entry" tone="ok" icon={<BadgeCheck size={16} />} />
                      <Metric label="Workspace match" value={`${metrics.workspaceMatch}%`} note="Mode + quiet" tone="ok" icon={<Building2 size={16} />} />
                      <Metric label="Support deflection" value={`${metrics.supportDeflection}%`} note="Less friction" tone="warn" icon={<MessageSquare size={16} />} />
                    </div>
                  </Section>

                  <Section
                    title="Accessibility and safety"
                    sub="Inclusive routing plus fast support and escort response (mock)."
                    right={<IconBadge tone="neutral" icon={<Shield size={14} />} text="Safety" />}
                  >
                    <div className="metricGrid">
                      <Metric label="Accessible routes" value="96%" note="Coverage" tone="ok" icon={<BadgeCheck size={16} />} />
                      <Metric label="Low-stimulus" value="28%" note="Opt-in" tone="cyan" icon={<Heart size={16} />} />
                      <Metric label="EV success" value="91%" note="Find a bay" tone="navy" icon={<Car size={16} />} />
                      <Metric label="Safety response" value="3.2m" note="Escort" tone="navy" icon={<Shield size={16} />} />
                      <Metric label="Issue resolution" value="12m" note="Facilities" tone="cyan" icon={<MessageSquare size={16} />} />
                      <Metric label="Assist requests" value="0.4/day" note="Help needed" tone="warn" icon={<Phone size={16} />} />
                    </div>
                  </Section>
                </>
              ) : null}

              {expSub === "engagement" ? (
                <>
                  <Section
                    title="Engagement"
                    sub="Signals that predict sustained on-site adoption and productivity (mock)."
                    right={<IconBadge tone="navy" icon={<User size={14} />} text="People" />}
                  >
                    <div className="metricGrid">
                      <Metric label="Return-to-campus" value={`${metrics.returnToCampus}%`} note="Hybrid pull" tone="cyan" icon={<User size={16} />} />
                      <Metric label="Tour completion" value={`${metrics.tourCompletion}%`} note="Onboarding" tone="navy" icon={<Compass size={16} />} />
                      <Metric label="Wellness opt-in" value={`${metrics.wellnessOptIn}%`} note="Habit forming" tone="ok" icon={<Heart size={16} />} />
                      <Metric label="Community events" value={`${metrics.eventsAttendance}%`} note="Belonging" tone="cyan" icon={<MessageSquare size={16} />} />
                      <Metric label="Reservations" value={`${metrics.reservationAdoption}%`} note="Daily use" tone="navy" icon={<BadgeCheck size={16} />} />
                      <Metric label="Noise match" value={`${metrics.noiseMatch}%`} note="Focus" tone="ok" icon={<Activity size={16} />} />
                    </div>
                  </Section>

                  <Section
                    title="Sustainability"
                    sub="Experience-led optimization outcomes (mock)."
                    right={<IconBadge tone="ok" icon={<Flame size={14} />} text="ESG" />}
                  >
                    <div className="metricGrid">
                      <Metric label="Carbon avoided" value={`${metrics.carbonAvoidedT}t`} note="Annual" tone="ok" icon={<Flame size={16} />} />
                      <Metric label="HVAC efficiency" value={`+${metrics.hvacEff}%`} note="Smart zones" tone="ok" icon={<Sparkles size={16} />} />
                      <Metric label="Energy savings" value={`$${metrics.energySavingsWk.toLocaleString()}/wk`} note="Modeled" tone="warn" icon={<Sparkles size={16} />} />
                      <Metric label="Sensor coverage" value={`${metrics.sensorCoverage}%`} note="Live ops" tone="cyan" icon={<Radar size={16} />} />
                      <Metric label="Utilization lift" value="+9%" note="Activation" tone="cyan" icon={<Building2 size={16} />} />
                      <Metric label="Waste diversion" value="34%" note="Food ops" tone="navy" icon={<Coffee size={16} />} />
                    </div>
                  </Section>
                </>
              ) : null}

              {expSub === "brand" ? (
                <>
                  <Section
                    title="Talent and brand halo"
                    sub="How the campus experience supports recruiting, retention, and client perception (mock)."
                    right={<IconBadge tone="navy" icon={<Sparkles size={14} />} text="Halo" />}
                  >
                    <div className="metricGrid">
                      <Metric label="Recruiting lift" value={`+${metrics.recruitingLift}%`} note="Attraction" tone="cyan" icon={<User size={16} />} />
                      <Metric label="Offer accept" value={`+${metrics.offerAccept}%`} note="Conversion" tone="ok" icon={<BadgeCheck size={16} />} />
                      <Metric label="Retention lift" value={`+${metrics.retentionLift}%`} note="12-month" tone="ok" icon={<Heart size={16} />} />
                      <Metric label="Visitor briefings" value={`${metrics.visitorBriefings}/wk`} note="Exec demos" tone="navy" icon={<Briefcase size={16} />} />
                      <Metric label="Amenity NPS" value={`+${metrics.amenityNps}`} note="Daily delight" tone="ok" icon={<Coffee size={16} />} />
                      <Metric label="Moments shared" value={`${metrics.communityMoments}/wk`} note="Social proof" tone="navy" icon={<Send size={16} />} />
                    </div>
                  </Section>
                </>
              ) : null}
            </>
          ) : null}

          {view === "space" ? (
            <>
              <Section
                title="Utilization"
                sub="Where demand concentrates. Used to tune neighborhoods and staffing (mock)."
                right={<IconBadge tone="neutral" icon={<Building2 size={14} />} text="Live" />}
              >
                <div className="heatmap" style={{ marginTop: 0 }}>
                  <HeatTile label="A" value={metrics.utilA} />
                  <HeatTile label="B" value={metrics.utilB} />
                  <HeatTile label="C" value={metrics.utilC} />
                </div>
              </Section>

              <Section
                title="Operations"
                sub="Signals that keep the campus running smoothly (mock)."
                right={<IconBadge tone="cyan" icon={<Radar size={14} />} text="Ops" />}
              >
                <div className="metricGrid">
                  <Metric label="Desk match" value={`${metrics.deskMatch}%`} note="Right setup" tone="ok" icon={<Building2 size={16} />} />
                  <Metric label="Room availability" value={`${metrics.roomAvailability}%`} note="Bookable" tone="cyan" icon={<BadgeCheck size={16} />} />
                  <Metric label="Incidents" value={`${metrics.incidentsWk}/wk`} note="Reported" tone="warn" icon={<MessageSquare size={16} />} />
                  <Metric label="Resolution" value="42m" note="Median" tone="cyan" icon={<Timer size={16} />} />
                  <Metric label="Queue time" value="1.8m" note="Entry" tone="navy" icon={<Car size={16} />} />
                  <Metric label="Comfort" value="4.6/5" note="Thermal" tone="ok" icon={<Heart size={16} />} />
                </div>
              </Section>
            </>
          ) : null}

          {view === "network" ? (
            <>
              <Section
                title="Private 5G performance"
                sub="Supports routing, occupancy, reservations, and safety experiences (mock)."
                right={<IconBadge tone="navy" icon={<Wifi size={14} />} text="5G" />}
              >
                <div className="metricGrid">
                  <Metric label="Latency" value={`${metrics.latencyMs}ms`} note="P50" tone="cyan" icon={<Wifi size={16} />} />
                  <Metric label="Reliability" value={`${metrics.reliability}%`} note="7-day" tone="ok" icon={<BadgeCheck size={16} />} />
                  <Metric label="Sensor coverage" value={`${metrics.sensorCoverage}%`} note="Campus" tone="cyan" icon={<Radar size={16} />} />
                  <Metric label="Failures" value={`${metrics.failureRate}%`} note="Edge" tone="warn" icon={<Wifi size={16} />} />
                  <Metric label="Inference" value={`${metrics.inferenceMs}ms`} note="Realtime" tone="cyan" icon={<Timer size={16} />} />
                  <Metric label="Forecast" value={`${metrics.forecastAcc}%`} note="Accuracy" tone="ok" icon={<Radar size={16} />} />
                </div>
              </Section>

              <Section
                title="Edge services"
                sub="Real-time inference for crowd forecasting and wayfinding (mock)."
                right={<IconBadge tone="cyan" icon={<Sparkles size={14} />} text="Edge" />}
              >
                <div className="metricGrid">
                  <Metric label="Model refresh" value="2.5m" note="Cycle" tone="navy" icon={<Timer size={16} />} />
                  <Metric label="Rollback" value="Instant" note="Safety" tone="navy" icon={<Shield size={16} />} />
                  <Metric label="Cache hit" value="94%" note="Speed" tone="ok" icon={<Wifi size={16} />} />
                  <Metric label="Routes/day" value="18k" note="Scale" tone="cyan" icon={<Navigation size={16} />} />
                  <Metric label="Occupancy" value="Live" note="Sensors" tone="cyan" icon={<Radar size={16} />} />
                  <Metric label="Privacy" value="Policy" note="Governed" tone="ok" icon={<Shield size={16} />} />
                </div>
              </Section>
            </>
          ) : null}

          <div className="scenarioFooter">
            <div className="scenarioLabel">Scenario</div>
            <ScenarioPicker value={scenarioKey} onChange={onScenario} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function HeatTile({ label, value }: { label: string; value: number }) {
  const v = clamp(value, 0, 100);
  const tone = v < 25 ? "ok" : v < 70 ? "warn" : "bad";
  const note = v < 25 ? "Under-used" : v < 70 ? "Balanced" : "High demand";
  return (
    <div className="tile">
      <div className="tile-top">
        <div className="tile-lbl">Building {label}</div>
        <IconBadge tone={tone} text={`${v}%`} />
      </div>
      <div className="tile-bar">
        <div className="tile-fill" style={{ width: `${v}%`, background: pctColor(v) }} />
      </div>
      <div className="tile-sub">{note}</div>
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
    { key: "admin", label: "Admin", icon: <BarChart3 size={18} /> },
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
      :root { --navy: ${ATTNAVY}; --cyan: ${ATTCYAN}; --ok:#10B981; --warn:#F59E0B; --bad:#F43F5E; }
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

      .pulse{ width:100%; display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-start; margin-bottom:12px; }

      .main{ width:100%; flex:1; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling: touch; padding-bottom: calc(110px + env(safe-area-inset-bottom)); }
      .stack{ display:flex; flex-direction:column; gap:12px; }

      .card{ border-radius: 22px; background: var(--card); border: 1px solid var(--stroke); box-shadow: var(--shadow); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); overflow:hidden; }
      .card-hd{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:14px; }
      .card-title{ font-weight:1000; font-size:12px; letter-spacing:-0.01em; }
      .card-sub{ font-size:10.5px; color: var(--muted); margin-top:3px; line-height:1.2; }
      .pad{ padding: 0 14px 14px; }

      .badge{ display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border-radius:999px; font-size:10px; font-weight:900; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); max-width: 100%; min-width:0; white-space:nowrap; }
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
      .statePills{ margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; }

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
      .glass-title{ font-size:11px; font-weight:1000; letter-spacing:-0.01em; }
      .glass-sub{ font-size:10.5px; color: var(--muted); margin-top:2px; line-height:1.2; word-break: break-word; }
      .glass-sub2{ font-size:10px; color: rgba(0,168,224,0.95); margin-top:4px; font-weight:900; line-height:1.2; word-break: break-word; }

      .btn{ border:0; cursor:pointer; padding:10px 12px; border-radius:16px; font-weight:1000; font-size:12px; display:inline-flex; align-items:center; gap:8px; }
      .btn-ic{ display:inline-flex; }
      .btn-primary{ background: linear-gradient(135deg, rgba(0,168,224,0.95), rgba(0,51,102,0.95)); color:white; box-shadow: 0 10px 30px rgba(0,168,224,0.18); }
      .btn-secondary{ background: rgba(255,255,255,0.12); color: var(--text); border: 1px solid var(--stroke); }

      .row3{ display:flex; gap:10px; margin-top:10px; }
      .row3 .btn{ flex:1; justify-content:center; }
      .hint{ margin-top:10px; font-size:11px; color: var(--muted); }

      .whyBlock{ margin-top:12px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; overflow:hidden; }
      .whyBtn{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border:0; background: transparent; color: var(--text); cursor:pointer; font-weight:1000; }
      .whyTitle{ font-size:12px; }
      .whyArrow{ transition: transform 200ms ease; color: var(--muted); }
      .whyArrowOn{ transform: rotate(90deg); }
      .whyPanel{ padding: 0 12px 12px; display:flex; flex-direction:column; gap:8px; }
      .whyLine{ font-size:11px; color: var(--muted); font-weight:900; }
      .whyKey{ color: var(--text); margin-right:8px; }

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

      /* Home: work mode + onboarding */
      .modebar{ margin-top:10px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; }
      .mode-title{ font-weight:1000; font-size:12px; }
      .modechips{ display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
      .modechip{ border:1px solid var(--stroke); background: rgba(255,255,255,0.08); color: var(--muted); font-weight:1000; font-size:11px; padding:6px 10px; border-radius:999px; cursor:pointer; }
      .modechip-on{ background: rgba(0,168,224,0.16); color: var(--text); }

      .checklist{ margin-top:10px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; }
      .check-h{ font-weight:1000; font-size:12px; }
      .check-item{ margin-top:8px; display:flex; align-items:center; gap:10px; font-size:11px; color: var(--muted); font-weight:900; }
      .check-dot{ width:10px; height:10px; border-radius:999px; background: rgba(0,168,224,0.50); box-shadow: 0 0 0 6px rgba(0,168,224,0.12); }

      /* Schedule: restored timeline layout */
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

      /* Admin: tiles + heatmap restored */
      .heatmap{ margin-top:12px; display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:10px; width:100%; }
      .tile{ border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; min-width:0; overflow:hidden; }
      .tile-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; min-width:0; }
      .tile-lbl{ font-weight:1000; font-size:10px; color: var(--muted); min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .tile-bar{ margin-top:10px; height:10px; border-radius:999px; background: rgba(255,255,255,0.10); overflow:hidden; border:1px solid var(--stroke); }
      .tile-fill{ height:100%; border-radius:999px; }
      .tile-sub{ margin-top:8px; font-size:9.5px; color: var(--muted); font-weight:900; }

      .map{ position:relative; width:100%; aspect-ratio: 10/9; border-radius:22px; overflow:hidden; border:1px solid var(--stroke);
            background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06)); }
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
      .pin-ttl{ font-size:11px; font-weight:1000; max-width: 130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .me{ position:absolute; transform: translate(-50%, -50%); display:flex; flex-direction:column; align-items:center; gap:6px; }
      .me-dot{ width:12px; height:12px; border-radius:999px; background: rgba(0,168,224,0.95); box-shadow: 0 0 0 8px rgba(0,168,224,0.18); }
      .me-tag{ font-size:10px; font-weight:1000; color: var(--muted); }
      .escort{ position:absolute; transform: translate(-50%, -50%); pointer-events:none; }
      .escort-ring{ width:220px; height:220px; border-radius:999px; border: 2px solid rgba(0,168,224,0.34); box-shadow: 0 0 28px rgba(0,168,224,0.18); animation: pulse 1.6s ease-out infinite; }
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

      .toast{ position:absolute; left:14px; right:14px; bottom: calc(96px + env(safe-area-inset-bottom) + 12px); border-radius:18px; border:1px solid var(--stroke);
              background: rgba(15,23,42,0.55); color: rgba(255,255,255,0.92); box-shadow: 0 18px 45px rgba(0,0,0,0.25);
              padding:12px; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
      .toastTitle{ font-weight:1000; font-size:12px; }
      .toastBody{ margin-top:4px; font-size:10.5px; color: rgba(255,255,255,0.72); line-height:1.25; }

      .prefblock{ margin-top:12px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; }
      .prefh{ font-weight:1000; font-size:12px; margin-bottom:10px; }
      .plist{ display:flex; flex-direction:column; gap:10px; }
      .prow{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-radius:16px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); cursor:pointer; color: var(--text); }
      .prow-on{ background: rgba(0,168,224,0.14); outline:2px solid rgba(0,168,224,0.22); }
      .prow-title{ font-weight:1000; font-size:12px; }
      .prow-sub{ margin-top:4px; font-size:11px; color: var(--muted); line-height:1.25; }
      .muted{ color: var(--muted); }
      .slider{ margin-top:12px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; }
      .slider-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .slider-title{ font-weight:1000; font-size:12px; }
      .slider-sub{ margin-top:8px; font-size:11px; color: var(--muted); }
      .range{ width:100%; margin-top:10px; }
      .select{ width:100%; border-radius:14px; padding:10px 12px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); color: var(--text); font-weight:900; }

      .mini-grid-3{ display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:10px; margin-top:10px; width:100%; }
      .mini{ display:flex; align-items:flex-start; gap:10px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:10px; min-width:0; overflow:hidden; }
      .mini-ic{ width:34px; height:34px; border-radius:16px; display:flex; align-items:center; justify-content:center; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); flex: 0 0 auto; }
      .mini-val{ font-weight:1000; font-size:12px; white-space:nowrap; }
      .mini-lbl{ margin-top:3px; font-size:9.5px; color: var(--muted); font-weight:900; line-height:1.15; white-space:normal; word-break: break-word; }

      @media (max-width: 420px){
        /* On iPhone-width, keep everything inside cards */
        .mini-grid-3{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .heatmap{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .badge{ font-size:9.5px; padding:5px 8px; }
      }

      .admin-card{ margin-top:12px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; overflow:hidden; }
      .admin-note{ margin-top:8px; font-size:9.5px; color: var(--muted); line-height:1.2; font-weight:900; }
      .admin-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
      .admin-head > div{ flex: 1 1 auto; min-width: 0; }
      .admin-head .badge{ flex:0 0 auto; }
      .admin-h{ font-weight:1000; font-size:11px; letter-spacing:-0.01em; }
      .admin-sub{ margin-top:5px; font-size:10px; color: var(--muted); line-height:1.2; word-break: break-word; }

      .adminSeg{ display:flex; gap:8px; padding:8px; border-radius:18px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); margin-top: 2px; }
      .adminSegBtn{ flex:1; border:0; background: transparent; color: var(--muted); font-weight:1000; font-size:10px; padding:8px 8px; border-radius:14px; cursor:pointer; }
      .adminSegOn{ background: rgba(0,168,224,0.16); color: var(--text); }

      .mini-grid-2{ display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:10px; width:100%; margin-top: 10px; }

      .heroGrid{ display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:10px; width:100%; margin-top: 10px; }
      .hero{ border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; overflow:hidden; }
      .heroRow{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .heroTitle{ font-weight:1000; font-size:10px; color: var(--muted); }
      .heroVal{ margin-top:8px; font-weight:1000; font-size:20px; letter-spacing:-0.03em; }
      .heroSub{ margin-top:6px; font-size:10px; color: var(--muted); line-height:1.2; }

      .metricGrid{ display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:10px; width:100%; }
      .metric{ border:1px solid var(--stroke); background: rgba(255,255,255,0.10); border-radius:18px; padding:12px; overflow:hidden; min-width:0; }
      .metricTop{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .metricIc{ width:32px; height:32px; border-radius:16px; border:1px solid var(--stroke); background: rgba(0,168,224,0.10); display:flex; align-items:center; justify-content:center; flex:0 0 auto; }
      .metricVal{ font-weight:1000; font-size:14px; letter-spacing:-0.02em; white-space:nowrap; }
      .metricLbl{ margin-top:6px; font-size:10px; color: var(--muted); font-weight:1000; line-height:1.15; }
      .metricNote{ margin-top:4px; font-size:9.5px; color: rgba(0,168,224,0.95); font-weight:900; line-height:1.15; }
      .metric-cyan .metricIc{ background: rgba(0,168,224,0.14); }
      .metric-navy .metricIc{ background: rgba(0,51,102,0.14); }
      .metric-ok .metricIc{ background: rgba(16,185,129,0.14); }
      .metric-warn .metricIc{ background: rgba(245,158,11,0.14); }
      .metric-bad .metricIc{ background: rgba(244,63,94,0.14); }

      .subSeg{ display:flex; gap:8px; padding:8px; border-radius:18px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); margin-top: 10px; }
      .subSegBtn{ flex:1; border:0; background: transparent; color: var(--muted); font-weight:1000; font-size:10px; padding:8px 8px; border-radius:14px; cursor:pointer; }
      .subSegOn{ background: rgba(0,168,224,0.16); color: var(--text); }

      @media (max-width: 420px){
        .heroVal{ font-size:18px; }
      }
      
      .heatrow{ margin-top:10px; }
      .heatrow-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .heatrow-lbl{ font-weight:1000; font-size:10px; color: var(--muted); }
      .heatrow-val{ font-weight:1000; font-size:11px; }
      .heatbar{ margin-top:8px; height:10px; border-radius:999px; background: rgba(255,255,255,0.10); overflow:hidden; border:1px solid var(--stroke); }
      .heatfill{ height:100%; border-radius:999px; }

      :root{ --bg: radial-gradient(1200px 700px at 20% 0%, rgba(0,168,224,0.08), transparent 55%),
                    radial-gradient(1200px 700px at 80% 10%, rgba(0,51,102,0.08), transparent 55%),
                    linear-gradient(180deg, #FFFFFF, #F3F8FC);
              --text: rgba(2,6,23,0.92); --muted: rgba(2,6,23,0.55);
              --card: rgba(255,255,255,0.60); --stroke: rgba(148,163,184,0.42);
              --shadow: 0 18px 45px rgba(2,6,23,0.10);
      }
    `}</style>
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
      {right ? <div className="top-right">{right}</div> : null}
    </div>
  );
}

function IconBadge({ tone, text, icon }: { tone: "neutral" | "cyan" | "navy" | "ok" | "warn" | "bad"; text: string; icon?: React.ReactNode }) {
  return (
    <span className={cx("badge", `badge-${tone}`)}>
      {icon ? <span className="badge-ic">{icon}</span> : null}
      <span>{text}</span>
    </span>
  );
}

function Button({ children, onClick, variant = "primary", left }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary"; left?: React.ReactNode }) {
  return (
    <button className={cx("btn", `btn-${variant}`)} onClick={onClick} type="button">
      {left ? <span className="btn-ic">{left}</span> : null}
      <span>{children}</span>
    </button>
  );
}

function Toggle({ label, value, onChange, icon }: { label: string; value: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }) {
  return (
    <button className="toggle" onClick={() => onChange(!value)} type="button">
      <div className="toggle-left">
        {icon ? <div className="toggle-ic">{icon}</div> : null}
        <div className="toggle-label">{label}</div>
      </div>
      <div className={cx("toggle-pill", value && "toggle-on")}>
        <div className={cx("toggle-dot", value && "toggle-dot-on")} />
      </div>
    </button>
  );
}

function ScenarioPicker({ value, onChange }: { value: ScenarioKey; onChange: (k: ScenarioKey) => void }) {
  return (
    <div className="scenarioCtl">
      <div className="seg" aria-label="scenario picker">
        {SCENARIOS.map((s) => {
          const on = s.key === value;
          return (
            <button key={s.key} className={cx("segbtn", on && "segon")} onClick={() => onChange(s.key)} type="button">
              {s.key.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PulseBar({ prefs }: { prefs: Preferences }) {
  const campusBuzz = Math.round(CAMPUS_POIS.reduce((a, p) => a + p.buzz, 0) / CAMPUS_POIS.length);
  const quiet = [...CAMPUS_POIS].filter((p) => p.kind === "workspace").sort((a, b) => b.quiet - a.quiet)[0];
  const coffee = [...AMENITIES].filter((a) => a.kind === "coffee" && a.open).sort((a, b) => a.waitMins - b.waitMins)[0];
  return (
    <div className="pulse">
      <IconBadge tone="neutral" icon={<Flame size={14} />} text={`Buzz ${campusBuzz}/100`} />
      <IconBadge tone="cyan" icon={<Building2 size={14} />} text={`${quiet.name} • ${quiet.availability}% open`} />
      <IconBadge tone="navy" icon={<Coffee size={14} />} text={`${coffee.name} • ${coffee.waitMins}m`} />
      <IconBadge tone="neutral" icon={<User size={14} />} text={prefs.socialInsights ? "Social on" : "Social off"} />
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("home");
  const [selectedPoi, setSelectedPoi] = useState<string | null>(null);
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("s1");
  const [securityMode, setSecurityMode] = useState(false);
  const [sheet, setSheet] = useState<SheetKey>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [arrivalStaged, setArrivalStaged] = useState(false);

  const scenario = useMemo(() => SCENARIOS.find((s) => s.key === scenarioKey)!, [scenarioKey]);

  const [prefs, setPrefs] = useState<Preferences>({
    persona: "exec",
    needsEV: true,
    accessibility: false,
    walkingToleranceMins: 10,
    lowStimulus: false,
    quietPreference: false,
    favoriteOrder: "Brisket bowl",
    socialInsights: true,
  });

  useEffect(() => {
    setArrivalStaged(false);
    setSecurityMode(scenarioKey === "s6" ? true : securityMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioKey]);

  const effectivePrefs = useMemo(() => {
    const persona = PERSONAS.find((p) => p.key === prefs.persona);
    return { ...prefs, ...(persona?.defaults ?? {}) };
  }, [prefs]);

  const now = scenario.now;
  const upcoming = nextEvent(now, CALENDAR);
  const nextBldg: BuildingCode = upcoming?.bldg ?? "B";

  const rankedGarages = rankGarages({ garages: GARAGES, nextBldg, prefs: effectivePrefs });
  const recommendedGarage = rankedGarages[0];
  const backupGarage = rankedGarages[1];

  const rankedWorkspaces = rankWorkspaces({ workspaces: WORKSPACES, mode: scenario.key === "s3" ? scenario.workMode : scenario.workMode, prefs: effectivePrefs, nextBldg });
  const recommendedWorkspace = rankedWorkspaces[0]
    ? { ...rankedWorkspaces[0], walkFromGarage: recommendedGarage ? recommendedGarage.walk : 6 }
    : undefined;

  const coffee = pickAmenity("coffee", nextBldg);
  const breakfast = pickAmenity("breakfast", nextBldg);
  const lunch = pickAmenity("lunch", nextBldg);
  const wellness = pickAmenity("wellness", nextBldg);

  const themeVars = useMemo(() => {
    if (!securityMode) return {} as React.CSSProperties;
    return {
      ["--bg" as any]: "radial-gradient(900px 600px at 50% 0%, rgba(0,168,224,0.10), transparent 60%), linear-gradient(180deg, #050B14, #0A1220)",
      ["--text" as any]: "rgba(255,255,255,0.92)",
      ["--muted" as any]: "rgba(255,255,255,0.62)",
      ["--card" as any]: "rgba(15,23,42,0.55)",
      ["--stroke" as any]: "rgba(148,163,184,0.25)",
      ["--shadow" as any]: "0 18px 45px rgba(0,0,0,0.35)",
    } as React.CSSProperties;
  }, [securityMode]);

  const showToast = (title: string, body: string) => {
    setToast({ title, body });
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <div className="shell" style={themeVars}>
      <Style />
      <header className="top">
        <div className="brand">
          <div className="brand-mark">
            <div className="dot" />
            <div className="dot dot2" />
          </div>
          <div>
            <div className="brand-title">AT&amp;T Campus Companion</div>
            <div className="brand-sub">Executive demo • Future campus experience</div>
          </div>
        </div>
        <div className="top-right">
          <IconBadge tone="navy" icon={<Calendar size={14} />} text={formatTime(now)} />
          {effectivePrefs.accessibility ? <IconBadge tone="neutral" icon={<BadgeCheck size={14} />} text="Accessible" /> : null}
        </div>
      </header>

      <PulseBar prefs={effectivePrefs} />

      <main className="main">
        {tab === "home" ? (
          <HomeTab
            scenario={scenario}
            scenarioKey={scenarioKey}
            onScenario={setScenarioKey}
            onReportIssue={() => setSheet("issue")}
            onAction={showToast}
            socialOn={effectivePrefs.socialInsights}
            arrivalStaged={arrivalStaged}
            onStartArrival={() => setArrivalStaged(true)}
            workMode={scenario.workMode}
            onWorkMode={() => setTab("home")}
            onGoExplore={() => setTab("explore")}
            onGoMap={() => setTab("map")}
            onGoSchedule={() => setTab("schedule")}
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
          <ExploreTab scenarioKey={scenarioKey} onScenario={setScenarioKey} prefs={effectivePrefs} onGoMap={() => setTab("map")} />
        ) : null}

        {tab === "map" ? (
          <MapTab
            securityMode={securityMode}
            accessibleOn={effectivePrefs.accessibility}
            selectedPoi={selectedPoi}
            onSelectPoi={setSelectedPoi}
            route={buildRoutePoints({ garage: recommendedGarage?.garage, workspace: recommendedWorkspace?.workspace, meetingBldg: nextBldg })}
            scenarioKey={scenarioKey}
            onScenario={setScenarioKey}
          />
        ) : null}

        {tab === "schedule" ? <ScheduleTab now={now} scenarioKey={scenarioKey} onScenario={setScenarioKey} events={CALENDAR} /> : null}

        {tab === "profile" ? (
          <ProfileTab
            prefs={prefs}
            onPrefs={setPrefs}
            personaKey={prefs.persona}
            onPersona={(k) => {
              const persona = PERSONAS.find((x) => x.key === k);
              setPrefs((p) => ({ ...p, persona: k, ...(persona?.defaults ?? {}) }));
            }}
            scenarioKey={scenarioKey}
            onScenario={setScenarioKey}
          />
        ) : null}

        {tab === "admin" ? <AdminTab scenarioKey={scenarioKey} onScenario={setScenarioKey} /> : null}
      </main>

      <button className="fab" onClick={() => setSecurityMode((v) => !v)} type="button" aria-label="Toggle security mode">
        <Shield size={18} />
      </button>

      <BottomNav tab={tab} onChange={setTab} />

      {toast ? (
        <div className="toast" role="status" aria-live="polite" onClick={() => setToast(null)}>
          <div className="toastTitle">{toast.title}</div>
          <div className="toastBody">{toast.body}</div>
        </div>
      ) : null}

      {sheet === "issue" ? (
        <div className="card" style={{ position: "absolute", left: 14, right: 14, bottom: 110, padding: 14 }}>
          <div className="card-title">Report issue</div>
          <div className="card-sub" style={{ marginTop: 6 }}>Mock form placeholder</div>
          <div className="row3">
            <Button variant="secondary" onClick={() => setSheet(null)} left={<X size={16} />}>Close</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}



