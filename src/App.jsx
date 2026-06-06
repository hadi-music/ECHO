import { useState, useRef } from "react";
import easyPuzzles from "./data/easy.json";
import mediumPuzzles from "./data/medium.json";
import hardPuzzles from "./data/hard.json";

const ALL_PUZZLES = [...easyPuzzles, ...mediumPuzzles, ...hardPuzzles];

const SCORE_MAP = [1000, 800, 600, 400, 200, 100];
const DIFF_CONFIG = {
    easy: { label: "EASY", color: "#6bff9e" },
    medium: { label: "MEDIUM", color: "#ffd166" },
    hard: { label: "HARD", color: "#ff6b6b" }
};
const DIFFICULTIES = ["easy", "medium", "hard"];

function normalize(str) {
    return str
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
}

const FILLER_WORDS = new Set(["the", "a", "an", "of", "in", "on", "at", "to", "and", "or", "de", "la", "le", "von", "van", "el", "al"]);

function levenshtein(a, b) {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        const curr = [i];
        for (let j = 1; j <= b.length; j++) {
            curr[j] = a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
        }
        prev = curr;
    }
    return prev[b.length];
}

function isCorrect(guess, subject) {
    const g = normalize(guess);
    const s = normalize(subject);

    if (g.length < 3) return false;
    if (g === s) return true;

    const tol = s.length < 8 ? 2 : 3;
    if (levenshtein(g, s) <= tol) return true;

    if (g.length >= 4 && s.includes(g)) return true;
    if (s.length >= 4 && g.includes(s)) return true;

    const gWords = g.split(/\s+/).filter(w => w.length > 0);
    const sWords = s.split(/\s+/).filter(w => w.length > 0);
    const gNonFiller = gWords.filter(w => !FILLER_WORDS.has(w));
    const sNonFiller = sWords.filter(w => !FILLER_WORDS.has(w));

    if (gNonFiller.length === 0) return false;

    const allMatch = gNonFiller.every(gw => sNonFiller.some(sw => sw === gw || sw.startsWith(gw) || gw.startsWith(sw)));
    if (!allMatch) return false;

    const coverage = gNonFiller.length / Math.max(sNonFiller.length, 1);
    return coverage >= 0.5;
}

function warmthColor(score) {
    if (score >= 80) return { bg: "#071a10", border: "#00e06a", text: "#00e06a", label: "VERY WARM" };
    if (score >= 60) return { bg: "#141f04", border: "#99ee33", text: "#99ee33", label: "WARM" };
    if (score >= 40) return { bg: "#1e1800", border: "#ffcc44", text: "#ffcc44", label: "LUKEWARM" };
    if (score >= 20) return { bg: "#1e0d00", border: "#ff7733", text: "#ff7733", label: "COLD" };
    return { bg: "#060618", border: "#4455dd", text: "#4455dd", label: "ICE COLD" };
}

async function getWarmth(guess, subject, category, cluesSoFar) {
    const system = `You judge semantic closeness in a trivia game. Always respond with ONLY a JSON object — no explanation, no markdown, no extra text. Format: {"score": <integer 0-100>, "hint": "<max 7 words>"}`;

    const user = `Correct answer: "${subject}" (${category})
Player guessed: "${guess}"
Clues shown: ${cluesSoFar.map((c, i) => `[${i + 1}] ${c}`).join(" | ")}

Score the guess 0-100 based on contextual closeness:
100 = correct or alternate name
85-99 = same person/work, different phrasing
65-84 = same specific field, era, and cultural context
45-64 = same broad domain, different era or context
25-44 = loosely related, same general area
10-24 = barely connected, only medium in common
0-9 = unrelated

Calibration examples:
- answer=Coppola, guess=Scorsese → 70 (same era US director, similar genre)
- answer=Sun Ra, guess=Miles Davis → 52 (both jazz, very different worlds)
- answer=Tarkovsky, guess=Fellini → 66 (both art cinema masters, different nations)
- answer=Mulholland Drive, guess=Twin Peaks → 82 (same director, same dreamlike tone)
- answer=Nina Simone, guess=Aretha Franklin → 68 (same era, adjacent genres)
- answer=Nina Simone, guess=Beyoncé → 28 (same broad field, totally different era)
- answer=Chernobyl, guess=Fukushima → 63 (same type of event, different scale)
- answer=Genghis Khan, guess=Napoleon → 49 (both conquerors, different civilizations)
- answer=Great Wall of China, guess=Eiffel Tower → 25 (both landmarks, different continent/era)
- answer=Breaking Bad, guess=The Wire → 60 (both prestige crime TV dramas)

Respond ONLY with JSON:`;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                max_tokens: 80,
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user }
                ]
            })
        });
        const data = await response.json();
        if (data.error) { console.error("Groq error:", data.error); return undefined; }
        const text = data.choices?.[0]?.message?.content;
        if (!text) return undefined;
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        return { score: Math.max(0, Math.min(100, Math.round(parsed.score))), hint: parsed.hint };
    } catch (e) {
        console.error("getWarmth failed:", e);
        return undefined;
    }
}

function getTodayDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readLog(date, difficulty) {
    try {
        const raw = localStorage.getItem(`echo_log_${date}-${difficulty}`);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function writeLog(date, difficulty, entry) {
    if (readLog(date, difficulty)) return;
    try { localStorage.setItem(`echo_log_${date}-${difficulty}`, JSON.stringify(entry)); } catch {}
}

export default function App() {
    const today = getTodayDate();

    const [phase, setPhase] = useState("intro");
    const [puzzle, setPuzzle] = useState(null);
    const [revealedCount, setRevealedCount] = useState(1);
    const [guess, setGuess] = useState("");
    const [wrongGuesses, setWrongGuesses] = useState([]);
    const [pendingWarmth, setPendingWarmth] = useState(false);
    const [score, setScore] = useState(0);
    const [shake, setShake] = useState(false);
    const [clueAnim, setClueAnim] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expandedDates, setExpandedDates] = useState({});
    const inputRef = useRef(null);

    const todayPuzzles = {
        easy: ALL_PUZZLES.find(p => p.date === today && p.difficulty === "easy") ?? null,
        medium: ALL_PUZZLES.find(p => p.date === today && p.difficulty === "medium") ?? null,
        hard: ALL_PUZZLES.find(p => p.date === today && p.difficulty === "hard") ?? null,
    };
    const hasTodayPuzzles = DIFFICULTIES.some(d => todayPuzzles[d] !== null);

    const archiveDates = [...new Set(
        ALL_PUZZLES.filter(p => p.date <= today).map(p => p.date)
    )].sort((a, b) => b.localeCompare(a));

    function openArchive() {
        setExpandedDates(prev => ({ ...prev, [today]: true }));
        setPhase("archive");
    }

    function toggleDate(date) {
        setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
    }

    function startPuzzle(p) {
        setPuzzle(p);
        setGuess("");
        setWrongGuesses([]);
        setRevealedCount(1);
        setClueAnim(false);
        setPendingWarmth(false);
        setScore(0);
        setPhase("playing");
        setTimeout(() => inputRef.current?.focus(), 100);
    }

    async function handleGuess() {
        if (!guess.trim() || pendingWarmth) return;
        const currentGuess = guess.trim();

        if (isCorrect(currentGuess, puzzle.subject)) {
            const earned = SCORE_MAP[revealedCount - 1];
            setScore(earned);
            writeLog(puzzle.date, puzzle.difficulty, {
                date: puzzle.date,
                subject: puzzle.subject,
                difficulty: puzzle.difficulty,
                score: earned,
                cluesUsed: revealedCount,
                result: "win"
            });
            setPhase("win");
            return;
        }

        setGuess("");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPendingWarmth(true);

        setWrongGuesses(w => [...w, { text: currentGuess, warmth: null, hint: null }]);

        const result = await getWarmth(currentGuess, puzzle.subject, puzzle.category, puzzle.clues.slice(0, revealedCount));
        setPendingWarmth(false);

        setWrongGuesses(w => {
            const updated = [...w];
            const idx = updated.findLastIndex(g => g.text === currentGuess && g.warmth === null);
            if (idx !== -1) updated[idx] = { text: currentGuess, warmth: result ? result.score : undefined, hint: result ? result.hint : null };
            return updated;
        });

        if (revealedCount >= 6) {
            writeLog(puzzle.date, puzzle.difficulty, {
                date: puzzle.date,
                subject: puzzle.subject,
                difficulty: puzzle.difficulty,
                score: 0,
                cluesUsed: 6,
                result: "lose"
            });
            setTimeout(() => setPhase("lose"), 300);
        } else {
            setClueAnim(true);
            setTimeout(() => setClueAnim(false), 600);
            setRevealedCount(c => c + 1);
        }
    }

    function handleKey(e) { if (e.key === "Enter") handleGuess(); }

    function generateShareText() {
        if (!puzzle) return "";
        const dc = DIFF_CONFIG[puzzle.difficulty];
        const isWin = phase === "win";
        const greens = isWin ? revealedCount : 0;
        const squares = Array.from({ length: 6 }, (_, i) => i < greens ? "🟩" : "⬜").join("");
        return `ECHO – ${puzzle.date}\n${dc.label} ${puzzle.category}\n${squares}\nScore: ${score} · Clue ${revealedCount} of 6\nplay.echogame.com`;
    }

    async function handleShare() {
        try {
            await navigator.clipboard.writeText(generateShareText());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    }

    const cfg = puzzle ? DIFF_CONFIG[puzzle.difficulty] : null;
    const cluesLeft = 6 - revealedCount;

    return (
        <div style={{
            minHeight: "100vh", background: "#0a0a0a", color: "#f0ede6",
            fontFamily: "'Courier New', monospace",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "20px"
        }}>
            <div style={{ width: "100%", maxWidth: "560px" }}>

                {/* ── INTRO ── */}
                {phase === "intro" && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "13px", letterSpacing: "0.3em", color: "#aaaaaa", marginBottom: "12px" }}>A DEDUCTION GAME</div>
                        <h1 style={{
                            fontSize: "56px", fontWeight: 900, letterSpacing: "-0.03em",
                            margin: "0 0 24px", color: "#f0ede6"
                        }}>ECHO</h1>
                        <p style={{ color: "#aaaaaa", fontSize: "14px", lineHeight: 1.9, marginBottom: "36px", letterSpacing: "0.05em" }}>
                            Six clues. One answer.<br />
                            Guess sooner. Score higher.<br />
                            Wrong guess? See how warm you are.
                        </p>

                        {hasTodayPuzzles ? (
                            <>
                                <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#aaaaaa", marginBottom: "12px" }}>
                                    TODAY · {today}
                                </div>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                                    {DIFFICULTIES.map(diff => {
                                        const p = todayPuzzles[diff];
                                        if (!p) return null;
                                        const log = readLog(today, diff);
                                        const dc = DIFF_CONFIG[diff];
                                        return (
                                            <button key={diff} onClick={() => startPuzzle(p)} style={{
                                                flex: 1, minHeight: "110px",
                                                background: "#0d0d0d",
                                                border: `1px solid ${log ? dc.color + "55" : "#1e1e1e"}`,
                                                color: "#f0ede6", padding: "14px 10px",
                                                cursor: "pointer", fontFamily: "'Courier New', monospace",
                                                textAlign: "center", display: "flex", flexDirection: "column",
                                                alignItems: "center", justifyContent: "center", gap: "6px"
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = dc.color + "99"}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = log ? dc.color + "55" : "#1e1e1e"}
                                            >
                                                <div style={{ fontSize: "10px", letterSpacing: "0.18em", color: dc.color }}>{dc.label}</div>
                                                <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "#aaaaaa" }}>
                                                    {p.category.toUpperCase()}
                                                </div>
                                                {log ? (
                                                    <div style={{ textAlign: "center" }}>
                                                        <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: log.result === "win" ? "#6bff9e" : "#ff4444", marginBottom: "2px" }}>
                                                            {log.result === "win" ? "WIN" : "LOSE"}
                                                        </div>
                                                        {log.result === "win" && (
                                                            <div style={{ fontSize: "24px", fontWeight: 700, color: dc.color, lineHeight: 1 }}>{log.score}</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: "13px", color: "#888" }}>→</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button onClick={openArchive} style={{
                                    width: "100%", background: "transparent", border: "1px solid #1e1e1e",
                                    color: "#aaaaaa", padding: "12px", fontSize: "12px", letterSpacing: "0.15em",
                                    fontFamily: "'Courier New', monospace", cursor: "pointer"
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#cccccc"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.color = "#aaaaaa"; }}
                                >ARCHIVE</button>
                            </>
                        ) : (
                            <>
                                <div style={{ color: "#aaaaaa", marginBottom: "28px" }}>
                                    <div style={{ fontSize: "17px", marginBottom: "8px" }}>No puzzle today. Come back tomorrow.</div>
                                    <div style={{ fontSize: "13px", letterSpacing: "0.15em", color: "#aaaaaa" }}>{today}</div>
                                </div>
                                <button onClick={openArchive} style={{
                                    width: "100%", background: "transparent", border: "1px solid #1e1e1e",
                                    color: "#aaaaaa", padding: "14px", fontSize: "13px", letterSpacing: "0.15em",
                                    fontFamily: "'Courier New', monospace", cursor: "pointer"
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#cccccc"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.color = "#aaaaaa"; }}
                                >ARCHIVE</button>
                            </>
                        )}
                    </div>
                )}

                {/* ── ARCHIVE ── */}
                {phase === "archive" && (
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
                            <button onClick={() => setPhase("intro")} style={{
                                background: "none", border: "none", color: "#aaaaaa",
                                fontFamily: "'Courier New', monospace", fontSize: "13px",
                                letterSpacing: "0.1em", cursor: "pointer", padding: 0
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = "#cccccc"}
                                onMouseLeave={e => e.currentTarget.style.color = "#aaaaaa"}
                            >← BACK</button>
                            <div style={{ fontSize: "13px", letterSpacing: "0.3em", color: "#aaaaaa" }}>ARCHIVE</div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "72vh", overflowY: "auto" }}>
                            {archiveDates.map(date => {
                                const isToday = date === today;
                                const isExpanded = !!expandedDates[date];
                                const logs = {
                                    easy: readLog(date, "easy"),
                                    medium: readLog(date, "medium"),
                                    hard: readLog(date, "hard"),
                                };

                                return (
                                    <div key={date} style={{ border: `1px solid ${isToday ? "#252525" : "#181818"}` }}>
                                        {/* Summary row */}
                                        <div onClick={() => toggleDate(date)} style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            padding: "11px 14px", cursor: "pointer",
                                            background: isExpanded ? "#111" : "#0d0d0d"
                                        }}
                                            onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "#0f0f0f"; }}
                                            onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = "#0d0d0d"; }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                                <span style={{ fontSize: "12px", color: isToday ? "#cccccc" : "#aaaaaa", letterSpacing: "0.05em", minWidth: "88px" }}>
                                                    {date}
                                                </span>
                                                <div style={{ display: "flex", gap: "5px" }}>
                                                    {DIFFICULTIES.map(diff => {
                                                        const log = logs[diff];
                                                        const dc = DIFF_CONFIG[diff];
                                                        return (
                                                            <div key={diff} style={{
                                                                width: "7px", height: "7px", borderRadius: "1px",
                                                                background: log
                                                                    ? (log.result === "win" ? dc.color : "#ff4444")
                                                                    : "#252525"
                                                            }} />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: "11px", color: "#888" }}>{isExpanded ? "▲" : "▼"}</span>
                                        </div>

                                        {/* Expanded difficulty slots */}
                                        {isExpanded && (
                                            <div style={{ borderTop: "1px solid #181818" }}>
                                                {DIFFICULTIES.map(diff => {
                                                    const p = ALL_PUZZLES.find(px => px.date === date && px.difficulty === diff);
                                                    if (!p) return null;
                                                    const log = logs[diff];
                                                    const dc = DIFF_CONFIG[diff];
                                                    return (
                                                        <div key={diff} onClick={() => startPuzzle(p)} style={{
                                                            display: "flex", alignItems: "center",
                                                            justifyContent: "space-between",
                                                            padding: "10px 14px", background: "#0a0a0a",
                                                            cursor: "pointer", borderBottom: "1px solid #111"
                                                        }}
                                                            onMouseEnter={e => e.currentTarget.style.background = "#0f0f0f"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "#0a0a0a"}
                                                        >
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                <span style={{
                                                                    fontSize: "10px", letterSpacing: "0.15em", color: dc.color,
                                                                    border: `1px solid ${dc.color}40`, padding: "2px 6px"
                                                                }}>{dc.label}</span>
                                                                <span style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.08em" }}>
                                                                    {p.category.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            {log ? (
                                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    <span style={{
                                                                        fontSize: "11px", letterSpacing: "0.12em", fontWeight: 700,
                                                                        color: log.result === "win" ? "#6bff9e" : "#ff4444"
                                                                    }}>{log.result === "win" ? "WIN" : "LOSE"}</span>
                                                                    <span style={{ fontSize: "12px", color: "#aaaaaa" }}>{log.score}</span>
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontSize: "12px", color: "#888" }}>→</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── PLAYING ── */}
                {phase === "playing" && puzzle && (
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                            <div>
                                <span onClick={() => setPhase("intro")} style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.03em", color: "#f0ede6", cursor: "pointer" }}>ECHO</span>
                                <span style={{ fontSize: "12px", letterSpacing: "0.2em", color: cfg.color, marginLeft: "12px" }}>{cfg.label}</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "12px", letterSpacing: "0.15em", color: "#aaaaaa" }}>CATEGORY</div>
                                <div style={{ fontSize: "14px", letterSpacing: "0.1em" }}>{puzzle.category.toUpperCase()}</div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "5px", marginBottom: "24px" }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} style={{ flex: 1, height: "2px", backgroundColor: i <= revealedCount ? cfg.color : "#1e1e1e", transition: "background-color 0.3s" }} />
                            ))}
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            {puzzle.clues.slice(0, revealedCount).map((clue, i) => (
                                <div key={i} style={{
                                    padding: "14px 18px", marginBottom: "7px",
                                    background: i === revealedCount - 1 ? "#0f0f0f" : "transparent",
                                    borderLeft: `2px solid ${i === revealedCount - 1 ? cfg.color : "#1e1e1e"}`,
                                    animation: (i === revealedCount - 1 && clueAnim) ? "slideIn 0.45s ease" : "none"
                                }}>
                                    <div style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.15em", marginBottom: "5px" }}>CLUE {i + 1} · {SCORE_MAP[i]} PTS</div>
                                    <div style={{ fontSize: "17px", lineHeight: 1.55, color: i === revealedCount - 1 ? "#f0ede6" : "#aaaaaa" }}>{clue}</div>
                                </div>
                            ))}
                        </div>

                        {wrongGuesses.length > 0 && (
                            <div style={{ marginBottom: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                {wrongGuesses.map((w, i) => {
                                    const wc = w.warmth !== null && w.warmth !== undefined ? warmthColor(w.warmth) : null;
                                    return (
                                        <div key={i} style={{
                                            display: "flex", alignItems: "center", gap: "10px",
                                            background: wc ? wc.bg : "#0f0f0f",
                                            border: `1px solid ${wc ? wc.border : "#222"}`,
                                            padding: "9px 13px", animation: "fadeIn 0.3s ease"
                                        }}>
                                            <span style={{ color: wc ? wc.text : "#aaaaaa", fontSize: "14px", flex: 1 }}>✗ {w.text}</span>
                                            {w.warmth === null ? (
                                                <span style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.1em" }}>reading...</span>
                                            ) : w.warmth === undefined ? (
                                                <span style={{ fontSize: "12px", color: "#888" }}>—</span>
                                            ) : (
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontSize: "17px", fontWeight: 700, color: wc.text, lineHeight: 1 }}>{w.warmth}°</div>
                                                    <div style={{ fontSize: "11px", color: wc.text, opacity: 0.7, letterSpacing: "0.08em", marginTop: "2px" }}>{wc.label}</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "8px", animation: shake ? "shake 0.4s ease" : "none" }}>
                            <input
                                ref={inputRef}
                                value={guess}
                                onChange={e => setGuess(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder={pendingWarmth ? "measuring warmth..." : "Your answer..."}
                                disabled={pendingWarmth}
                                style={{
                                    flex: 1, background: "#0f0f0f", border: "1px solid #222",
                                    color: "#f0ede6", padding: "13px 15px", fontSize: "17px",
                                    fontFamily: "'Courier New', monospace", outline: "none",
                                    opacity: pendingWarmth ? 0.5 : 1, transition: "opacity 0.2s"
                                }}
                            />
                            <button onClick={handleGuess} disabled={pendingWarmth} style={{
                                background: pendingWarmth ? "#151515" : cfg.color,
                                color: pendingWarmth ? "#555" : "#0a0a0a",
                                border: "none", padding: "13px 20px", fontSize: "13px",
                                letterSpacing: "0.2em", fontFamily: "'Courier New', monospace",
                                fontWeight: 700, cursor: pendingWarmth ? "not-allowed" : "pointer",
                                transition: "background 0.2s"
                            }}>GUESS</button>
                        </div>
                        <div style={{ marginTop: "10px", fontSize: "12px", color: "#888", letterSpacing: "0.1em" }}>
                            {cluesLeft > 0 ? `${cluesLeft} clue${cluesLeft > 1 ? "s" : ""} remaining` : "Last clue — final chance"}
                        </div>
                    </div>
                )}

                {/* ── WIN ── */}
                {phase === "win" && puzzle && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "12px", letterSpacing: "0.3em", color: cfg.color, marginBottom: "10px" }}>CORRECT</div>
                        <div style={{ fontSize: "clamp(31px, 7vw, 62px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "6px" }}>
                            {puzzle.subject.toUpperCase()}
                        </div>
                        <div style={{ color: "#aaaaaa", fontSize: "13px", marginBottom: "32px" }}>{puzzle.category} · Clue {revealedCount} of 6</div>
                        <div style={{ background: "#0f0f0f", border: `1px solid ${cfg.color}30`, padding: "24px", marginBottom: "28px", display: "inline-block", minWidth: "180px" }}>
                            <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#aaaaaa", marginBottom: "6px" }}>SCORE</div>
                            <div style={{ fontSize: "62px", fontWeight: 900, color: cfg.color }}>+{score}</div>
                        </div>
                        <br />
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                            <button onClick={handleShare} style={{
                                background: cfg.color, color: "#0a0a0a", border: "none", padding: "14px 36px",
                                fontSize: "13px", letterSpacing: "0.2em", fontFamily: "'Courier New', monospace",
                                fontWeight: 700, cursor: "pointer", minWidth: "180px"
                            }}>{copied ? "COPIED!" : "SHARE"}</button>
                            <button onClick={openArchive} style={{
                                background: "transparent", border: "1px solid #1e1e1e",
                                color: "#aaaaaa", padding: "12px 36px", minWidth: "180px",
                                fontSize: "13px", letterSpacing: "0.15em",
                                fontFamily: "'Courier New', monospace", cursor: "pointer"
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#cccccc"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.color = "#aaaaaa"; }}
                            >ARCHIVE</button>
                            <button onClick={() => setPhase("intro")} style={{
                                background: "transparent", border: "none",
                                color: "#888", fontSize: "12px", letterSpacing: "0.15em",
                                fontFamily: "'Courier New', monospace", cursor: "pointer"
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = "#aaaaaa"}
                                onMouseLeave={e => e.currentTarget.style.color = "#888"}
                            >← HOME</button>
                        </div>
                    </div>
                )}

                {/* ── LOSE ── */}
                {phase === "lose" && puzzle && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "12px", letterSpacing: "0.3em", color: "#ff4444", marginBottom: "10px" }}>OUT OF CLUES</div>
                        <div style={{ fontSize: "clamp(31px, 7vw, 62px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "6px", color: "#aaaaaa" }}>
                            {puzzle.subject.toUpperCase()}
                        </div>
                        <div style={{ color: "#aaaaaa", fontSize: "13px", marginBottom: "36px" }}>{puzzle.category} · Better luck next time</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                            <button onClick={handleShare} style={{
                                background: "#f0ede6", color: "#0a0a0a", border: "none", padding: "14px 36px",
                                fontSize: "13px", letterSpacing: "0.2em", fontFamily: "'Courier New', monospace",
                                fontWeight: 700, cursor: "pointer", minWidth: "180px"
                            }}>{copied ? "COPIED!" : "SHARE"}</button>
                            <button onClick={openArchive} style={{
                                background: "transparent", border: "1px solid #1e1e1e",
                                color: "#aaaaaa", padding: "12px 36px", minWidth: "180px",
                                fontSize: "13px", letterSpacing: "0.15em",
                                fontFamily: "'Courier New', monospace", cursor: "pointer"
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#cccccc"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.color = "#aaaaaa"; }}
                            >ARCHIVE</button>
                            <button onClick={() => setPhase("intro")} style={{
                                background: "transparent", border: "none",
                                color: "#888", fontSize: "12px", letterSpacing: "0.15em",
                                fontFamily: "'Courier New', monospace", cursor: "pointer"
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = "#aaaaaa"}
                                onMouseLeave={e => e.currentTarget.style.color = "#888"}
                            >← HOME</button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        input::placeholder{color:#666}
        button{transition:opacity 0.15s, transform 0.1s}
        button:hover:not(:disabled){opacity:0.82}
        button:active:not(:disabled){transform:scale(0.97)}
      `}</style>
        </div>
    );
}
