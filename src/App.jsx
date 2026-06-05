import { useState, useRef } from "react";
import easyPuzzles from "./data/easy.json";
import mediumPuzzles from "./data/medium.json";
import hardPuzzles from "./data/hard.json";

const PUZZLES = { easy: easyPuzzles, medium: mediumPuzzles, hard: hardPuzzles };

const SCORE_MAP = [1000, 800, 600, 400, 200, 100];
const DIFF_CONFIG = {
    easy: { label: "EASY", color: "#6bff9e", desc: "Universally known — culture, history, science." },
    medium: { label: "MEDIUM", color: "#ffd166", desc: "Culturally significant — you've likely heard of them." },
    hard: { label: "HARD", color: "#ff6b6b", desc: "Cult and niche — for the genuinely obsessive." }
};

// Strip diacritics (é→e, ö→o, etc.) then lowercase and strip non-alphanumeric
function normalize(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove combining diacritics
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
}

// Words that are never enough on their own to identify an answer
const FILLER_WORDS = new Set(["the", "a", "an", "of", "in", "on", "at", "to", "and", "or", "de", "la", "le", "von", "van", "el", "al"]);

function isCorrect(guess, subject) {
    const g = normalize(guess);
    const s = normalize(subject);

    // Must be at least 3 characters
    if (g.length < 3) return false;

    // Exact match (after normalization)
    if (g === s) return true;

    // Split into words for smarter matching
    const gWords = g.split(/\s+/).filter(w => w.length > 0);
    const sWords = s.split(/\s+/).filter(w => w.length > 0);

    // Guess must cover a meaningful portion: at least half the subject's words
    // AND all guessed words must appear in the subject
    const gNonFiller = gWords.filter(w => !FILLER_WORDS.has(w));
    const sNonFiller = sWords.filter(w => !FILLER_WORDS.has(w));

    if (gNonFiller.length === 0) return false;

    // All non-filler guess words must exist in subject's non-filler words
    const allMatch = gNonFiller.every(gw => sNonFiller.some(sw => sw === gw || sw.startsWith(gw) || gw.startsWith(sw)));

    if (!allMatch) return false;

    // Guess must cover at least half the subject's meaningful words
    const coverage = gNonFiller.length / Math.max(sNonFiller.length, 1);
    return coverage >= 0.5;
}
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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

