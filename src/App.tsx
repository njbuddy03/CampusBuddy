import React, { useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Bell,
  Building2,
  ChevronRight,
  Compass,
  Cpu,
  Flame,
  Heart,
  Home,
  KeyRound,
  Lock,
  Map as MapIcon,
  Moon,
  Navigation,
  Radar,
  Shield,
  Sparkles,
  Sun,
  Thermometer,
  Timer,
  User,
  Wifi,
} from "lucide-react";

/**
 * AT&T Legacy Connect (Frontend Demo)
 * - Mobile-first, glassmorphism UI
 * - Theme colors: AT&T Navy (#003366) and Cyan (#00A8E0)
 * - Bottom navigation with 5 tabs
 * - Virtual Escort toggle on Home enables Security Mode (dark theme + pulsing safety radius on map)
 *
 * Dependencies:
 *   npm i lucide-react
 */

type TabKey = "home" | "pulse" | "explorer" | "workspace" | "admin";

type MapOverlay = "buzz" | "rooms";

type CampusPOI = {
  id: string;
  name: string;
  type: "space" | "food" | "ops" | "wellness";
  bldg: "A" | "B" | "C";
  x: number; // 0..100
  y: number; // 0..100
  buzz: number; // 0..100
  rooms: number; // availability 0..100
  rating?: number;
};

type Friend = {
  id: string;
  name: string;
  role: string;
  location: string;
  etaMins: number;
};

const ATTNAVY = "#003366";
const ATTCYAN = "#00A8E0";

const POIS: CampusPOI[] = [
  { id: "sky", name: "The Sky Lounge", type: "space", bldg: "A", x: 22, y: 22, buzz: 18, rooms: 82, rating: 4.8 },
  { id: "grove", name: "The Grove", type: "food", bldg: "B", x: 52, y: 35, buzz: 58, rooms: 60, rating: 4.6 },
  { id: "tacos", name: "Legacy Tacos", type: "food", bldg: "B", x: 64, y: 50, buzz: 72, rooms: 44, rating: 4.9 },
  { id: "war", name: "The War Room", type: "ops", bldg: "C", x: 78, y: 28, buzz: 88, rooms: 22, rating: 4.7 },
  { id: "trail", name: "Nature Trail", type: "wellness", bldg: "A", x: 18, y: 74, buzz: 12, rooms: 100, rating: 4.5 },
  { id: "cafeB", name: "Building B Cafe", type: "food", bldg: "B", x: 48, y: 58, buzz: 64, rooms: 55, rating: 4.4 },
  { id: "focusA", name: "Quiet Zones", type: "space", bldg: "A", x: 30, y: 38, buzz: 24, rooms: 76, rating: 4.7 },
  { id: "mesh", name: "5G Mesh Node", type: "ops", bldg: "C", x: 86, y: 54, buzz: 40, rooms: 90 },
];

