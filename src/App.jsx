import { useState, useRef } from "react";

const PUZZLES = {
    easy: [
        { subject: "The Godfather", category: "Film", clues: ["Power is inherited, not always earned, in this American saga.", "A wedding opens a story that spans decades of loyalty and betrayal.", "An offer is made that cannot be refused.", "Marlon Brando won an Oscar for this role but did not attend the ceremony.", "Corleone is the family name at the center of this 1972 classic.", "Francis Ford Coppola directed this definitive mob film."] },
        { subject: "Muhammad Ali", category: "Person", clues: ["He floated and stung his way into legend.", "He was stripped of his title for refusing military service.", "Born Cassius Clay, he changed his name after joining a new faith.", "He fought George Foreman in the 'Rumble in the Jungle' in Zaire.", "He lit the Olympic flame at the Atlanta Games in 1996.", "Widely considered the greatest heavyweight boxer of all time."] },
        { subject: "The Great Wall of China", category: "Place", clues: ["Built over centuries by countless hands under imperial command.", "It stretches across mountains, deserts, and rivers in East Asia.", "Contrary to popular myth, it is not clearly visible from space.", "Its primary purpose was to defend against northern nomadic tribes.", "Thousands of workers died during its construction over many dynasties.", "This ancient structure spans thousands of miles across northern China."] },
        { subject: "Chernobyl", category: "Event", clues: ["A night shift decision set off a chain reaction no one could stop.", "An entire city was abandoned within days and remains empty today.", "It happened in 1986 during the final years of the Soviet Union.", "Cleanup workers called liquidators were sent in at enormous personal risk.", "A 2019 HBO miniseries dramatized the disaster and its cover-up.", "Reactor No. 4 at a Ukrainian nuclear plant exploded catastrophically."] },
        { subject: "Freddie Mercury", category: "Person", clues: ["Born in Zanzibar, he became one of the most flamboyant performers in rock history.", "He taught himself piano and had a remarkable four-octave vocal range.", "He wrote a song dedicated entirely to his beloved cats.", "His Live Aid performance in 1985 is called the greatest in rock history.", "He died in 1991, one day after publicly disclosing his illness.", "He was the lead vocalist of the band Queen."] },
        { subject: "Inception", category: "Film", clues: ["A spinning top becomes the most debated object in modern cinema.", "It takes place across multiple nested levels of the same experience.", "The deeper you go, the slower time moves.", "A team is assembled to plant an idea rather than steal one.", "Hans Zimmer's score features a dramatically slowed-down pop song.", "Christopher Nolan directed this 2010 mind-bending thriller."] },
        { subject: "Cleopatra", category: "Person", clues: ["She ruled a kingdom not native to her bloodline.", "She was Greek by descent, not Egyptian.", "She spoke nine languages — the first ruler of her dynasty to speak Egyptian.", "She formed powerful alliances with both Julius Caesar and Mark Antony.", "She is said to have taken her own life using a venomous snake.", "She was the last active ruler of the Ptolemaic Kingdom of Egypt."] },
        { subject: "Machu Picchu", category: "Place", clues: ["It was built at such altitude that clouds pass through it like fog.", "Its stones fit together without mortar so tightly a knife cannot slide between them.", "It was abandoned and lost to the outside world for centuries.", "An American historian named Hiram Bingham brought it to global attention in 1911.", "It sits above the Sacred Valley in South America.", "This Incan citadel in Peru is one of the most visited ancient sites on Earth."] },
        { subject: "Breaking Bad", category: "Film", clues: ["A transformation from meek to menacing drives its entire arc.", "It is set in New Mexico and uses the desert landscape like a character.", "Colors worn by characters carry deliberate symbolic meaning throughout.", "A high school chemistry teacher builds a drug empire over five seasons.", "The protagonist's criminal alias is Heisenberg.", "Bryan Cranston plays Walter White in this acclaimed AMC series."] },
        { subject: "Genghis Khan", category: "Person", clues: ["He united warring nomadic tribes through a combination of merit and fear.", "He established the largest contiguous land empire in history.", "He promoted religious tolerance across his conquered territories.", "He may be the ancestor of roughly 16 million people alive today.", "He swept from China to Eastern Europe in the 13th century.", "He was the founder and supreme ruler of the Mongol Empire."] },
        { subject: "Notre-Dame de Paris", category: "Place", clues: ["Victor Hugo wrote a novel set within and around its walls.", "Its construction took nearly 200 years to complete.", "Its spire collapsed dramatically in a 2019 fire watched live worldwide.", "Famous stone gargoyles line its exterior and serve as water spouts.", "It stands on a small island in the middle of a famous European river.", "This medieval Gothic cathedral in Paris is one of the most visited buildings in the world."] },
        { subject: "Vincent van Gogh", category: "Person", clues: ["He sold only one painting during his lifetime.", "He wrote hundreds of letters to his brother that are now literary classics.", "He cut off part of his own ear during a mental breakdown.", "He produced over 900 paintings in roughly a decade of intense work.", "Starry Night was painted while he was staying in an asylum.", "This Dutch Post-Impressionist painter is now among the most celebrated in history."] },
        { subject: "Hiroshima", category: "Event", clues: ["A single moment in 1945 changed the nature of warfare permanently.", "It was the first use of a nuclear weapon in armed conflict.", "Survivors of the initial blast were called Hibakusha in Japanese.", "A US bomber named Enola Gay carried out the mission.", "The date was August 6, 1945.", "An atomic bomb was dropped on this Japanese city, killing tens of thousands instantly."] },
        { subject: "Nelson Mandela", category: "Person", clues: ["He spent 27 years imprisoned on a remote island before his release.", "His release in 1990 was broadcast live and watched by millions.", "He led negotiations that ended a racially enforced system of governance.", "He shared the Nobel Peace Prize in 1993 with his former adversary.", "He became the first democratically elected president of his country.", "This South African leader dismantled apartheid and became a global symbol of reconciliation."] },
        { subject: "The Berlin Wall", category: "Event", clues: ["It divided a city and became the defining symbol of an era.", "Families were separated overnight when it was built in 1961.", "Crossing it illegally was punishable by death.", "Ronald Reagan famously demanded its removal in a 1987 speech.", "Its fall in November 1989 marked the effective end of the Cold War.", "This concrete barrier divided East and West Germany for 28 years."] }
    ],

    medium: [
        { subject: "Stanley Kubrick", category: "Person", clues: ["He was known to demand dozens of retakes of a single scene, sometimes hundreds.", "He moved to England and barely left his estate for the final decades of his life.", "He directed only 13 feature films across a career spanning nearly five decades.", "He adapted Stephen King, Arthur C. Clarke, and Anthony Burgess for the screen.", "His films include A Clockwork Orange, Barry Lyndon, and The Shining.", "He directed 2001: A Space Odyssey and Full Metal Jacket."] },
        { subject: "Apocalypse Now", category: "Film", clues: ["A documentary about its making is almost as famous as the film itself.", "A typhoon destroyed most of the sets partway through production.", "The lead actor suffered a heart attack while filming in the jungle.", "It transplants a Joseph Conrad novel from Africa to the Vietnam War.", "Marlon Brando arrived overweight, unprepared, and having not read the source material.", "Francis Ford Coppola directed this 1979 war epic about a river journey into darkness."] },
        { subject: "Franz Kafka", category: "Person", clues: ["He worked a day job at an insurance company and wrote only at night.", "He instructed his closest friend to burn all his manuscripts after his death.", "His friend disobeyed, and literature was forever changed.", "His name became an adjective for nightmarish bureaucratic situations.", "He wrote about a travelling salesman who wakes up transformed into a giant insect.", "This Czech writer authored The Trial, The Castle, and The Metamorphosis."] },
        { subject: "Blade Runner", category: "Film", clues: ["It flopped commercially on release and is now a canonized science fiction classic.", "The studio imposed an ending against the director's wishes — multiple cuts exist.", "It asks whether empathy is what separates humans from artificial beings.", "Sean Young plays a replicant who genuinely does not know she is not human.", "Harrison Ford plays a detective hunting artificial humans in a rain-soaked future Los Angeles.", "Ridley Scott directed this 1982 Philip K. Dick adaptation."] },
        { subject: "Salvador Dalí", category: "Person", clues: ["He used dreams, hallucinations, and paranoia as raw creative material.", "He reportedly held a spoon above a plate while dozing to jolt himself into hypnagogic visions.", "He kept a pet ocelot and brought it to public appearances.", "His most famous painting features melting clocks draped across a barren landscape.", "He was expelled from the Surrealist movement by its own founder, André Breton.", "This Spanish painter is best known for The Persistence of Memory."] },
        { subject: "Dostoevsky", category: "Person", clues: ["He was led in front of a firing squad and pardoned at the very last moment.", "He spent four years in a Siberian prison camp that reshaped his worldview entirely.", "A severe gambling addiction kept him in perpetual debt throughout his adult life.", "He wrote novels at speed under contract to escape financial ruin.", "His works wrestle relentlessly with guilt, faith, suffering, and human freedom.", "This 19th-century Russian novelist wrote Crime and Punishment and The Brothers Karamazov."] },
        { subject: "James Baldwin", category: "Person", clues: ["He left the United States for Paris at 24, finding it easier to live freely in Europe.", "He debated Malcolm X and William F. Buckley Jr. on race in America.", "His essays are considered as powerful and enduring as his novels.", "He wrote with surgical precision about race, religion, sexuality, and identity.", "His novel set in Harlem about two brothers was adapted into a film by Barry Jenkins.", "This American writer authored Go Tell It on the Mountain and The Fire Next Time."] },
        { subject: "Ingmar Bergman", category: "Person", clues: ["He grew up under a strict Lutheran father whose severity haunted all his work.", "He made films at a near-annual pace for five uncompromising decades.", "He worked repeatedly with the same actors, building a kind of permanent company.", "His films confront silence, grief, the absence of God, and the difficulty of intimacy.", "A chess match with the figure of Death is his most iconic image.", "This Swedish filmmaker directed The Seventh Seal, Persona, and Scenes from a Marriage."] },
        { subject: "The Truman Show", category: "Film", clues: ["Its central anxiety — that your life is a performance for others — has only grown more prescient.", "The protagonist lives in a purpose-built town under a domed artificial sky.", "Everyone around the main character is a paid actor except him.", "Its star performs with complete sincerity in a world that is entirely fabricated.", "Jim Carrey plays a man who slowly realizes his entire existence is a television program.", "Peter Weir directed this 1998 film about surveillance, identity, and manufactured reality."] },
        { subject: "Syd Barrett", category: "Person", clues: ["He founded one of Britain's most influential psychedelic bands before being quietly removed from it.", "His mental collapse happened rapidly and publicly, possibly accelerated by heavy drug use.", "One day his bandmates simply did not stop to pick him up and never looked back.", "He spent his final decades as a recluse, painting quietly in Cambridge.", "A famous album by his former band is widely understood as a tribute to him.", "He was the original creative force behind Pink Floyd."] },
        { subject: "Pompeii", category: "Event", clues: ["The disaster lasted less than 24 hours but preserved a Roman city perfectly.", "Victims left hollow voids in hardened ash that archaeologists later filled with plaster.", "Residents had no framework to understand what a volcanic eruption even was.", "Excavations have uncovered intact bakeries, brothels, political graffiti, and family homes.", "Pliny the Younger documented the catastrophe in letters that survive to this day.", "Mount Vesuvius buried this thriving Roman city in 79 AD under meters of volcanic ash."] },
        { subject: "Nikola Tesla", category: "Person", clues: ["His most significant contribution is invisible but powers virtually every modern building.", "He had a bitter and very public rivalry with Thomas Edison.", "He claimed to have built a device capable of causing artificial earthquakes.", "He lit up the 1893 World's Fair in Chicago with alternating current.", "He died alone and in debt in a New York hotel room.", "A famous electric vehicle company bears his name, decades after his death."] },
        { subject: "Schindler's List", category: "Film", clues: ["It was shot almost entirely in black and white except for one small detail rendered in red.", "The director said he was too young to make it when he first acquired the rights.", "It is based on a novel about a documented historical rescue operation.", "Its subject matter caused some cinemas to refuse to screen it.", "Liam Neeson plays a German industrialist who saves over a thousand Jewish lives during the Holocaust.", "Steven Spielberg directed this 1993 film considered one of the most important ever made."] },
        { subject: "The Cultural Revolution", category: "Event", clues: ["Schools and universities were shut down for years because education itself was deemed a threat.", "Young people were mobilized into groups that terrorized teachers, parents, and intellectuals.", "Ancient cultural artifacts, books, and temples were systematically destroyed.", "Millions were sent to labor camps or killed across approximately a decade.", "It was framed as a campaign for ideological purity but functioned as a purge.", "Mao Zedong launched this political upheaval in China in 1966."] },
        { subject: "Jean-Michel Basquiat", category: "Person", clues: ["He began as an anonymous street artist leaving cryptic tags across lower Manhattan.", "He went from sleeping in cardboard boxes to selling paintings for tens of thousands in under two years.", "He collaborated closely with Andy Warhol despite their very different worlds.", "His work combined imagery from anatomy, jazz, basketball, and African history.", "He died of a heroin overdose at 27, at the height of his fame.", "This American painter rose from the New York streets to become one of the most valuable artists of the 20th century."] }
    ],

    hard: [
        { subject: "Andrei Tarkovsky", category: "Person", clues: ["He argued that cinema's unique gift was the ability to sculpt time as a material.", "He fought Soviet authorities for creative control of nearly every film he made.", "His work is saturated with water, fire, and takes so long the viewer must feel duration.", "He completed only seven feature films, each one a prolonged act of resistance.", "He died in exile in Paris, having spent years separated from his son by Soviet bureaucracy.", "This Russian filmmaker directed Stalker, Solaris, and The Mirror."] },
        { subject: "Wong Kar-wai", category: "Person", clues: ["He shoots without a complete script — his actors often receive their lines the morning of.", "He once filmed the same movie for an entire year with no fixed ending in mind.", "His films are built from longing, missed connections, and the emotional residue of cities.", "He uses expired film stocks and optical printing as tools for feeling rather than technique.", "Tony Leung appears in almost every major film of his career.", "This Hong Kong filmmaker directed In the Mood for Love and Chungking Express."] },
        { subject: "Sun Ra", category: "Person", clues: ["He claimed alien beings from Saturn gave him a personal mission for humanity.", "He led a large collective of musicians who lived and traveled together like a commune.", "He self-released recordings for decades before independent labels were common.", "He dressed his ensemble in elaborate space costumes and staged concerts as cosmic ceremonies.", "He played jazz but refused the label, insisting his music existed beyond categories.", "This avant-garde bandleader and composer claimed he was not from Alabama but from outer space."] },
        { subject: "Mulholland Drive", category: "Film", clues: ["It began as a rejected television pilot before becoming one of cinema's most analyzed films.", "It contains a scene in a theater where performers lip-sync to a song with no live singer.", "Its two central characters may be the same person, or different people, or projections of each other.", "It portrays Hollywood as a system that devours identity rather than creates it.", "Roger Ebert named it the best film of the 2000s.", "David Lynch directed this 2001 mystery set in Los Angeles."] },
        { subject: "Nusrat Fateh Ali Khan", category: "Person", clues: ["He could perform for hours in a single session, entering states that seemed beyond ordinary consciousness.", "He brought a Sufi devotional music form from South Asia to international concert halls.", "Peter Gabriel signed him to his world music label in the 1980s.", "His voice was described by listeners as unlike anything in recorded music.", "He collaborated with Eddie Vedder on music for the film Dead Man Walking.", "This Pakistani musician was the greatest modern practitioner of qawwali."] },
        { subject: "Gilles Deleuze", category: "Person", clues: ["He lectured for hours without notes to crowded halls at a Paris university.", "He wrote about cinema in two dense volumes, treating film as a mode of philosophical thought.", "He collaborated with a psychoanalyst named Félix Guattari on books that challenged every category.", "His concepts — rhizome, plateau, line of flight — spread through art, theory, and architecture.", "He introduced the idea that thought itself could be non-hierarchical, like roots spreading laterally.", "This French philosopher co-wrote Anti-Oedipus and A Thousand Plateaus."] },
        { subject: "John Cassavetes", category: "Person", clues: ["He funded his independent films by taking acting roles in Hollywood productions he didn't care about.", "He shot in his own home with his wife, close friends, and almost no crew.", "His films feel improvised even when they are meticulously rehearsed — the blur was intentional.", "He is considered the founding figure of American independent cinema.", "His wife Gena Rowlands gave performances under his direction that critics call among the rawest in film history.", "This American filmmaker directed A Woman Under the Influence and Faces."] },
        { subject: "Béla Tarr", category: "Person", clues: ["His films are built from takes that last many minutes, sometimes close to ten, with almost no cuts.", "He shot everything in black and white and refused color throughout his entire career.", "His films reward patience with a sense of duration and dread that few filmmakers can create.", "His most celebrated film is a seven-hour work about the collapse of a Hungarian village.", "He announced his retirement after completing his final feature in 2011.", "This Hungarian filmmaker directed Sátántangó and The Turin Horse."] },
        { subject: "Burial", category: "Person", clues: ["He kept his real identity secret for years, becoming one of electronic music's great anonymous figures.", "His music evokes late-night urban transit, rain-soaked streets, and city loneliness.", "He emerged from UK garage and dubstep but fully belonged to neither.", "His second album was placed at the top of decade-end lists by multiple major publications.", "When his real name was eventually revealed, it changed almost nothing about how the music was heard.", "This London producer made Untrue, a landmark of atmospheric electronic music."] },
        { subject: "Pina Bausch", category: "Person", clues: ["She turned away from traditional dance vocabulary and asked her performers to bring their own experiences.", "Her rehearsal method involved asking dancers questions about their lives and building pieces from their answers.", "Her work is neither pure dance nor pure theater — she invented a form between the two.", "She built a company in an industrial German city that became a pilgrimage site for artists worldwide.", "Wim Wenders made a 3D documentary portrait of her work after her sudden death in 2009.", "This German choreographer founded Tanztheater and led the Wuppertal dance company for four decades."] },
        { subject: "Alejandro Jodorowsky", category: "Person", clues: ["He mounted a production of a sci-fi novel so ambitious it collapsed before filming began and influenced everything after.", "He trained as a mime under Marcel Marceau and a theatre practitioner under Brecht.", "He cast his own family members in some of his most psychologically violent films.", "He developed a therapeutic method called psychomagic that blends ritual with psychological healing.", "His films include El Topo and The Holy Mountain, both made outside any studio system.", "This Chilean-French filmmaker is one of the defining figures of surrealist and cult cinema."] },
        { subject: "Nina Simone", category: "Person", clues: ["She was rejected from a prestigious American conservatory and always believed it was because of her race.", "She trained as a classical pianist and deployed that precision in service of an entirely different form.", "Her political activism made her increasingly difficult for labels and promoters to manage.", "She moved out of the United States permanently and lived in several countries before settling in France.", "Her voice carried a quality that made it almost impossible to categorize by genre.", "This American singer and pianist recorded 'Feeling Good' and became an icon of the civil rights era."] },
        { subject: "Werner Herzog", category: "Person", clues: ["He once ate his own shoe on camera after losing a bet with a fellow filmmaker.", "He dragged a real steamship over a real mountain in the Amazon for a single scene in a film.", "He narrates his documentaries in a tone that sounds like a man delivering news of the apocalypse.", "He has been shot at, nearly killed by avalanche, and survived multiple production disasters — often on purpose.", "He believes the jungle is indifferent and hostile to human life, and makes films that prove it.", "This German filmmaker directed Fitzcarraldo, Aguirre, and the documentary Grizzly Man."] },
        { subject: "Lee 'Scratch' Perry", category: "Person", clues: ["He embedded mirrors, photographs, and organic material into the walls of his studio.", "He believed his recording space was a living spiritual instrument, not merely equipment.", "He pioneered the use of delay, reverb, and tape manipulation as compositional tools.", "He eventually burned his own studio to the ground and relocated to Switzerland.", "Bob Marley recorded some of his most important early work under his production.", "This Jamaican producer is considered the founding architect of dub music."] },
        { subject: "Cassandra Wilson", category: "Person", clues: ["She arrived in New York from Mississippi and immediately disrupted jazz with an outside-in sensibility.", "She brought country music, blues, and folk into a jazz framework without apology.", "She was mentored by Steve Coleman and was part of the M-Base collective in the 1980s.", "Her voice sits low and unhurried, with a phrasing style almost more like a storyteller than a singer.", "Her covers of Robert Johnson and Joni Mitchell songs became defining recordings of the 1990s.", "This American vocalist is considered one of the most distinctive jazz singers of her generation."] }
    ]
};

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