export default function App() {
    const [phase, setPhase] = useState("intro");
    const [difficulty, setDifficulty] = useState(null);
    const [queue, setQueue] = useState([]);
    const [puzzle, setPuzzle] = useState(null);
    const [revealedCount, setRevealedCount] = useState(1);
    const [guess, setGuess] = useState("");
    const [wrongGuesses, setWrongGuesses] = useState([]);
    const [pendingWarmth, setPendingWarmth] = useState(false);
    const [score, setScore] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [round, setRound] = useState(0);
    const [shake, setShake] = useState(false);
    const [clueAnim, setClueAnim] = useState(false);
    const inputRef = useRef(null);

    function selectDifficulty(diff) {
        setDifficulty(diff);
        setTotalScore(0);
        setRound(0);
        const q = shuffle(PUZZLES[diff]);
        startRound(q, diff);
    }

    function startRound(q, diff) {
        const usedDiff = diff || difficulty;
        let currentQ = q;
        if (!currentQ || currentQ.length === 0) currentQ = shuffle(PUZZLES[usedDiff]);
        const next = currentQ[0];
        setQueue(currentQ.slice(1));
        setPuzzle(next);
        setGuess("");
        setWrongGuesses([]);
        setRevealedCount(1);
        setClueAnim(false);
        setPendingWarmth(false);
        setPhase("playing");
        setTimeout(() => inputRef.current?.focus(), 100);
    }

    async function handleGuess() {
        if (!guess.trim() || pendingWarmth) return;
        const currentGuess = guess.trim();

        if (isCorrect(currentGuess, puzzle.subject)) {
            const earned = SCORE_MAP[revealedCount - 1];
            setScore(earned);
            setTotalScore(t => t + earned);
            setRound(r => r + 1);
            setPhase("win");
            return;
        }

        setGuess("");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPendingWarmth(true);

        // Placeholder
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
            setRound(r => r + 1);
            setTimeout(() => setPhase("lose"), 300);
        } else {
            setClueAnim(true);
            setTimeout(() => setClueAnim(false), 600);
            setRevealedCount(c => c + 1);
        }
    }

    function handleKey(e) { if (e.key === "Enter") handleGuess(); }

    const cfg = difficulty ? DIFF_CONFIG[difficulty] : null;
    const cluesLeft = 6 - revealedCount;

    return (
        <div style={{
            minHeight: "100vh", background: "#0a0a0a", color: "#f0ede6",
            fontFamily: "'Courier New', monospace",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "20px"
        }}>
            {round > 0 && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0,
                    background: "#0d0d0d", borderBottom: "1px solid #181818",
                    padding: "10px 20px", display: "flex", justifyContent: "space-between",
                    fontSize: "11px", letterSpacing: "0.15em", color: "#555", zIndex: 10
                }}>
                    <span style={{ color: cfg?.color }}>● {cfg?.label}</span>
                    <span>ROUND {round}</span>
                    <span style={{ color: "#f0ede6" }}>TOTAL: {totalScore}</span>
                </div>
            )}

            <div style={{ width: "100%", maxWidth: "560px" }}>

                {phase === "intro" && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "11px", letterSpacing: "0.3em", color: "#444", marginBottom: "12px" }}>A DEDUCTION GAME</div>
                        <h1 style={{
                            fontSize: "clamp(72px, 16vw, 130px)", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 6px",
                            background: "linear-gradient(135deg, #f0ede6 0%, #555 100%)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                        }}>ECHO</h1>
                        <p style={{ color: "#555", fontSize: "12px", lineHeight: 1.9, marginBottom: "48px", letterSpacing: "0.05em" }}>
                            Six clues. One answer.<br />
                            Guess sooner. Score higher.<br />
                            Wrong guess? See how warm you are.
                        </p>
                        <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#444", marginBottom: "20px" }}>CHOOSE DIFFICULTY</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {Object.entries(DIFF_CONFIG).map(([key, val]) => (
                                <button key={key} onClick={() => selectDifficulty(key)} style={{
                                    background: "transparent", border: "1px solid #1e1e1e",
                                    color: "#f0ede6", padding: "18px 24px", cursor: "pointer",
                                    fontFamily: "'Courier New', monospace", textAlign: "left",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    transition: "border-color 0.2s, background 0.2s"
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = val.color; e.currentTarget.style.background = "#0f0f0f"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.background = "transparent"; }}
                                >
                                    <div>
                                        <div style={{ fontSize: "13px", letterSpacing: "0.2em", color: val.color, marginBottom: "4px" }}>{val.label}</div>
                                        <div style={{ fontSize: "11px", color: "#555" }}>{val.desc}</div>
                                    </div>
                                    <span style={{ color: "#333" }}>→</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {phase === "playing" && puzzle && (
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                            <div>
                                <span onClick={() => setPhase("intro")} style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-0.03em", color: "#f0ede6", cursor: "pointer" }}>ECHO</span>
                                <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: cfg.color, marginLeft: "12px" }}>{cfg.label}</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "#444" }}>CATEGORY</div>
                                <div style={{ fontSize: "12px", letterSpacing: "0.1em" }}>{puzzle.category.toUpperCase()}</div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "5px", marginBottom: "24px" }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} style={{ flex: 1, height: "2px", background: i <= revealedCount ? cfg.color : "#1e1e1e", transition: "background 0.3s" }} />
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
                                    <div style={{ fontSize: "9px", color: "#444", letterSpacing: "0.15em", marginBottom: "5px" }}>CLUE {i + 1} · {SCORE_MAP[i]} PTS</div>
                                    <div style={{ fontSize: "14px", lineHeight: 1.55, color: i === revealedCount - 1 ? "#f0ede6" : "#555" }}>{clue}</div>
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
                                            <span style={{ color: wc ? wc.text : "#555", fontSize: "12px", flex: 1 }}>✗ {w.text}</span>
                                            {w.warmth === null ? (
                                                <span style={{ fontSize: "10px", color: "#444", letterSpacing: "0.1em" }}>reading...</span>
                                            ) : w.warmth === undefined ? (
                                                <span style={{ fontSize: "10px", color: "#333" }}>—</span>
                                            ) : (
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontSize: "14px", fontWeight: 700, color: wc.text, lineHeight: 1 }}>{w.warmth}°</div>
                                                    <div style={{ fontSize: "9px", color: wc.text, opacity: 0.7, letterSpacing: "0.08em", marginTop: "2px" }}>{wc.label}</div>
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
                                    color: "#f0ede6", padding: "13px 15px", fontSize: "14px",
                                    fontFamily: "'Courier New', monospace", outline: "none",
                                    opacity: pendingWarmth ? 0.5 : 1, transition: "opacity 0.2s"
                                }}
                            />
                            <button onClick={handleGuess} disabled={pendingWarmth} style={{
                                background: pendingWarmth ? "#151515" : cfg.color,
                                color: pendingWarmth ? "#444" : "#0a0a0a",
                                border: "none", padding: "13px 20px", fontSize: "11px",
                                letterSpacing: "0.2em", fontFamily: "'Courier New', monospace",
                                fontWeight: 700, cursor: pendingWarmth ? "not-allowed" : "pointer",
                                transition: "background 0.2s"
                            }}>GUESS</button>
                        </div>
                        <div style={{ marginTop: "10px", fontSize: "10px", color: "#2e2e2e", letterSpacing: "0.1em" }}>
                            {cluesLeft > 0 ? `${cluesLeft} clue${cluesLeft > 1 ? "s" : ""} remaining` : "Last clue — final chance"}
                        </div>
                    </div>
                )}

                {phase === "win" && puzzle && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "10px", letterSpacing: "0.3em", color: cfg.color, marginBottom: "10px" }}>CORRECT</div>
                        <div style={{ fontSize: "clamp(26px, 6vw, 52px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "6px" }}>
                            {puzzle.subject.toUpperCase()}
                        </div>
                        <div style={{ color: "#444", fontSize: "11px", marginBottom: "32px" }}>{puzzle.category} · Clue {revealedCount} of 6</div>
                        <div style={{ background: "#0f0f0f", border: `1px solid ${cfg.color}30`, padding: "24px", marginBottom: "28px", display: "inline-block", minWidth: "180px" }}>
                            <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "#444", marginBottom: "6px" }}>SCORE</div>
                            <div style={{ fontSize: "52px", fontWeight: 900, color: cfg.color }}>+{score}</div>
                            <div style={{ fontSize: "10px", color: "#444", marginTop: "4px" }}>TOTAL: {totalScore}</div>
                        </div>
                        <br />
                        <button onClick={() => startRound(queue)} style={{
                            background: cfg.color, color: "#0a0a0a", border: "none", padding: "14px 36px",
                            fontSize: "11px", letterSpacing: "0.2em", fontFamily: "'Courier New', monospace",
                            fontWeight: 700, cursor: "pointer"
                        }}>NEXT ROUND</button>
                        <br />
                        <button onClick={() => setPhase("intro")} style={{
                            marginTop: "14px", background: "transparent", border: "none",
                            color: "#2a2a2a", fontSize: "10px", letterSpacing: "0.15em",
                            fontFamily: "'Courier New', monospace", cursor: "pointer"
                        }}>← CHANGE DIFFICULTY</button>
                    </div>
                )}

                {phase === "lose" && puzzle && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "10px", letterSpacing: "0.3em", color: "#ff4444", marginBottom: "10px" }}>OUT OF CLUES</div>
                        <div style={{ fontSize: "clamp(26px, 6vw, 52px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "6px", color: "#444" }}>
                            {puzzle.subject.toUpperCase()}
                        </div>
                        <div style={{ color: "#333", fontSize: "11px", marginBottom: "32px" }}>{puzzle.category} · Better luck next round</div>
                        <div style={{ color: "#444", fontSize: "11px", marginBottom: "28px" }}>Total: {totalScore}</div>
                        <button onClick={() => startRound(queue)} style={{
                            background: "#f0ede6", color: "#0a0a0a", border: "none", padding: "14px 36px",
                            fontSize: "11px", letterSpacing: "0.2em", fontFamily: "'Courier New', monospace",
                            fontWeight: 700, cursor: "pointer"
                        }}>NEXT ROUND</button>
                        <br />
                        <button onClick={() => setPhase("intro")} style={{
                            marginTop: "14px", background: "transparent", border: "none",
                            color: "#2a2a2a", fontSize: "10px", letterSpacing: "0.15em",
                            fontFamily: "'Courier New', monospace", cursor: "pointer"
                        }}>← CHANGE DIFFICULTY</button>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        input::placeholder{color:#2e2e2e}
        button{transition:opacity 0.15s, transform 0.1s}
        button:hover:not(:disabled){opacity:0.82}
        button:active:not(:disabled){transform:scale(0.97)}
      `}</style>
        </div>
    );
}