const FRIENDS: Friend[] = [
  { id: "sarah", name: "Sarah", role: "Mentor", location: "The Grove", etaMins: 3 },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pctColor(p: number) {
  // returns CSS var names used in styles
  if (p < 35) return "var(--ok)";
  if (p < 70) return "var(--warn)";
  return "var(--bad)";
}

function IconBadge({
  icon,
  text,
  tone = "neutral",
}: {
  icon?: React.ReactNode;
  text: string;
  tone?: "neutral" | "cyan" | "navy" | "ok" | "warn" | "bad";
}) {
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

function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
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

function Button({
  children,
  onClick,
  variant = "primary",
  left,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  left?: React.ReactNode;
}) {
  return (
    <button className={cx("btn", `btn-${variant}`)} onClick={onClick}>
      {left ? <span className="btn-ic">{left}</span> : null}
      <span>{children}</span>
    </button>
  );
}

function Toggle({ label, value, onChange, icon }: { label: string; value: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }) {
  return (
    <button className="toggle" onClick={() => onChange(!value)}>
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

export default function App() {
  const [tab, setTab] = useState<TabKey>("home");
  const [securityMode, setSecurityMode] = useState(false);
  const [overlay, setOverlay] = useState<MapOverlay>("buzz");
  const [selectedPoi, setSelectedPoi] = useState<CampusPOI | null>(null);

  const themeVars = useMemo(() => {
    if (!securityMode) {
      return {
        "--bg": "radial-gradient(900px 500px at 20% 0%, rgba(0,168,224,0.18), transparent 55%), radial-gradient(900px 500px at 80% 10%, rgba(0,51,102,0.15), transparent 55%), linear-gradient(180deg, #F6FBFF, #F2F7FB)",
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
      "--bg": "radial-gradient(900px 500px at 20% 0%, rgba(0,168,224,0.18), transparent 55%), radial-gradient(900px 500px at 80% 10%, rgba(59,130,246,0.18), transparent 55%), linear-gradient(180deg, #0A1020, #070B14)",
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

  const favorites = useMemo(() => {
    const mostPopular = [...POIS].sort((a, b) => b.buzz - a.buzz)[0];
    const topRated = [...POIS].filter((p) => typeof p.rating === "number").sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
    return { mostPopular, topRated };
  }, []);

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
            <div className="brand-title">AT&T Legacy Connect</div>
            <div className="brand-sub">Premium campus experience demo</div>
          </div>
        </div>

        <div className="top-right">
          <IconBadge
            tone={securityMode ? "cyan" : "neutral"}
            icon={securityMode ? <Shield size={14} /> : <Sparkles size={14} />}
            text={securityMode ? "Security Mode" : "Glass UI"}
          />
        </div>
      </header>

      <main className="main">
        {tab === "home" ? (
          <HomeTab
            securityMode={securityMode}
            onSecurityToggle={() => setSecurityMode((v) => !v)}
            onGoMap={() => setTab("explorer")}
          />
        ) : null}

        {tab === "pulse" ? (
          <PulseTab
            onNavigate={() => {
              setTab("explorer");
              setSelectedPoi(POIS.find((p) => p.id === "sky") ?? null);
            }}
            onCoffee={() => {
              setTab("explorer");
              setSelectedPoi(POIS.find((p) => p.id === "grove") ?? null);
            }}
          />
        ) : null}

        {tab === "explorer" ? (
          <ExplorerTab
            overlay={overlay}
            setOverlay={setOverlay}
            favorites={favorites}
            selectedPoi={selectedPoi}
            onSelectPoi={setSelectedPoi}
            securityMode={securityMode}
          />
        ) : null}

        {tab === "workspace" ? <WorkspaceTab /> : null}

        {tab === "admin" ? <AdminTab /> : null}
      </main>

      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}

function HomeTab({
  securityMode,
  onSecurityToggle,
  onGoMap,
}: {
  securityMode: boolean;
  onSecurityToggle: () => void;
  onGoMap: () => void;
}) {
  return (
    <div className="stack">
      <Card>
        <CardHeader
          title="Predictive Day"
          subtitle="Proactive recommendations with frictionless actions"
          right={<IconBadge tone="cyan" icon={<Sparkles size={14} />} text="AI Ready" />}
        />
        <div className="pad">
          <div className="hero">
            <div className="hero-left">
              <div className="hello">Good Morning, John.</div>
              <div className="hello-sub">Welcome back. Your day is already optimized.</div>
            </div>
            <div className="hero-ic">
              {securityMode ? <Shield size={18} /> : <Sun size={18} />}
            </div>
          </div>

          <div className="grid2">
            <div className="glassline">
              <div className="glass-ic">
                <BadgeCheck size={16} />
              </div>
              <div className="glass-txt">
                <div className="glass-title">Garage B, Spot G-42 Reserved.</div>
                <div className="glass-sub">LPR Gate Access Active.</div>
              </div>
              <ChevronRight size={18} className="muted" />
            </div>

            <div className="glassline">
              <div className="glass-ic">
                <Timer size={16} />
              </div>
              <div className="glass-txt">
                <div className="glass-title">Order Favorite</div>
                <div className="glass-sub">Brisket Bowl from Building B Cafe (Ready in 12m).</div>
              </div>
              <Button variant="secondary" left={<Bell size={16} />} onClick={() => alert("Order placed (mock).")}>
                Order
              </Button>
            </div>
          </div>

          <div className="row">
            <Toggle
              label="Virtual Escort"
              value={securityMode}
              onChange={() => onSecurityToggle()}
              icon={<Radar size={16} />}
            />
          </div>

          <div className="row2">
            <Button left={<Navigation size={16} />} onClick={onGoMap}>
              Open Living Map
            </Button>
            <Button variant="secondary" left={<KeyRound size={16} />} onClick={() => alert("Gate access refreshed (mock).")}>
              Refresh Access
            </Button>
          </div>

          <div className="hint">
            {securityMode
              ? "Security Mode is active. The app switches to a dark theme and shows a pulsing safety radius on the map."
              : "Turn on Virtual Escort for a security-focused experience layer."}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Today at a glance" subtitle="Signals that matter" />
        <div className="pad">
          <div className="mini-grid">
            <MiniStat label="Private 5G" value="12ms" icon={<Wifi size={16} />} tone="cyan" />
            <MiniStat label="Campus temp" value="72°F" icon={<Thermometer size={16} />} tone="ok" />
            <MiniStat label="Buzz" value="Medium" icon={<Activity size={16} />} tone="warn" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function PulseTab({ onNavigate, onCoffee }: { onNavigate: () => void; onCoffee: () => void }) {
  return (
    <div className="stack">
      <Card>
        <CardHeader
          title="Pulse"
          subtitle="AI discovery based on preferences, context, and live signals"
          right={<IconBadge tone="cyan" icon={<Sparkles size={14} />} text="AI Discovery" />}
        />
        <div className="pad">
          <div className="pulsecard">
            <div className="pulse-ic cyan">
              <Sparkles size={18} />
            </div>
            <div className="pulse-txt">
              <div className="pulse-title">
                You like "Quiet Zones". Building A is 90% full. "The Sky Lounge" is 12% full and 15dB quieter.
              </div>
              <div className="pulse-sub">Navigate?</div>
            </div>
            <Button left={<Navigation size={16} />} onClick={onNavigate}>
              Go
            </Button>
          </div>

          <div className="pulsecard">
            <div className="pulse-ic navy">
              <User size={18} />
            </div>
            <div className="pulse-txt">
              <div className="pulse-title">Sarah (Mentor) is at The Grove.</div>
              <div className="pulse-sub">15-min Coffee Catch-up?</div>
            </div>
            <Button variant="secondary" left={<Bell size={16} />} onClick={onCoffee}>
              Invite
            </Button>
          </div>

          <div className="pulsecard">
            <div className="pulse-ic ok">
              <Heart size={18} />
            </div>
            <div className="pulse-txt">
              <div className="pulse-title">Nature Trail is 72°F.</div>
              <div className="pulse-sub">Move your 2PM to a Walking Meeting?</div>
            </div>
            <Button variant="secondary" left={<ChevronRight size={16} />} onClick={() => alert("Meeting updated (mock).")}>
              Convert
            </Button>
          </div>

          <div className="hint">All insights are mock and intended for an SVP/VP style narrative demo.</div>
        </div>
      </Card>
    </div>
  );
}

function ExplorerTab({
  overlay,
  setOverlay,
  favorites,
  selectedPoi,
  onSelectPoi,
  securityMode,
}: {
  overlay: MapOverlay;
  setOverlay: (v: MapOverlay) => void;
  favorites: { mostPopular: CampusPOI; topRated: CampusPOI };
  selectedPoi: CampusPOI | null;
  onSelectPoi: (p: CampusPOI | null) => void;
  securityMode: boolean;
}) {
  const list = useMemo(() => {
    const sorted = [...POIS].filter((p) => p.type !== "ops").sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return sorted.slice(0, 6);
  }, []);

  return (
    <div className="stack">
      <Card>
        <CardHeader
          title="Explorer"
          subtitle="Living map of the 54-acre campus"
          right={<IconBadge tone="cyan" icon={<MapIcon size={14} />} text="54 acres" />}
        />
        <div className="pad">
          <div className="row2">
            <Button
              variant={overlay === "buzz" ? "primary" : "secondary"}
              left={<Flame size={16} />}
              onClick={() => setOverlay("buzz")}
            >
              Buzz Level
            </Button>
            <Button
              variant={overlay === "rooms" ? "primary" : "secondary"}
              left={<Building2 size={16} />}
              onClick={() => setOverlay("rooms")}
            >
              Room Availability
            </Button>
          </div>

          <CampusMap
            overlay={overlay}
            selected={selectedPoi}
            onSelect={onSelectPoi}
            securityMode={securityMode}
          />

          <div className="split">
            <div className="fav">
              <div className="fav-h">Crowd Favorites</div>
              <div className="fav-item" onClick={() => onSelectPoi(favorites.mostPopular)}>
                <div className="fav-left">
                  <IconBadge tone="warn" icon={<Flame size={14} />} text="Most Popular" />
                  <div className="fav-name">{favorites.mostPopular.name} (Bldg {favorites.mostPopular.bldg})</div>
                </div>
                <ChevronRight size={16} className="muted" />
              </div>
              <div className="fav-item" onClick={() => onSelectPoi(favorites.topRated)}>
                <div className="fav-left">
                  <IconBadge tone="ok" icon={<Heart size={14} />} text="Top Rated" />
                  <div className="fav-name">{favorites.topRated.name} (Bldg {favorites.topRated.bldg})</div>
                </div>
                <ChevronRight size={16} className="muted" />
              </div>
            </div>

            <div className="fav">
              <div className="fav-h">Top spots</div>
              {list.map((p) => (
                <div key={p.id} className="fav-item" onClick={() => onSelectPoi(p)}>
                  <div className="fav-left">
                    <div className="fav-name">{p.name}</div>
                    <div className="fav-sub">Bldg {p.bldg} • rating {p.rating ?? "-"}</div>
                  </div>
                  <ChevronRight size={16} className="muted" />
                </div>
              ))}
            </div>
          </div>

          {selectedPoi ? <PoiSheet poi={selectedPoi} overlay={overlay} onClose={() => onSelectPoi(null)} /> : null}
        </div>
      </Card>
    </div>
  );
}

function CampusMap({
  overlay,
  selected,
  onSelect,
  securityMode,
}: {
  overlay: MapOverlay;
  selected: CampusPOI | null;
  onSelect: (p: CampusPOI) => void;
  securityMode: boolean;
}) {
  const me = { x: 46, y: 60 };

  return (
    <div className="map">
      <div className="map-grid" />

      {/* overlays */}
      <div className="map-overlay">
        {POIS.map((p) => {
          const v = overlay === "buzz" ? p.buzz : p.rooms;
          const alpha = overlay === "buzz" ? clamp(v / 100, 0.08, 0.42) : clamp(v / 100, 0.10, 0.46);
          const color = overlay === "buzz" ? `rgba(0,168,224,${alpha})` : `rgba(16,185,129,${alpha})`;
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

      {/* buildings labels */}
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
      {POIS.filter((p) => p.type !== "ops").map((p) => {
        const isSelected = selected?.id === p.id;
        const dotColor = overlay === "buzz" ? pctColor(p.buzz) : pctColor(100 - p.rooms);
        return (
          <button
            key={p.id}
            className={cx("pin", isSelected && "pin-on")}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onClick={() => onSelect(p)}
          >
            <span className="pin-dot" style={{ background: dotColor }} />
            <span className="pin-ttl">{p.name}</span>
          </button>
        );
      })}

      {/* user marker */}
      <div className="me" style={{ left: `${me.x}%`, top: `${me.y}%` }}>
        <div className="me-dot" />
        <div className="me-tag">You</div>
      </div>

      {/* security pulse */}
      {securityMode ? (
        <div className="escort" style={{ left: `${me.x}%`, top: `${me.y}%` }}>
          <div className="escort-ring" />
          <div className="escort-ring ring2" />
        </div>
      ) : null}

      <div className="map-legend">
        <IconBadge
          tone="neutral"
          icon={overlay === "buzz" ? <Flame size={14} /> : <Building2 size={14} />}
          text={overlay === "buzz" ? "Heat: Buzz Level" : "Heat: Room Availability"}
        />
        {securityMode ? <IconBadge tone="cyan" icon={<Shield size={14} />} text="Virtual Escort" /> : null}
      </div>
    </div>
  );
}

function PoiSheet({ poi, overlay, onClose }: { poi: CampusPOI; overlay: MapOverlay; onClose: () => void }) {
  const primary = overlay === "buzz" ? { label: "Buzz", value: poi.buzz } : { label: "Rooms", value: poi.rooms };
  const secondary = overlay === "buzz" ? { label: "Rooms", value: poi.rooms } : { label: "Buzz", value: poi.buzz };

  return (
    <div className="sheet">
      <div className="sheet-top">
        <div>
          <div className="sheet-title">{poi.name}</div>
          <div className="sheet-sub">Building {poi.bldg} • {poi.type}</div>
        </div>
        <button className="x" onClick={onClose} aria-label="close">
          <span>Close</span>
        </button>
      </div>

      <div className="sheet-grid">
        <HeatBar label={primary.label} value={primary.value} />
        <HeatBar label={secondary.label} value={secondary.value} />
      </div>

      <div className="sheet-actions">
        <Button left={<Navigation size={16} />} onClick={() => alert(`Navigating to ${poi.name} (mock).`)}>
          Navigate
        </Button>
        <Button variant="secondary" left={<Bell size={16} />} onClick={() => alert("Saved (mock).")}>
          Save
        </Button>
      </div>

      <div className="hint">Pins and heat are mock signals to demonstrate interactive campus intelligence.</div>
    </div>
  );
}

function WorkspaceTab() {
  const [applied, setApplied] = useState(false);
  const [lockerOpen, setLockerOpen] = useState(false);
  return (
    <div className="stack">
      <Card>
        <CardHeader
          title="Workspace"
          subtitle="Asset and ergonomics"
          right={<IconBadge tone="cyan" icon={<Cpu size={14} />} text="Desk Sync" />}
        />
        <div className="pad">
          <div className="glassline">
            <div className="glass-ic">
              <Cpu size={16} />
            </div>
            <div className="glass-txt">
              <div className="glass-title">Desk Sync</div>
              <div className="glass-sub">Apply My Profile</div>
              {applied ? <div className="glass-sub2">Height 42.5\". Dual Monitors On.</div> : null}
            </div>
            <Button
              left={<Sparkles size={16} />}
              onClick={() => {
                setApplied(true);
                setTimeout(() => setApplied(false), 3500);
              }}
            >
              Apply
            </Button>
          </div>

          <div className="glassline">
            <div className="glass-ic">
              <Lock size={16} />
            </div>
            <div className="glass-txt">
              <div className="glass-title">Smart Locker</div>
              <div className="glass-sub">Locker 402 - Unlock via NFC.</div>
              {lockerOpen ? <div className="glass-sub2">Unlocked (mock). Auto-lock in 30s.</div> : null}
            </div>
            <Button
              variant="secondary"
              left={<KeyRound size={16} />}
              onClick={() => {
                setLockerOpen(true);
                setTimeout(() => setLockerOpen(false), 3000);
              }}
            >
              Unlock
            </Button>
          </div>

          <div className="asset">
            <div className="asset-top">
              <IconBadge tone="bad" icon={<Bell size={14} />} text="ASSET TRACKER" />
              <IconBadge tone="neutral" icon={<Wifi size={14} />} text="5G Mesh" />
            </div>
            <div className="asset-title">Alert: Did you leave your Laptop in Bldg C, Room 402?</div>
            <div className="asset-sub">Last seen by 5G Mesh @ 4:15 PM.</div>
            <div className="asset-actions">
              <Button left={<Navigation size={16} />} onClick={() => alert("Routing to last known location (mock).")}>
                Locate
              </Button>
              <Button variant="secondary" left={<Bell size={16} />} onClick={() => alert("Ping sent to nearby devices (mock).")}>
                Ping
              </Button>
            </div>
          </div>

          <div className="hint">Desk and locker controls are demo interactions to support an executive narrative.</div>
        </div>
      </Card>
    </div>
  );
}

function AdminTab() {
  return (
    <div className="stack">
      <Card>
        <CardHeader
          title="Admin"
          subtitle="SVP/VP ROI dashboard"
          right={<IconBadge tone="cyan" icon={<Shield size={14} />} text="Executive" />}
        />
        <div className="pad">
          <div className="mini-grid">
            <MiniStat label="Active Ghosting Savings" value="$4,200/week" icon={<Sparkles size={16} />} tone="ok" />
            <MiniStat label="Space Health" value="Bldg B: 14%" icon={<Building2 size={16} />} tone="warn" />
            <MiniStat label="Private 5G Latency" value="12ms" icon={<Wifi size={16} />} tone="cyan" />
          </div>

          <div className="admin-card">
            <div className="admin-h">Space Health Heatmap</div>
            <div className="admin-sub">Building B under-utilized (14%). Focus consolidation opportunities.</div>
            <div className="heatmap">
              <HeatTile label="A" value={64} />
              <HeatTile label="B" value={14} />
              <HeatTile label="C" value={78} />
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-h">Network Stats</div>
            <div className="admin-sub">Private 5G: low latency with high reliability (mock).</div>
            <HeatBar label="Latency" value={12} suffix="ms" />
            <HeatBar label="Reliability" value={99} suffix="%" />
          </div>

          <div className="hint">This dashboard is a demo to visualize ROI levers (energy, utilization, network performance).</div>
        </div>
      </Card>
    </div>
  );
}

function HeatTile({ label, value }: { label: string; value: number }) {
  const v = clamp(value, 0, 100);
  const fill = `linear-gradient(135deg, rgba(0,168,224,0.18), rgba(0,51,102,0.18))`;
  const tint = v < 25 ? "rgba(16,185,129,0.25)" : v < 70 ? "rgba(245,158,11,0.25)" : "rgba(244,63,94,0.25)";
  return (
    <div className="tile" style={{ background: `${tint}, ${fill}` as any }}>
      <div className="tile-top">
        <div className="tile-lbl">Building {label}</div>
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
    { key: "pulse", label: "Pulse", icon: <Sparkles size={18} /> },
    { key: "explorer", label: "Explorer", icon: <MapIcon size={18} /> },
    { key: "workspace", label: "Workspace", icon: <Cpu size={18} /> },
    { key: "admin", label: "Admin", icon: <Shield size={18} /> },
  ];

  return (
    <nav className="nav">
      {items.map((it) => {
        const active = it.key === tab;
        return (
          <button key={it.key} className={cx("navbtn", active && "navon")} onClick={() => onChange(it.key)}>
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
      :root {
        --navy: ${ATTNAVY};
        --cyan: ${ATTCYAN};
      }
      *{ box-sizing:border-box; }
      html,body{ height:100%; }
      body{ margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }

      .shell{
        min-height:100vh;
        background: var(--bg);
        color: var(--text);
        padding: 18px 14px 92px;
        display:flex;
        justify-content:center;
      }
      .top{ width:100%; max-width:420px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px; }
      .brand{ display:flex; align-items:center; gap:10px; }
      .brand-mark{ width:38px; height:38px; border-radius:16px; background: rgba(0,168,224,0.16); border: 1px solid var(--stroke); box-shadow: var(--shadow); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
      .dot{ width:10px; height:10px; border-radius:999px; background: var(--cyan); box-shadow: 0 0 20px rgba(0,168,224,0.45); }
      .dot2{ position:absolute; right:10px; bottom:10px; width:8px; height:8px; background: rgba(0,51,102,0.85); }
      .brand-title{ font-size:14px; font-weight:800; letter-spacing:-0.02em; }
      .brand-sub{ font-size:11px; color: var(--muted); margin-top:2px; }
      .top-right{ display:flex; align-items:center; gap:10px; }

      .main{ width:100%; max-width:420px; }
      .stack{ display:flex; flex-direction:column; gap:12px; }

      .card{
        border-radius: 22px;
        background: var(--card);
        border: 1px solid var(--stroke);
        box-shadow: var(--shadow);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        overflow:hidden;
      }
      .card-hd{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:14px; }
      .card-title{ font-weight:800; font-size:13px; letter-spacing:-0.01em; }
      .card-sub{ font-size:11px; color: var(--muted); margin-top:3px; }
      .pad{ padding: 0 14px 14px; }

      .badge{ display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:11px; font-weight:700; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); }
      .badge-ic{ display:inline-flex; }
      .badge-neutral{ color: var(--text); }
      .badge-cyan{ background: rgba(0,168,224,0.16); color: var(--text); }
      .badge-navy{ background: rgba(0,51,102,0.18); color: var(--text); }
      .badge-ok{ background: rgba(16,185,129,0.16); color: var(--text); }
      .badge-warn{ background: rgba(245,158,11,0.16); color: var(--text); }
      .badge-bad{ background: rgba(244,63,94,0.16); color: var(--text); }

      .hero{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-top:4px; margin-bottom:10px; }
      .hello{ font-size:18px; font-weight:900; letter-spacing:-0.03em; }
      .hello-sub{ font-size:12px; color: var(--muted); margin-top:4px; }
      .hero-ic{ width:38px; height:38px; border-radius:16px; display:flex; align-items:center; justify-content:center; border:1px solid var(--stroke); background: rgba(0,168,224,0.12); }

      .grid2{ display:flex; flex-direction:column; gap:10px; }
      .glassline{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-radius:18px; border: 1px solid var(--stroke); background: rgba(255,255,255,0.10); }
      .glass-ic{ width:34px; height:34px; border-radius:14px; display:flex; align-items:center; justify-content:center; background: rgba(0,51,102,0.14); border:1px solid rgba(0,168,224,0.18); }
      .glass-txt{ flex:1; min-width:0; }
      .glass-title{ font-size:12px; font-weight:900; letter-spacing:-0.01em; }
      .glass-sub{ font-size:11px; color: var(--muted); margin-top:2px; }
      .glass-sub2{ font-size:11px; color: rgba(0,168,224,0.95); margin-top:4px; font-weight:700; }

      .btn{ border:0; cursor:pointer; padding:10px 12px; border-radius:16px; font-weight:900; font-size:12px; display:inline-flex; align-items:center; gap:8px; }
      .btn-ic{ display:inline-flex; }
      .btn-primary{ background: linear-gradient(135deg, rgba(0,168,224,0.95), rgba(0,51,102,0.95)); color:white; box-shadow: 0 10px 30px rgba(0,168,224,0.18); }
      .btn-secondary{ background: rgba(255,255,255,0.12); color: var(--text); border: 1px solid var(--stroke); }
      .btn-ghost{ background: transparent; color: var(--text); border: 1px solid var(--stroke); }

      .row{ margin-top:10px; }
      .row2{ display:flex; gap:10px; margin-top:10px; }
      .row2 .btn{ flex:1; justify-content:center; }
      .hint{ margin-top:10px; font-size:11px; color: var(--muted); }

      .toggle{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-radius:18px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); cursor:pointer; }
      .toggle-left{ display:flex; align-items:center; gap:10px; }
      .toggle-ic{ width:30px; height:30px; border-radius:14px; display:flex; align-items:center; justify-content:center; background: rgba(0,168,224,0.12); border:1px solid rgba(0,168,224,0.20); }
      .toggle-label{ font-weight:900; font-size:12px; }
      .toggle-pill{ width:54px; height:30px; border-radius:999px; background: rgba(255,255,255,0.14); border:1px solid var(--stroke); padding:3px; position:relative; }
      .toggle-on{ background: rgba(0,168,224,0.18); }
      .toggle-dot{ width:24px; height:24px; border-radius:999px; background: rgba(255,255,255,0.90); transform: translateX(0); transition: transform 200ms ease; }
      .toggle-dot-on{ transform: translateX(24px); background: rgba(0,168,224,0.95); }

      .mini-grid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; }
      .mini{ padding:12px; border-radius:18px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); display:flex; gap:10px; }
      .mini-ic{ width:34px; height:34px; border-radius:16px; display:flex; align-items:center; justify-content:center; border:1px solid var(--stroke); }
      .mini-cyan{ background: rgba(0,168,224,0.16); }
      .mini-navy{ background: rgba(0,51,102,0.18); }
      .mini-ok{ background: rgba(16,185,129,0.16); }
      .mini-warn{ background: rgba(245,158,11,0.16); }
      .mini-bad{ background: rgba(244,63,94,0.16); }
      .mini-txt{ display:flex; flex-direction:column; justify-content:center; }
      .mini-val{ font-weight:1000; letter-spacing:-0.02em; }
      .mini-lbl{ font-size:11px; color: var(--muted); margin-top:2px; }

      .pulsecard{ display:flex; gap:12px; align-items:flex-start; padding:12px; border-radius:18px; border: 1px solid var(--stroke); background: rgba(255,255,255,0.10); }
      .pulse-ic{ width:38px; height:38px; border-radius:18px; display:flex; align-items:center; justify-content:center; border:1px solid var(--stroke); }
      .pulse-ic.cyan{ background: rgba(0,168,224,0.16); }
      .pulse-ic.navy{ background: rgba(0,51,102,0.18); }
      .pulse-ic.ok{ background: rgba(16,185,129,0.16); }
      .pulse-txt{ flex:1; min-width:0; }
      .pulse-title{ font-weight:900; font-size:12px; line-height:1.25; }
      .pulse-sub{ font-size:11px; color: var(--muted); margin-top:4px; }

      .map{ position:relative; width:100%; aspect-ratio: 10/9; border-radius:22px; overflow:hidden; border:1px solid var(--stroke);
            background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
      }
      .map-grid{ position:absolute; inset:0; opacity:0.55;
        background-image:
          linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px);
        background-size: 26px 26px;
      }
      .map-overlay{ position:absolute; inset:0; }
      .heat{ position:absolute; width:180px; height:180px; transform: translate(-50%, -50%);
             filter: blur(0.2px); pointer-events:none; }
      .bldg{ position:absolute; transform: translate(-50%, -50%);
             width:38px; height:38px; border-radius:18px; display:flex; align-items:center; justify-content:center;
             font-weight:1000; border:1px solid var(--stroke); background: rgba(0,51,102,0.18);
      }
      .pin{ position:absolute; transform: translate(-50%, -50%);
            display:flex; align-items:center; gap:8px;
            padding:8px 10px; border-radius:999px;
            border:1px solid var(--stroke);
            background: rgba(255,255,255,0.10);
            color: var(--text);
            cursor:pointer;
      }
      .pin:hover{ background: rgba(255,255,255,0.14); }
      .pin-on{ outline: 2px solid rgba(0,168,224,0.45); }
      .pin-dot{ width:10px; height:10px; border-radius:999px; box-shadow: 0 0 20px rgba(0,168,224,0.18); }
      .pin-ttl{ font-size:11px; font-weight:900; max-width: 160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .me{ position:absolute; transform: translate(-50%, -50%); display:flex; flex-direction:column; align-items:center; gap:6px; }
      .me-dot{ width:12px; height:12px; border-radius:999px; background: rgba(0,168,224,0.95); box-shadow: 0 0 0 8px rgba(0,168,224,0.18); }
      .me-tag{ font-size:10px; font-weight:900; color: var(--muted); }
      .escort{ position:absolute; transform: translate(-50%, -50%); pointer-events:none; }
      .escort-ring{ width:220px; height:220px; border-radius:999px; border: 2px solid rgba(0,168,224,0.34);
                    box-shadow: 0 0 28px rgba(0,168,224,0.18);
                    animation: pulse 1.6s ease-out infinite; }
      .ring2{ width:320px; height:320px; position:absolute; left:50%; top:50%; transform: translate(-50%, -50%);
              border-color: rgba(0,168,224,0.18); animation-delay: 0.55s; }
      @keyframes pulse{
        0%{ transform: scale(0.88); opacity: 0.75; }
        65%{ transform: scale(1.02); opacity: 0.28; }
        100%{ transform: scale(1.08); opacity: 0.0; }
      }

      .map-legend{ position:absolute; left:10px; top:10px; display:flex; gap:8px; flex-wrap:wrap; }

      .split{ display:grid; grid-template-columns: 1fr; gap:10px; margin-top:12px; }
      @media (min-width: 420px){ .split{ grid-template-columns: 1fr 1fr; } }
      .fav{ padding:12px; border-radius:18px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); }
      .fav-h{ font-weight:1000; font-size:12px; margin-bottom:10px; }
      .fav-item{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px; border-radius:16px; border:1px solid rgba(255,255,255,0.06); cursor:pointer; }
      .fav-item:hover{ background: rgba(255,255,255,0.10); }
      .fav-left{ display:flex; flex-direction:column; gap:6px; min-width:0; }
      .fav-name{ font-size:12px; font-weight:900; }
      .fav-sub{ font-size:11px; color: var(--muted); }
      .muted{ color: var(--muted); }

      .sheet{ margin-top:12px; padding:12px; border-radius:20px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); }
      .sheet-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
      .sheet-title{ font-size:13px; font-weight:1000; }
      .sheet-sub{ font-size:11px; color: var(--muted); margin-top:2px; }
      .x{ border:1px solid var(--stroke); background: rgba(255,255,255,0.10); color: var(--text);
          padding:8px 10px; border-radius:14px; cursor:pointer; font-weight:900; font-size:12px; }
      .sheet-grid{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px; }
      .sheet-actions{ display:flex; gap:10px; margin-top:10px; }
      .sheet-actions .btn{ flex:1; justify-content:center; }

      .heatrow{ border:1px solid var(--stroke); background: rgba(255,255,255,0.08); border-radius:16px; padding:10px; }
      .heatrow-top{ display:flex; align-items:center; justify-content:space-between; }
      .heatrow-lbl{ font-size:11px; color: var(--muted); font-weight:900; }
      .heatrow-val{ font-size:12px; font-weight:1000; }
      .heatbar{ height:10px; border-radius:999px; background: rgba(255,255,255,0.10); border:1px solid rgba(255,255,255,0.08); overflow:hidden; margin-top:8px; }
      .heatfill{ height:100%; border-radius:999px; }

      .asset{ margin-top:10px; padding:12px; border-radius:20px; border:1px solid rgba(244,63,94,0.25);
              background: linear-gradient(180deg, rgba(244,63,94,0.10), rgba(255,255,255,0.06)); }
      .asset-top{ display:flex; gap:8px; flex-wrap:wrap; }
      .asset-title{ margin-top:8px; font-weight:1000; font-size:12px; }
      .asset-sub{ margin-top:4px; font-size:11px; color: var(--muted); }
      .asset-actions{ display:flex; gap:10px; margin-top:10px; }
      .asset-actions .btn{ flex:1; justify-content:center; }

      .admin-card{ margin-top:10px; padding:12px; border-radius:20px; border:1px solid var(--stroke); background: rgba(255,255,255,0.10); }
      .admin-h{ font-weight:1000; font-size:12px; }
      .admin-sub{ margin-top:4px; font-size:11px; color: var(--muted); }
      .heatmap{ display:grid; grid-template-columns: repeat(3,1fr); gap:10px; margin-top:10px; }
      .tile{ border:1px solid var(--stroke); border-radius:18px; padding:10px; background: rgba(255,255,255,0.08); }
      .tile-top{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
      .tile-lbl{ font-weight:1000; font-size:11px; color: var(--muted); }
      .tile-bar{ height:10px; border-radius:999px; background: rgba(255,255,255,0.10); overflow:hidden; margin-top:10px; }
      .tile-fill{ height:100%; border-radius:999px; }
      .tile-sub{ margin-top:8px; font-size:11px; color: var(--muted); }

      .nav{
        position: fixed;
        left: 50%;
        bottom: 14px;
        transform: translateX(-50%);
        width: calc(100% - 28px);
        max-width: 420px;
        display:grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
        padding: 10px;
        border-radius: 22px;
        background: rgba(255,255,255,0.16);
        border: 1px solid var(--stroke);
        box-shadow: var(--shadow);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }
      .navbtn{ border:0; background: transparent; color: var(--muted); cursor:pointer; padding: 10px 8px; border-radius: 18px; display:flex; flex-direction:column; align-items:center; gap:6px; font-weight:900; font-size:11px; }
      .navon{ color: var(--text); background: rgba(0,168,224,0.14); }
      .navic{ display:flex; align-items:center; justify-content:center; }
      .navic-on{ color: rgba(0,168,224,0.95); }
      .navlbl{ line-height:1; }

      @media (prefers-reduced-motion: reduce){
        .escort-ring{ animation: none; }
      }
    `}</style>
  );
}
