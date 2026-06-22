import { useRef, useState } from "react";
import "./index.css";

const init_cups = [
    { id: "cup-a", position: 0},
    { id: "cup-b", position: 1},
    { id: "cup-c", position: 2},
];

const levels = {
    beginner: {
        label: "Beginner",
        moveDuration: 700,
        pause: 150,
        shuffleCount: 7,
    },
    intermediate: {
        label: "Intermediate",
        moveDuration: 420,
        pause: 90,
        shuffleCount: 10,
    },

    impossible: {
        label: "Impossible",
        moveDuration: 220,
        pause: 40,
        shuffleCount: 15,
    },
};

const pos_label = ["left", "middle", "right"];

function sleep(milliseconds){
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

function swapRandCupPos(cups) {
    const firstId = Math.floor(Math.random() * cups.length);

    let secondId;

    do {
        secondId = Math.floor(Math.random() * cups.length);
    } while (secondId === firstId);

    const firstCup = cups[firstId];
    const secondCup = cups[secondId];

    const nextCups = cups.map((cup) => {
        if (cup.id === firstCup.id) {
            return {
                ...cup,
                position: secondCup.position,
            };
        }

        if (cup.id === secondCup.id) {
            return {
                ...cup,
                position: firstCup.position,
            };
        }
        return cup;
    });

    return {
        nextCups,
        upperCupId: firstCup.id,
        lowerCupId: secondCup.id,
    };
}

function App() {
    const [cups, setCups] = useState(init_cups);
    const [level, setLevel] = useState("beginner");
    const [phase, setPhase] = useState("ready");
    const [ballCupId, setBallCupId] = useState(null);
    const [selectedCupId, setSelectedCupId] = useState(null);
    const [msg, setMsg] = useState(
        "Select a difficulty and start the game"
    );

    const [movingCups, setMovingCups] = useState({
        upperCupId: null,
        lowerCupId: null,
    });

    const gameRunning = useRef(false);

    const levelSettings = levels[level];

    const startGame = async () => {
        if (gameRunning.current){
            return;
        }
    

        gameRunning.current = true;

        const resetCups = init_cups.map((cup) => ({ ...cup }));

        setPhase("resetting");
        setCups(resetCups);
        setSelectedCupId(null);
        setMsg("Get ready... 3.. 2.. 1..")

        await sleep(200);

        const randCup = resetCups[Math.floor(Math.random() * resetCups.length)];

        setBallCupId(randCup.id);
        setPhase("reveal");
        setMsg("Remember which cup has the ball!");

        await sleep(2000);

        setPhase("covering");
        setMsg("The cups are shuffling..")

        let currentCups = resetCups;

        for (
            let shuffleNumber = 0;
            shuffleNumber < levelSettings.shuffleCount;
            shuffleNumber += 1
        ) {
            const {
                nextCups,
                upperCupId,
                lowerCupId,
            } = swapRandCupPos(currentCups);

            setMovingCups({
                upperCupId,
                lowerCupId,
            });

            currentCups = nextCups;
            setCups(nextCups);

            setMovingCups({
                upperCupId,
                lowerCupId,
            });

            await sleep(levelSettings.moveDuration);

            setMovingCups({
                upperCupId: null,
                lowerCupId: null,
            });

            await sleep(levelSettings.pause);
        }

        setMovingCups({
            upperCupId: null,
            lowerCupId: null,
        });

        setPhase("guessing");
        setMsg("Which cup is hiding the ball?");
        gameRunning.current = false;
    };
  
const handleCupSelect = (cupId) => {
    if (phase !== "guessing"){
        return;
    }

    setSelectedCupId(cupId);
    setPhase("result");

    if (cupId === ballCupId){
        setMsg("Correct! You found the ball!");
    } else {
        setMsg("Incorrect. That cup was empty.")
    }
};

const canSelectCup = phase === "guessing";
const canSelectLevel = 
    phase === "ready" || phase === "result";

const canStartGame =
    phase === "ready" || phase === "result";

return (
    <main className="game-page">
        <section className="game-container">
            <header className="game-header">
                <h1>Find the Ball</h1>
                <p>
                    Remember the correct cup, follow it during the shuffle, and select it at the end.
                </p>
            </header>
            <div className="controls">
                <label htmlFor="difficulty">Difficulty</label>

                <select
                    id="difficulty"
                    value={level}
                    disabled={!canSelectLevel}
                    onChange={(event) =>
                        setLevel(event.target.value)
                    }
                >
                    {Object.entries(levels).map(
                        ([difficultyName, settings]) => (
                            <option
                                key={difficultyName}
                                value={difficultyName}
                            >
                                {settings.label}
                            </option>
                        )
                    )}
                </select>

                <button
                    type="button"
                    className="start-button"
                    disabled={!canStartGame}
                    onClick={startGame}
                >
                    {phase === "result" ? "Play Again" : "Start Game"}
                </button>
            </div>

            <p className="game-message" aria-live="polite">
                {msg}
            </p>

            <div className="game-board">
                <div className="table-libe" />

                {cups.map((cup) => {
                    const cupIsUp = 
                        (phase === "reveal" &&
                            cup.id === ballCupId
                        ) ||
                        (phase === "result" &&
                            cup.id === selectedCupId
                        );
                    
                    const movesAbove = 
                        movingCups.upperCupId === cup.id;
                    
                    const movesBelow = 
                        movingCups.lowerCupId === cup.id;
                        
                    const ballIsVisable = 
                        (phase === "reveal" &&
                            cup.id === ballCupId
                        ) ||
                        (phase === "result" &&
                            cup.id === selectedCupId &&
                            cup.id === ballCupId
                        );
                    
                        const leftPos = (cup.position + 0.5) * (100/3);
                        
                        return (
                            <button
                                type="button"
                                key={cup.id}
                                className={`cup-button
                                    ${cupIsUp ? "lifted" : ""}
                                    ${movesAbove ? "arc-up" : ""}
                                    ${movesBelow ? "arc-down" : ""}
                                `}
                                style={{
                                    left: `${leftPos}%`,
                                    transitionDuration:
                                        phase === "shuffling"
                                        ? `${levelSettings.moveDuration}ms`
                                        : "0ms",
                                    "--move-duration": `${levelSettings.moveDuration}ms`,
                                }}
                                disabled={!canSelectCup}
                                onClick={() =>
                                    handleCupSelect(cup.id)
                                }
                                aris-label={
                                    canSelectCup
                                        ? `Choose the ${
                                            pos_label[cup.position]
                                        } cup`
                                    : "Cup"
                                }
                            >
                                <span
                                    className={`ball ${
                                        ballIsVisable ? "visible" : ""
                                    }`}
                                />

                                <span className="cup">
                                    <span className="cup-highlight" />
                                </span>

                            </button>
                        );
                })}
            </div>

            <div className="instructions">
                <h2>How to play</h2>

                <ol>
                    <li>Choose a difficulty</li>
                    <li>Press Start Game</li>
                    <li>Remember the cup containing the ball</li>
                    <li>Follow that cup while the cups shuffle</li>
                    <li>Select a cup after the shuffle finishes</li>
                </ol>
            </div>
        </section>
    </main>
    );
}

export default App;